// One-shot conversion: public/<input>.3dm → public/<output>.glb
// Extracts cached render meshes from BrepFaces (Rhino bakes them on save
// if Display → Shaded was used).
//
// Requires (NOT in package.json — install on demand):
//   npm install --no-save rhino3dm @gltf-transform/core
//
// Usage:
//   node scripts/convert-3dm-to-glb.mjs <input.3dm> [output.glb] [--keep-largest]
//
// Flags:
//   --keep-largest   Only export the Brep with the most faces. Useful when
//                    the file contains stones, engravings, or inner sleeves
//                    that show as artifacts in the rendered ring.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import rhino3dm from 'rhino3dm';
import { Document, NodeIO } from '@gltf-transform/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'public');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const inArg = args[0] ?? 'ringaurea.3dm';
const outArg = args[1] ?? inArg.replace(/\.3dm$/i, '.glb');
const KEEP_LARGEST = process.argv.includes('--keep-largest');
const MIN_FACES = 5;
const SRC = resolve(PUBLIC, inArg);
const OUT = resolve(PUBLIC, outArg);
console.log(`Converting ${SRC} → ${OUT}${KEEP_LARGEST ? ' (--keep-largest)' : ''}`);

const rhino = await rhino3dm();
const bytes = readFileSync(SRC);
const file = rhino.File3dm.fromByteArray(new Uint8Array(bytes));
const objects = file.objects();
const count = objects.count;
console.log(`Found ${count} objects in .3dm`);

const meshTypeCandidates = [
  rhino.MeshType.render,
  rhino.MeshType.preview,
  rhino.MeshType.any,
  rhino.MeshType.default,
  1, 2, 0,
].filter((v) => v !== undefined);

// ── First pass: discover candidate Breps ────────────────────────────────
const candidates = [];
for (let i = 0; i < count; i++) {
  const obj = objects.get(i);
  const geom = obj.geometry();
  if (!geom) continue;
  if (geom instanceof rhino.Mesh) {
    candidates.push({ i, kind: 'mesh', faceCount: geom.faces().count });
  } else if (geom instanceof rhino.Brep) {
    const fc = geom.faces().count;
    if (fc >= MIN_FACES) candidates.push({ i, kind: 'brep', faceCount: fc });
    else console.log(`  Brep [${i}]: skipped (${fc} face(s) — likely construction)`);
  }
}

let toProcess = candidates;
if (KEEP_LARGEST && candidates.length > 1) {
  const winner = candidates.reduce((a, b) => (a.faceCount > b.faceCount ? a : b));
  console.log(`Keeping only #${winner.i} with ${winner.faceCount} faces (--keep-largest)`);
  toProcess = [winner];
}

// ── Aggregation buffers ─────────────────────────────────────────────────
const allPositions = [];
const allIndices = [];
const allNormals = [];
let vertexOffset = 0;
let allHaveNormals = true;

function ingestMesh(mesh, flipWinding = false) {
  const verts = mesh.vertices();
  const faces = mesh.faces();
  const normals = mesh.normals();
  const vCount = verts.count;
  const fCount = faces.count;
  const hasNormals = normals && normals.count === vCount;
  if (!hasNormals) allHaveNormals = false;

  for (let v = 0; v < vCount; v++) {
    const p = verts.get(v);
    allPositions.push(p[0], p[1], p[2]);
    if (hasNormals) {
      const n = normals.get(v);
      if (flipWinding) allNormals.push(-n[0], -n[1], -n[2]);
      else allNormals.push(n[0], n[1], n[2]);
    } else {
      allNormals.push(0, 0, 0); // placeholder; will be recomputed
    }
  }

  for (let f = 0; f < fCount; f++) {
    const face = faces.get(f);
    const a = face[0] + vertexOffset;
    const b = face[1] + vertexOffset;
    const c = face[2] + vertexOffset;
    const d = face[3] + vertexOffset;
    if (flipWinding) {
      allIndices.push(c, b, a);
      if (d !== c) allIndices.push(d, c, a);
    } else {
      allIndices.push(a, b, c);
      if (d !== c) allIndices.push(a, c, d);
    }
  }

  vertexOffset += vCount;
}

// ── Process the selected Breps/Meshes ───────────────────────────────────
for (const { i, kind } of toProcess) {
  const obj = objects.get(i);
  const geom = obj.geometry();
  if (kind === 'mesh') {
    ingestMesh(geom);
    console.log(`  Mesh [${i}]: 1 mesh ingested`);
    continue;
  }
  const brepFaces = geom.faces();
  let extracted = 0;
  for (let bf = 0; bf < brepFaces.count; bf++) {
    const face = brepFaces.get(bf);
    const reversed = face.orientationIsReversed === true;
    let mesh = null;
    for (const mt of meshTypeCandidates) {
      try {
        mesh = face.getMesh(mt);
        if (mesh) break;
      } catch {}
    }
    if (mesh) {
      ingestMesh(mesh, reversed);
      extracted++;
    }
  }
  console.log(`  Brep [${i}]: ${extracted}/${brepFaces.count} faces meshed`);
}

console.log(`Pre-weld: ${allPositions.length / 3} verts, ${allIndices.length / 3} tris`);
console.log(`Normals source: ${allHaveNormals ? 'cached' : 'recomputed (no cached normals found)'}`);

if (allPositions.length === 0) {
  console.error('No cached render meshes found.');
  console.error('Open the .3dm in Rhino with Display set to Shaded/Rendered, save, then re-run.');
  process.exit(2);
}

// ── Weld coincident vertices ─────────────────────────────────────────────
// Rhino tessellates per Brep face, leaving duplicate vertices at shared
// edges with independent normals. Welding them averages the normals,
// removing the visible "seams" between faces and giving a smooth read.
{
  const SCALE = 1 / 0.0001; // resolution: 0.0001 units
  const keyMap = new Map();
  const remap = new Int32Array(allPositions.length / 3);
  const newPositions = [];
  const normalSum = []; // [x,y,z] per canonical
  const normalCount = [];

  for (let i = 0, j = 0; i < allPositions.length; i += 3, j++) {
    const x = allPositions[i], y = allPositions[i + 1], z = allPositions[i + 2];
    const k = `${Math.round(x * SCALE)},${Math.round(y * SCALE)},${Math.round(z * SCALE)}`;
    let canonical = keyMap.get(k);
    if (canonical === undefined) {
      canonical = newPositions.length / 3;
      keyMap.set(k, canonical);
      newPositions.push(x, y, z);
      normalSum.push(0, 0, 0);
      normalCount.push(0);
    }
    remap[j] = canonical;
    normalSum[canonical * 3]     += allNormals[i];
    normalSum[canonical * 3 + 1] += allNormals[i + 1];
    normalSum[canonical * 3 + 2] += allNormals[i + 2];
    normalCount[canonical]++;
  }

  const newIndices = new Array(allIndices.length);
  for (let i = 0; i < allIndices.length; i++) {
    newIndices[i] = remap[allIndices[i]];
  }

  const newNormals = new Float32Array(newPositions.length);
  for (let v = 0; v < normalCount.length; v++) {
    const nx = normalSum[v * 3];
    const ny = normalSum[v * 3 + 1];
    const nz = normalSum[v * 3 + 2];
    const len = Math.hypot(nx, ny, nz) || 1;
    newNormals[v * 3]     = nx / len;
    newNormals[v * 3 + 1] = ny / len;
    newNormals[v * 3 + 2] = nz / len;
  }

  allPositions.length = 0; allPositions.push(...newPositions);
  allIndices.length = 0;   allIndices.push(...newIndices);
  allNormals.length = 0;   allNormals.push(...newNormals);
  allHaveNormals = true;   // we re-normalized everything ourselves
}

console.log(`Post-weld: ${allPositions.length / 3} verts, ${allIndices.length / 3} tris`);

// Normals are already welded + normalized
const finalNormals = new Float32Array(allNormals);

// ── Build GLB ───────────────────────────────────────────────────────────
const doc = new Document();
const buf = doc.createBuffer();

const positions = doc.createAccessor()
  .setType('VEC3')
  .setArray(new Float32Array(allPositions))
  .setBuffer(buf);

const normalsAcc = doc.createAccessor()
  .setType('VEC3')
  .setArray(finalNormals)
  .setBuffer(buf);

const useUint32 = allPositions.length / 3 > 65535;
const indices = doc.createAccessor()
  .setType('SCALAR')
  .setArray(useUint32 ? new Uint32Array(allIndices) : new Uint16Array(allIndices))
  .setBuffer(buf);

// glTF baseColorFactor is in LINEAR space, not sRGB.
// Brand gold #DFB874 (sRGB 0.874, 0.722, 0.455) → linear ≈ (0.741, 0.488, 0.176)
const material = doc.createMaterial('Gold')
  .setBaseColorFactor([0.741, 0.488, 0.176, 1])
  .setMetallicFactor(1)
  .setRoughnessFactor(0.22);

const primitive = doc.createPrimitive()
  .setAttribute('POSITION', positions)
  .setAttribute('NORMAL', normalsAcc)
  .setIndices(indices)
  .setMaterial(material);

const mesh = doc.createMesh('Ring').addPrimitive(primitive);
const node = doc.createNode('Ring').setMesh(mesh);
const scene = doc.createScene().addChild(node);
doc.getRoot().setDefaultScene(scene);

const io = new NodeIO();
const glb = await io.writeBinary(doc);
writeFileSync(OUT, glb);
console.log(`Wrote ${OUT} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
