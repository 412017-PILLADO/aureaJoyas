// One-shot conversion: public/<input>.3dm → public/<output>.glb
// Extracts cached render meshes from BrepFaces (Rhino bakes them on save
// if Display → Shaded was used).
//
// Requires (NOT in package.json — install on demand):
//   npm install --no-save rhino3dm @gltf-transform/core
//
// Usage:
//   node scripts/convert-3dm-to-glb.mjs <input.3dm> [output.glb]

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import rhino3dm from 'rhino3dm';
import { Document, NodeIO } from '@gltf-transform/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Usage: node convert-3dm-to-glb.mjs <input.3dm> [output.glb]
// Paths are resolved relative to public/ if not absolute.
const PUBLIC = resolve(__dirname, '..', 'public');
const inArg = process.argv[2] ?? 'ringaurea.3dm';
const outArg = process.argv[3] ?? inArg.replace(/\.3dm$/i, '.glb');
const SRC = resolve(PUBLIC, inArg);
const OUT = resolve(PUBLIC, outArg);
console.log(`Converting ${SRC} → ${OUT}`);

const rhino = await rhino3dm();
const bytes = readFileSync(SRC);
const file = rhino.File3dm.fromByteArray(new Uint8Array(bytes));
const objects = file.objects();

const allPositions = [];
const allIndices = [];
let vertexOffset = 0;
let facesUsed = 0;

function ingestMesh(mesh) {
  const verts = mesh.vertices();
  const faces = mesh.faces();
  const vCount = verts.count;
  const fCount = faces.count;
  for (let v = 0; v < vCount; v++) {
    const p = verts.get(v);
    allPositions.push(p[0], p[1], p[2]);
  }
  for (let f = 0; f < fCount; f++) {
    const face = faces.get(f);
    const a = face[0] + vertexOffset;
    const b = face[1] + vertexOffset;
    const c = face[2] + vertexOffset;
    const d = face[3] + vertexOffset;
    allIndices.push(a, b, c);
    if (d !== c) allIndices.push(a, c, d);
  }
  vertexOffset += vCount;
}

// MeshType enum values to try: render, analysis, preview, any, default
const meshTypeCandidates = [
  rhino.MeshType.render,
  rhino.MeshType.preview,
  rhino.MeshType.any,
  rhino.MeshType.default,
  1, 2, 0,
].filter((v) => v !== undefined);

for (let i = 0; i < objects.count; i++) {
  const obj = objects.get(i);
  const geom = obj.geometry();
  if (!geom) continue;

  if (geom instanceof rhino.Mesh) {
    ingestMesh(geom);
    facesUsed++;
    continue;
  }

  if (geom instanceof rhino.Brep) {
    const brepFaces = geom.faces();
    // Skip Breps with very few faces — they are usually planar references
    // or construction surfaces, not the ring itself.
    if (brepFaces.count < 5) {
      console.log(`  Brep [${i}]: skipped (only ${brepFaces.count} face(s) — likely construction)`);
      continue;
    }
    let extracted = 0;
    for (let bf = 0; bf < brepFaces.count; bf++) {
      const face = brepFaces.get(bf);
      let mesh = null;
      for (const mt of meshTypeCandidates) {
        try {
          mesh = face.getMesh(mt);
          if (mesh) break;
        } catch {}
      }
      if (mesh) {
        ingestMesh(mesh);
        extracted++;
        facesUsed++;
      }
    }
    console.log(`  Brep [${i}]: ${extracted}/${brepFaces.count} faces meshed`);
  }
}

console.log(`Total faces used: ${facesUsed}`);
console.log(`Verts: ${allPositions.length / 3}, tris: ${allIndices.length / 3}`);

if (allPositions.length === 0) {
  console.error('No cached render meshes found in the .3dm.');
  console.error('You need to open the file in Rhino, set Display to Shaded/Rendered, save, then re-run.');
  process.exit(2);
}

// Smooth normals
const normals = new Float32Array(allPositions.length);
for (let i = 0; i < allIndices.length; i += 3) {
  const ia = allIndices[i] * 3;
  const ib = allIndices[i + 1] * 3;
  const ic = allIndices[i + 2] * 3;
  const ax = allPositions[ia], ay = allPositions[ia + 1], az = allPositions[ia + 2];
  const bx = allPositions[ib], by = allPositions[ib + 1], bz = allPositions[ib + 2];
  const cx = allPositions[ic], cy = allPositions[ic + 1], cz = allPositions[ic + 2];
  const ux = bx - ax, uy = by - ay, uz = bz - az;
  const vx = cx - ax, vy = cy - ay, vz = cz - az;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  normals[ia]     += nx; normals[ia + 1] += ny; normals[ia + 2] += nz;
  normals[ib]     += nx; normals[ib + 1] += ny; normals[ib + 2] += nz;
  normals[ic]     += nx; normals[ic + 1] += ny; normals[ic + 2] += nz;
}
for (let i = 0; i < normals.length; i += 3) {
  const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
  normals[i] /= len; normals[i + 1] /= len; normals[i + 2] /= len;
}

// Write GLB
const doc = new Document();
const buf = doc.createBuffer();

const positions = doc.createAccessor()
  .setType('VEC3')
  .setArray(new Float32Array(allPositions))
  .setBuffer(buf);

const normalsAcc = doc.createAccessor()
  .setType('VEC3')
  .setArray(normals)
  .setBuffer(buf);

const useUint32 = allPositions.length / 3 > 65535;
const indices = doc.createAccessor()
  .setType('SCALAR')
  .setArray(useUint32 ? new Uint32Array(allIndices) : new Uint16Array(allIndices))
  .setBuffer(buf);

const material = doc.createMaterial('Gold')
  .setBaseColorFactor([0.875, 0.722, 0.455, 1])
  .setMetallicFactor(1)
  .setRoughnessFactor(0.28);

const primitive = doc.createPrimitive()
  .setAttribute('POSITION', positions)
  .setAttribute('NORMAL', normalsAcc)
  .setIndices(indices)
  .setMaterial(material);

const mesh = doc.createMesh('RingAurea').addPrimitive(primitive);
const node = doc.createNode('RingAurea').setMesh(mesh);
const scene = doc.createScene().addChild(node);
doc.getRoot().setDefaultScene(scene);

const io = new NodeIO();
const glb = await io.writeBinary(doc);
writeFileSync(OUT, glb);
console.log(`Wrote ${OUT} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
