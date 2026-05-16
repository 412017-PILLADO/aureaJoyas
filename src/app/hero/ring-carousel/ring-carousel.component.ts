import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject
} from '@angular/core';
import { LoadingService } from '../../shared/loading.service';

const SPACING = 3.4;

@Component({
  selector: 'app-ring-carousel',
  templateUrl: './ring-carousel.component.html',
  styleUrl: './ring-carousel.component.css'
})
export class RingCarouselComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() activeIndex = 0;
  @Input() modelPaths: string[] = [
    '/ringaurea.glb',
    '/octogonal_ring.glb',
    '/anillo3.glb',
  ];
  @Output() ringChanged = new EventEmitter<number>();

  private loadingService = inject(LoadingService);
  private animFrameId = 0;
  private scene: any;
  private camera: any;
  private renderer: any;
  private groups: any[] = [];  // one Group per slot (handles rotation + contains model)
  private pivot: any;          // slides horizontally, parent of all groups
  private targetX = 0;
  private resumeTimer: any;
  private isDragging = false;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private autoRotate = true;
  private prefersReducedMotion = false;
  private resizeObserver!: ResizeObserver;
  private sceneReady = false;

  async ngAfterViewInit() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    this.initScene(THREE, GLTFLoader, DRACOLoader, RoomEnvironment);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeIndex'] && this.sceneReady) {
      this.targetX = this.activeIndex * -SPACING;
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrameId);
    this.resizeObserver?.disconnect();
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerup', this.onPointerUp);
    }
    this.renderer?.dispose();
    clearTimeout(this.resumeTimer);
  }

  private initScene(THREE: any, GLTFLoader: any, DRACOLoader: any, RoomEnvironment: any) {
    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 4.8);

    // Environment map: makes the metal rings actually reflect light like jewelry
    const pmremGen = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGen.fromScene(roomEnv, 0.04).texture;
    pmremGen.dispose();

    this.setupLighting(THREE);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    // Create one group per slot, initial tilt on each
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      group.position.x = i * SPACING;
      group.rotation.x = -0.55;
      group.rotation.z =  0.18;
      this.pivot.add(group);
      this.groups.push(group);
    }

    this.targetX = this.activeIndex * -SPACING;
    this.pivot.position.x = this.targetX;

    // Load GLBs (async), fall back to procedural geometry if file not found
    this.loadModels(THREE, GLTFLoader, DRACOLoader);

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);

    this.resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      if (!this.sceneReady) {
        this.sceneReady = true;
        this.animate();
      }
    });
    this.resizeObserver.observe(canvas);
  }

  private setupLighting(THREE: any) {
    // Env map provides ambient + reflections; directional lights add accents
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const key = new THREE.DirectionalLight(0xfff4d6, 1.6);
    key.position.set(3, 5, 6); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc4dafc, 0.7);
    fill.position.set(-5, -1, 3); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-2, 4, -5); this.scene.add(rim);
    const bottom = new THREE.DirectionalLight(0xfff0d0, 0.5);
    bottom.position.set(0, -4, 2); this.scene.add(bottom);
    const side = new THREE.DirectionalLight(0xffffff, 0.8);
    side.position.set(6, 0, 1); this.scene.add(side);
  }

  private async loadModels(THREE: any, GLTFLoader: any, DRACOLoader: any) {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const fallbacks = [
      () => this.makeClassicRing(THREE),
      () => this.makeOctRing(THREE),
      () => this.makeEngravedRing(THREE),
    ];

    for (let i = 0; i < 3; i++) {
      const group = this.groups[i];
      try {
        const gltf = await this.loadGLTF(loader, this.modelPaths[i]);
        console.log(`[Ring ${i}] GLB cargado OK`);
        group.add(this.centerAndScale(THREE, gltf.scene));
      } catch (err) {
        console.error(`[Ring ${i}] Error cargando GLB, usando fallback:`, err);
        group.add(fallbacks[i]());
      }
    }
    this.loadingService.markRingsLoaded();
  }

  private loadGLTF(loader: any, path: string): Promise<any> {
    return new Promise((resolve, reject) => loader.load(path, resolve, undefined, reject));
  }

  // Normalizes any GLB model to fit inside a 2-unit sphere, centered at origin
  private centerAndScale(THREE: any, model: any) {
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale  = maxDim > 0 ? 2 / maxDim : 1;

    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);

    // Jewelry-grade material override:
    // - lower roughness for sharper highlights
    // - boost env reflection
    // - DoubleSide because Rhino-exported meshes occasionally have faces
    //   whose normals point inward, which GPU backface culling drops →
    //   visible holes / "transparent back" of the ring.
    model.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        obj.material.roughness = 0.15;
        obj.material.envMapIntensity = 1.6;
        obj.material.side = THREE.DoubleSide;
        obj.material.needsUpdate = true;
      }
    });

    console.log('[Ring] size:', size, '| scale:', scale, '| pos:', model.position);
    return model;
  }

  // ── Procedural fallbacks ──────────────────────────────────────────────────

  private makeClassicRing(THREE: any) {
    return new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.28, 64, 128),
      new THREE.MeshPhysicalMaterial({
        color: 0xDFB874, metalness: 1, roughness: 0.22, clearcoat: 0.3, clearcoatRoughness: 0.1
      })
    );
  }

  private makeOctRing(THREE: any) {
    return new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.22, 16, 8),
      new THREE.MeshStandardMaterial({
        color: 0xE5BD7C, metalness: 0.95, roughness: 0.25, flatShading: true
      })
    );
  }

  private makeEngravedRing(THREE: any) {
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = bumpCanvas.height = 256;
    const ctx = bumpCanvas.getContext('2d')!;
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 12; j++) {
      ctx.fillStyle = j % 2 === 0 ? '#aaa' : '#555';
      ctx.fillRect(0, (j / 12) * 256, 256, 256 / 12);
    }
    return new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.26, 64, 128),
      new THREE.MeshPhysicalMaterial({
        color: 0xD9A887, metalness: 1, roughness: 0.3,
        bumpMap: new THREE.CanvasTexture(bumpCanvas), bumpScale: 0.04
      })
    );
  }

  // ── Pointer events ────────────────────────────────────────────────────────

  private onPointerDown = (e: PointerEvent) => {
    this.isDragging = true;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.autoRotate = false;
    clearTimeout(this.resumeTimer);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    const group = this.groups[this.activeIndex];
    if (group) {
      group.rotation.y += dx * 0.008;
      group.rotation.x += dy * 0.008;
    }
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    // Drag only rotates the active ring; ring switching is done via the dots.
    this.resumeTimer = setTimeout(() => { this.autoRotate = true; }, 0);
  };

  // ── Render loop ───────────────────────────────────────────────────────────

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    this.pivot.position.x += (this.targetX - this.pivot.position.x) * 0.1;
    if (this.autoRotate && !this.prefersReducedMotion) {
      const group = this.groups[this.activeIndex];
      if (group) group.rotation.y += 0.0035;
    }
    this.renderer.render(this.scene, this.camera);
  };
}
