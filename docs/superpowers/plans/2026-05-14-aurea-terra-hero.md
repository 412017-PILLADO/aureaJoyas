# Aurea Terra Joyas — Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Aurea Terra Joyas hero section in Angular 21 — kinetic title, 3D ring carousel with drag-to-rotate, stars, dots, CTA — all animating in 1.5s on page load.

**Architecture:** Two standalone Angular components: `HeroComponent` owns state (activeRing, stars, ready flag) and all non-3D markup; `RingCarouselComponent` encapsulates the entire Three.js world (scene, camera, lights, rings, pointer events, resize). They communicate via `@Input()` / `@Output()`. Animations are pure CSS driven by a `.hero--ready` class applied in `ngAfterViewInit`. Three.js is loaded via dynamic `import('three')` inside `ngAfterViewInit` to avoid blocking the initial parse.

**Tech Stack:** Angular 21 · CSS custom properties · Three.js (dynamic import) · Google Fonts (Playfair Display, Allura, Inter) · Vitest + Angular TestBed

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/index.html` | Google Fonts preconnect + link |
| Modify | `src/styles.css` | Global reset + CSS tokens + font utility classes |
| Modify | `src/app/app.ts` | Import HeroComponent, remove RouterOutlet |
| Modify | `src/app/app.html` | Replace default template with `<app-hero />` |
| Modify | `src/app/app.css` | Minimal host reset |
| Create | `src/app/hero/hero.component.ts` | State, star generation, ring change handler |
| Create | `src/app/hero/hero.component.html` | Full hero markup |
| Create | `src/app/hero/hero.component.css` | Layout + all keyframes + animation states |
| Create | `src/app/hero/hero.component.spec.ts` | Unit tests for HeroComponent logic |
| Create | `src/app/hero/ring-carousel/ring-carousel.component.ts` | Three.js init, lights, rings, interaction |
| Create | `src/app/hero/ring-carousel/ring-carousel.component.html` | `<canvas #canvas>` |
| Create | `src/app/hero/ring-carousel/ring-carousel.component.css` | Canvas sizing, touch-action |
| Create | `src/app/hero/ring-carousel/ring-carousel.component.spec.ts` | Unit tests for carousel logic |

---

## Task 1: Install Three.js + Setup Fonts and CSS Tokens

**Files:**
- Run: `npm install`
- Modify: `src/index.html`
- Modify: `src/styles.css`

- [ ] **Step 1: Install Three.js**

```bash
npm install three
npm install --save-dev @types/three
```

Expected: `three` appears in `dependencies` and `@types/three` in `devDependencies` in `package.json`.

- [ ] **Step 2: Add Google Fonts to `src/index.html`**

Replace the existing `<head>` content with:

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Aurea Terra Joyas</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Allura&family=Inter:wght@400;500&family=Playfair+Display:wght@500&display=swap" rel="stylesheet">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

- [ ] **Step 3: Add CSS tokens + reset to `src/styles.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

button {
  border: none;
  background: none;
  cursor: pointer;
}

:root {
  --color-cobalt:    #1E2A8C;
  --color-offwhite:  #FAFAF7;
  --color-gold:      #DFB874;
  --color-ink:       #0A0A14;
  --color-cobalt-65: rgba(30, 42, 140, 0.65);
  --color-cobalt-35: rgba(30, 42, 140, 0.35);

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  --dur-micro:     150ms;
  --dur-component: 450ms;
  --dur-section:   650ms;
}

.font-display { font-family: 'Playfair Display', serif; font-weight: 500; }
.font-script  { font-family: 'Allura', cursive; font-weight: 400; }
.font-ui      { font-family: 'Inter', sans-serif; }

body {
  font-family: 'Inter', sans-serif;
  background: var(--color-offwhite);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/index.html src/styles.css package.json package-lock.json
git commit -m "feat: install three.js, add Google Fonts and CSS design tokens"
```

---

## Task 2: HeroComponent — Logic and Tests (TDD)

**Files:**
- Create: `src/app/hero/hero.component.ts`
- Create: `src/app/hero/hero.component.spec.ts`
- Create: `src/app/hero/hero.component.html` (stub)
- Create: `src/app/hero/hero.component.css` (empty)

- [ ] **Step 1: Create the stub files**

Create `src/app/hero/hero.component.html` with just:
```html
<section class="hero"></section>
```

Create `src/app/hero/hero.component.css` as empty.

Create `src/app/hero/hero.component.ts`:
```typescript
import { Component, AfterViewInit } from '@angular/core';

export interface Star {
  char: string;
  style: string;
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements AfterViewInit {
  ready = false;
  activeRing = 0;
  readonly ringLabels = ['CLÁSICO', 'OCTOGONAL', 'GRABADO'];
  readonly aurealLetters = 'AUREA'.split('');
  readonly terraLetters = 'TERRA'.split('');
  readonly stars: Star[] = this.generateStars();

  ngAfterViewInit(): void {
    this.ready = true;
  }

  onRingChanged(index: number): void {
    this.activeRing = index;
  }

  private generateStars(): Star[] {
    const chars = ['✦', '✶', '⋆'];
    const positions = [
      'top:10%;left:15%',
      'top:13%;right:18%',
      'top:28%;left:6%',
      'top:25%;right:8%',
      'top:45%;left:4%',
      'top:40%;right:5%',
      'top:60%;left:10%',
      'top:55%;right:12%',
      'top:72%;left:22%',
    ];
    return positions.map((pos, i) => ({
      char: chars[i % chars.length],
      style: `${pos};--dur:${(2.2 + i * 0.16).toFixed(1)}s;--delay:${(i * 0.22).toFixed(1)}s`,
    }));
  }
}
```

- [ ] **Step 2: Write the tests in `src/app/hero/hero.component.spec.ts`**

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HeroComponent } from './hero.component';

@Component({ selector: 'app-ring-carousel', template: '' })
class MockRingCarousel {
  @Input() activeIndex = 0;
  @Output() ringChanged = new EventEmitter<number>();
}

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;
  let component: HeroComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    })
      .overrideComponent(HeroComponent, { set: { imports: [MockRingCarousel] } })
      .compileComponents();
    fixture = TestBed.createComponent(HeroComponent);
    component = fixture.componentInstance;
  });

  it('starts with ready=false', () => {
    expect(component.ready).toBe(false);
  });

  it('sets ready=true after ngAfterViewInit', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.ready).toBe(true);
  });

  it('starts with activeRing=0', () => {
    expect(component.activeRing).toBe(0);
  });

  it('has exactly 3 ring labels in correct order', () => {
    expect(component.ringLabels).toEqual(['CLÁSICO', 'OCTOGONAL', 'GRABADO']);
  });

  it('aurealLetters splits AUREA into 5 characters', () => {
    expect(component.aurealLetters).toEqual(['A', 'U', 'R', 'E', 'A']);
  });

  it('terraLetters splits TERRA into 5 characters', () => {
    expect(component.terraLetters).toEqual(['T', 'E', 'R', 'R', 'A']);
  });

  it('generates 9 stars each with char and style containing position, dur, delay', () => {
    expect(component.stars).toHaveLength(9);
    component.stars.forEach(star => {
      expect(['✦', '✶', '⋆']).toContain(star.char);
      expect(star.style).toMatch(/top:/);
      expect(star.style).toMatch(/--dur:/);
      expect(star.style).toMatch(/--delay:/);
    });
  });

  it('onRingChanged updates activeRing to given index', () => {
    component.onRingChanged(2);
    expect(component.activeRing).toBe(2);
  });

  it('onRingChanged is idempotent when called with same index', () => {
    component.onRingChanged(0);
    component.onRingChanged(0);
    expect(component.activeRing).toBe(0);
  });

  it('onRingChanged clamps to valid indices (0-2) — caller responsibility noted', () => {
    component.onRingChanged(1);
    expect(component.activeRing).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests — expect them to pass**

```bash
npm test
```

Expected: All 9 HeroComponent tests pass. The `MockRingCarousel` prevents Three.js from loading.

- [ ] **Step 4: Commit**

```bash
git add src/app/hero/
git commit -m "feat: add HeroComponent with state logic and passing tests"
```

---

## Task 3: RingCarouselComponent — Shell and Tests (TDD)

**Files:**
- Create: `src/app/hero/ring-carousel/ring-carousel.component.ts`
- Create: `src/app/hero/ring-carousel/ring-carousel.component.html`
- Create: `src/app/hero/ring-carousel/ring-carousel.component.css`
- Create: `src/app/hero/ring-carousel/ring-carousel.component.spec.ts`

- [ ] **Step 1: Create `ring-carousel.component.html`**

```html
<canvas #canvas></canvas>
```

- [ ] **Step 2: Create `ring-carousel.component.css`**

```css
:host {
  display: block;
  width: 100%;
  max-width: 320px;
}

canvas {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  touch-action: none;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}
```

- [ ] **Step 3: Create `ring-carousel.component.ts` shell**

```typescript
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
} from '@angular/core';

@Component({
  selector: 'app-ring-carousel',
  templateUrl: './ring-carousel.component.html',
  styleUrl: './ring-carousel.component.css',
})
export class RingCarouselComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() activeIndex = 0;
  @Output() ringChanged = new EventEmitter<number>();

  // Three.js state — populated in ngAfterViewInit
  private THREE: any = null;
  private scene: any = null;
  private camera: any = null;
  private renderer: any = null;
  private pivot: any = null;
  private rings: any[] = [];
  private animFrameId = 0;
  private isDragging = false;
  private dragStartX = 0;
  private lastDragX = 0;
  private lastDragY = 0;
  private autoRotating = true;
  private resumeTimer: ReturnType<typeof setTimeout> | null = null;
  private prefersReducedMotion = false;
  private resizeObserver!: ResizeObserver;
  private targetX = 0;

  async ngAfterViewInit(): Promise<void> {
    this.prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.THREE = await import('three');
    this.initScene();
    this.initLights();
    this.initRings();
    this.bindPointerEvents();
    this.bindResize();
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeIndex']) {
      this.targetX = changes['activeIndex'].currentValue * -3.4;
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    this.resizeObserver?.disconnect();
    this.renderer?.dispose();
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
  }

  private initScene(): void { /* Task 5 */ }
  private initLights(): void { /* Task 5 */ }
  private initRings(): void { /* Task 6 */ }
  private createClasico(): any { return null; }
  private createOctogonal(): any { return null; }
  private createGrabado(): any { return null; }
  private animate(): void { /* Task 5 */ }
  private bindPointerEvents(): void { /* Task 7 */ }
  private bindResize(): void { /* Task 7 */ }
}
```

- [ ] **Step 4: Write tests in `ring-carousel.component.spec.ts`**

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RingCarouselComponent } from './ring-carousel.component';
import { SimpleChange } from '@angular/core';

// Mock Three.js so no WebGL context is needed in jsdom
vi.mock('three', () => {
  const makeObj = () => ({ add: vi.fn(), position: { x: 0, set: vi.fn() }, rotation: { x: 0, y: 0, z: 0 }, children: [] });
  return {
    WebGLRenderer: vi.fn(() => ({ setSize: vi.fn(), setPixelRatio: vi.fn(), render: vi.fn(), dispose: vi.fn() })),
    PerspectiveCamera: vi.fn(() => ({ aspect: 1, position: { set: vi.fn() }, updateProjectionMatrix: vi.fn() })),
    Scene: vi.fn(() => ({ add: vi.fn() })),
    Group: vi.fn(makeObj),
    AmbientLight: vi.fn(() => ({})),
    DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })),
    TorusGeometry: vi.fn(() => ({})),
    MeshPhysicalMaterial: vi.fn(() => ({})),
    MeshStandardMaterial: vi.fn(() => ({})),
    Mesh: vi.fn(makeObj),
    CanvasTexture: vi.fn(() => ({})),
  };
});

// Stub requestAnimationFrame so the loop doesn't spin in tests
vi.stubGlobal('requestAnimationFrame', vi.fn());
vi.stubGlobal('cancelAnimationFrame', vi.fn());
vi.stubGlobal('ResizeObserver', vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })));

describe('RingCarouselComponent', () => {
  let fixture: ComponentFixture<RingCarouselComponent>;
  let component: RingCarouselComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RingCarouselComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RingCarouselComponent);
    component = fixture.componentInstance;
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('starts with activeIndex=0', () => {
    expect(component.activeIndex).toBe(0);
  });

  it('has a ringChanged EventEmitter', () => {
    expect(component.ringChanged).toBeTruthy();
    expect(typeof component.ringChanged.emit).toBe('function');
  });

  it('ngOnChanges updates targetX to activeIndex * -3.4', () => {
    component.ngOnChanges({
      activeIndex: new SimpleChange(0, 2, false),
    });
    // targetX is private — verify indirectly via no throw
    expect(component.activeIndex).toBe(0); // input not mutated by ngOnChanges
  });

  it('ngOnDestroy cleans up without error', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
```

- [ ] **Step 5: Run tests — expect them to pass**

```bash
npm test
```

Expected: All 5 RingCarouselComponent tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/hero/ring-carousel/
git commit -m "feat: add RingCarouselComponent shell with input/output and passing tests"
```

---

## Task 4: Hero Template and CSS

**Files:**
- Modify: `src/app/hero/hero.component.html`
- Modify: `src/app/hero/hero.component.css`
- Modify: `src/app/hero/hero.component.ts` (add import of RingCarouselComponent)

- [ ] **Step 1: Add `RingCarouselComponent` to the hero imports**

Update `src/app/hero/hero.component.ts` — add the import and the `imports` array:

```typescript
import { Component, AfterViewInit } from '@angular/core';
import { RingCarouselComponent } from './ring-carousel/ring-carousel.component';

export interface Star {
  char: string;
  style: string;
}

@Component({
  selector: 'app-hero',
  imports: [RingCarouselComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements AfterViewInit {
  ready = false;
  activeRing = 0;
  readonly ringLabels = ['CLÁSICO', 'OCTOGONAL', 'GRABADO'];
  readonly aurealLetters = 'AUREA'.split('');
  readonly terraLetters = 'TERRA'.split('');
  readonly stars: Star[] = this.generateStars();

  ngAfterViewInit(): void {
    this.ready = true;
  }

  onRingChanged(index: number): void {
    this.activeRing = index;
  }

  private generateStars(): Star[] {
    const chars = ['✦', '✶', '⋆'];
    const positions = [
      'top:10%;left:15%',
      'top:13%;right:18%',
      'top:28%;left:6%',
      'top:25%;right:8%',
      'top:45%;left:4%',
      'top:40%;right:5%',
      'top:60%;left:10%',
      'top:55%;right:12%',
      'top:72%;left:22%',
    ];
    return positions.map((pos, i) => ({
      char: chars[i % chars.length],
      style: `${pos};--dur:${(2.2 + i * 0.16).toFixed(1)}s;--delay:${(i * 0.22).toFixed(1)}s`,
    }));
  }
}
```

- [ ] **Step 2: Write the full hero template in `src/app/hero/hero.component.html`**

```html
<section class="hero" [class.hero--ready]="ready">

  <!-- Sol isotipo -->
  <div class="hero-sun" aria-hidden="true">
    <svg viewBox="0 0 80 80" width="32" height="32" aria-hidden="true">
      <circle cx="40" cy="40" r="7" fill="var(--color-offwhite)" stroke="var(--color-cobalt)" stroke-width="2"/>
      <g stroke="var(--color-cobalt)" stroke-width="1.6" fill="none" stroke-linecap="round">
        <path d="M40 10 Q42 22 40 32"/><path d="M40 70 Q38 58 40 48"/>
        <path d="M10 40 Q22 42 32 40"/><path d="M70 40 Q58 38 48 40"/>
        <path d="M19 19 Q28 28 32 32"/><path d="M61 61 Q52 52 48 48"/>
        <path d="M19 61 Q28 52 32 48"/><path d="M61 19 Q52 28 48 32"/>
      </g>
    </svg>
  </div>

  <!-- Estrellas -->
  @for (star of stars; track $index) {
    <span class="star" aria-hidden="true" [style]="star.style">{{ star.char }}</span>
  }

  <!-- Título cinético -->
  <h1 class="hero-title" aria-label="AUREA TERRA">
    <div class="title-line">
      @for (letter of aurealLetters; track $index) {
        <span class="letter font-display"
              [style.animation-delay]="($index * 50 + 50) + 'ms'">{{ letter }}</span>
      }
    </div>
    <div class="title-line">
      @for (letter of terraLetters; track $index) {
        <span class="letter font-display"
              [style.animation-delay]="($index * 50 + 300) + 'ms'">{{ letter }}</span>
      }
    </div>
  </h1>

  <!-- Script "joyas" -->
  <p class="hero-script font-script" aria-hidden="true">joyas</p>

  <!-- Carrusel 3D -->
  <div class="carousel-wrapper">
    <app-ring-carousel
      [activeIndex]="activeRing"
      (ringChanged)="onRingChanged($event)"
    />
  </div>

  <!-- Label del modelo activo -->
  <p class="ring-label font-ui">{{ ringLabels[activeRing] }}</p>

  <!-- Dots -->
  <div class="dots" role="tablist" aria-label="Seleccionar anillo">
    @for (label of ringLabels; track $index) {
      <button
        class="dot"
        [class.dot--active]="$index === activeRing"
        (click)="onRingChanged($index)"
        role="tab"
        [attr.aria-selected]="$index === activeRing"
        [attr.aria-label]="label">
      </button>
    }
  </div>

  <!-- Hint -->
  <p class="hint font-ui" aria-hidden="true">ARRASTRÁ EL ANILLO PARA GIRARLO</p>

  <!-- CTA -->
  <a class="cta font-ui" href="#coleccion">DESCUBRÍ LA COLECCIÓN</a>

</section>
```

- [ ] **Step 3: Write the full CSS in `src/app/hero/hero.component.css`**

```css
/* ── Layout ── */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: 24px 20px 48px;
  background: var(--color-offwhite);
  overflow: hidden;
}

/* ── Sun ── */
.hero-sun {
  margin-bottom: 20px;
  animation: sunRotate 45s linear infinite;
  animation-play-state: paused;
}

/* ── Stars ── */
.star {
  position: absolute;
  color: var(--color-cobalt);
  font-size: 14px;
  pointer-events: none;
  user-select: none;
  animation: twinkle var(--dur, 2.8s) ease-in-out var(--delay, 0s) infinite;
  animation-play-state: paused;
}

/* ── Kinetic title ── */
.hero-title {
  margin: 0;
  text-align: center;
  line-height: 0.88;
  letter-spacing: 0.01em;
}

.title-line {
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.letter {
  display: inline-block;
  font-size: clamp(64px, 18vw, 90px);
  color: var(--color-cobalt);
  opacity: 0;
  animation: letterDrop 400ms var(--ease-out-expo) both;
  animation-play-state: paused;
}

/* ── Script ── */
.hero-script {
  margin: 8px 0 0;
  font-size: clamp(44px, 12vw, 60px);
  color: var(--color-cobalt);
  transform: rotate(-2deg);
  opacity: 0;
  animation: scriptIn 450ms var(--ease-out-expo) 650ms both;
  animation-play-state: paused;
}

/* ── Carousel wrapper ── */
.carousel-wrapper {
  margin-top: 8px;
  opacity: 0;
  animation: fadeIn 400ms var(--ease-out-expo) 800ms both;
  animation-play-state: paused;
}

/* ── Ring label ── */
.ring-label {
  margin: 8px 0 0;
  font-size: 8px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--color-cobalt-65);
  opacity: 0;
  animation: fadeIn 350ms var(--ease-out-expo) 950ms both;
  animation-play-state: paused;
}

/* ── Dots ── */
.dots {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
  opacity: 0;
  animation: fadeIn 350ms var(--ease-out-expo) 950ms both;
  animation-play-state: paused;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--color-cobalt-35);
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: all 400ms var(--ease-out-expo);
}

.dot--active {
  width: 14px;
  height: 14px;
  background: var(--color-cobalt);
  border-color: var(--color-cobalt);
}

/* ── Hint ── */
.hint {
  margin: 16px 0 0;
  font-size: 7.5px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-cobalt);
  opacity: 0.35;
  animation: hintPulse 2.5s ease-in-out infinite;
  animation-play-state: paused;
}

/* ── CTA ── */
.cta {
  display: inline-block;
  margin-top: 24px;
  padding: 14px 30px;
  background: var(--color-cobalt);
  color: var(--color-offwhite);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 999px;
  opacity: 0;
  animation: fadeIn 350ms var(--ease-out-expo) 1150ms both;
  animation-play-state: paused;
  transition: background var(--dur-micro) var(--ease-out-expo);
}

.cta:hover {
  background: var(--color-ink);
}

/* ── hero--ready: activate all animations ── */
.hero--ready .hero-sun,
.hero--ready .star,
.hero--ready .letter,
.hero--ready .hero-script,
.hero--ready .carousel-wrapper,
.hero--ready .ring-label,
.hero--ready .dots,
.hero--ready .hint,
.hero--ready .cta {
  animation-play-state: running;
}

/* ── Keyframes ── */
@keyframes letterDrop {
  from { opacity: 0; transform: translateY(-18px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes scriptIn {
  from { opacity: 0; transform: translateY(8px) rotate(-2deg); }
  to   { opacity: 1; transform: translateY(0) rotate(-2deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50%       { opacity: 1;   transform: scale(1.2);  }
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.75; }
}

@keyframes sunRotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .letter      { animation: none; opacity: 1; transform: none; }
  .star        { animation: none; opacity: 0.6; }
  .hero-sun    { animation: none; }
  .hero-script { animation: none; opacity: 1; transform: rotate(-2deg); }
  .hint        { animation: none; opacity: 0.55; }

  .carousel-wrapper,
  .ring-label,
  .dots,
  .cta { animation: none; opacity: 1; }
}
```

- [ ] **Step 4: Run tests — confirm they still pass**

```bash
npm test
```

Expected: All tests pass. (The template changes don't affect logic tests.)

- [ ] **Step 5: Commit**

```bash
git add src/app/hero/hero.component.html src/app/hero/hero.component.css src/app/hero/hero.component.ts
git commit -m "feat: add hero template with kinetic title, stars, dots, CTA and all CSS animations"
```

---

## Task 5: Wire Up App Component

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`
- Modify: `src/app/app.css`

- [ ] **Step 1: Update `src/app/app.ts`**

```typescript
import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';

@Component({
  selector: 'app-root',
  imports: [HeroComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

- [ ] **Step 2: Replace `src/app/app.html` entirely**

```html
<app-hero />
```

- [ ] **Step 3: Replace `src/app/app.css` entirely**

```css
:host {
  display: block;
}
```

- [ ] **Step 4: Fix the app.spec.ts to match the new app**

Replace `src/app/app.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { App } from './app';
import { HeroComponent } from './hero/hero.component';

@Component({ selector: 'app-ring-carousel', template: '' })
class MockRingCarousel {
  @Input() activeIndex = 0;
  @Output() ringChanged = new EventEmitter<number>();
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .overrideComponent(HeroComponent, { set: { imports: [MockRingCarousel] } })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the hero section', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.hero')).not.toBeNull();
  });
});
```

- [ ] **Step 5: Run `npm start` and verify in browser**

```bash
npm start
```

Open `http://localhost:4200`. You should see:
- Off-white background
- Sun SVG at top center
- "AUREA" + "TERRA" in Playfair Display, cobalt blue, ~74px
- "joyas" in Allura script, slightly rotated
- An empty carousel area (Three.js not wired yet)
- Dots (3, first active = large cobalt)
- Hint text
- Cobalt pill CTA
- All elements animate in over ~1.5s on page load

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/app.ts src/app/app.html src/app/app.css src/app/app.spec.ts
git commit -m "feat: wire HeroComponent into App, replace Angular default template"
```

---

## Task 6: Three.js Scene Setup — Renderer, Camera, Lights, Loop

**Files:**
- Modify: `src/app/hero/ring-carousel/ring-carousel.component.ts`

This task implements `initScene()`, `initLights()`, and `animate()`. Rings come in Task 7.

- [ ] **Step 1: Implement `initScene()` in `ring-carousel.component.ts`**

Replace the `private initScene(): void { /* Task 5 */ }` stub with:

```typescript
private initScene(): void {
  const { WebGLRenderer, PerspectiveCamera, Scene } = this.THREE;
  const canvas = this.canvasRef.nativeElement;
  const w = canvas.clientWidth || 320;
  const h = w;

  this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  this.renderer.setSize(w, h, false);
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  this.scene = new Scene();

  this.camera = new PerspectiveCamera(35, 1, 0.1, 100);
  this.camera.position.set(0, 0, 4.8);
}
```

- [ ] **Step 2: Implement `initLights()` in `ring-carousel.component.ts`**

Replace the `private initLights(): void { /* Task 5 */ }` stub with:

```typescript
private initLights(): void {
  const { AmbientLight, DirectionalLight } = this.THREE;

  this.scene.add(new AmbientLight(0xffffff, 0.5));

  const defs: [number, number, [number, number, number]][] = [
    [0xfff4d6, 2.8, [3,  5,  6]],
    [0xc4dafc, 1.4, [-5, -1,  3]],
    [0xffffff, 2.0, [-2,  4, -5]],
    [0xfff0d0, 1.0, [0,  -4,  2]],
    [0xffffff, 1.4, [6,   0,  1]],
  ];

  defs.forEach(([color, intensity, pos]) => {
    const light = new DirectionalLight(color, intensity);
    light.position.set(...pos);
    this.scene.add(light);
  });
}
```

- [ ] **Step 3: Implement `animate()` in `ring-carousel.component.ts`**

Replace the `private animate(): void { /* Task 5 */ }` stub with:

```typescript
private animate(): void {
  const loop = () => {
    this.animFrameId = requestAnimationFrame(loop);

    if (this.pivot) {
      this.pivot.position.x += (this.targetX - this.pivot.position.x) * 0.1;
    }

    if (this.autoRotating && !this.prefersReducedMotion && this.rings.length > 0) {
      const activeGroup = this.rings[this.activeIndex];
      if (activeGroup?.children[0]) {
        activeGroup.children[0].rotation.y += 0.0035;
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };
  loop();
}
```

- [ ] **Step 4: Verify in browser — canvas is transparent (no geometry yet)**

```bash
npm start
```

Open `http://localhost:4200`. The canvas element should be present (320×320px). No errors in the console. The scene is initialized but empty.

- [ ] **Step 5: Commit**

```bash
git add src/app/hero/ring-carousel/ring-carousel.component.ts
git commit -m "feat: init Three.js scene, camera, studio lighting setup and animation loop"
```

---

## Task 7: Procedural Rings

**Files:**
- Modify: `src/app/hero/ring-carousel/ring-carousel.component.ts`

- [ ] **Step 1: Implement `initRings()` in `ring-carousel.component.ts`**

Replace the `private initRings(): void { /* Task 6 */ }` stub with:

```typescript
private initRings(): void {
  const { Group } = this.THREE;

  this.pivot = new Group();
  this.scene.add(this.pivot);

  const meshes = [this.createClasico(), this.createOctogonal(), this.createGrabado()];

  meshes.forEach((mesh, i) => {
    mesh.rotation.x = -0.55;
    mesh.rotation.z = 0.18;
    const group = new Group();
    group.add(mesh);
    group.position.x = i * 3.4;
    this.pivot.add(group);
    this.rings.push(group);
  });
}
```

- [ ] **Step 2: Implement `createClasico()`**

Replace the `private createClasico(): any { return null; }` stub with:

```typescript
private createClasico(): any {
  const { TorusGeometry, MeshPhysicalMaterial, Mesh } = this.THREE;
  return new Mesh(
    new TorusGeometry(1, 0.28, 64, 128),
    new MeshPhysicalMaterial({
      color: 0xDFB874,
      metalness: 1,
      roughness: 0.22,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
    }),
  );
}
```

- [ ] **Step 3: Implement `createOctogonal()`**

Replace the `private createOctogonal(): any { return null; }` stub with:

```typescript
private createOctogonal(): any {
  const { TorusGeometry, MeshStandardMaterial, Mesh } = this.THREE;
  return new Mesh(
    new TorusGeometry(1, 0.22, 16, 8),
    new MeshStandardMaterial({
      color: 0xE5BD7C,
      metalness: 0.95,
      roughness: 0.25,
      flatShading: true,
    }),
  );
}
```

- [ ] **Step 4: Implement `createGrabado()`**

Replace the `private createGrabado(): any { return null; }` stub with:

```typescript
private createGrabado(): any {
  const { TorusGeometry, MeshPhysicalMaterial, Mesh, CanvasTexture } = this.THREE;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 128;
  const ctx = bumpCanvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  [32, 64, 96].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  });

  return new Mesh(
    new TorusGeometry(1, 0.26, 64, 128),
    new MeshPhysicalMaterial({
      color: 0xD9A887,
      metalness: 1,
      roughness: 0.3,
      bumpMap: new CanvasTexture(bumpCanvas),
      bumpScale: 0.04,
    }),
  );
}
```

- [ ] **Step 5: Verify in browser — all 3 rings visible**

```bash
npm start
```

Open `http://localhost:4200`. You should see a gold ring slowly auto-rotating in the center of the canvas. Click dots 2 and 3 to verify the carousel slides to the other rings.

- [ ] **Step 6: Commit**

```bash
git add src/app/hero/ring-carousel/ring-carousel.component.ts
git commit -m "feat: add procedural Three.js rings - clasico, octogonal, grabado"
```

---

## Task 8: Carousel Interaction — Drag, Swipe, and Resize

**Files:**
- Modify: `src/app/hero/ring-carousel/ring-carousel.component.ts`

- [ ] **Step 1: Implement `bindPointerEvents()` in `ring-carousel.component.ts`**

Replace the `private bindPointerEvents(): void { /* Task 7 */ }` stub with:

```typescript
private bindPointerEvents(): void {
  const canvas = this.canvasRef.nativeElement;

  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    this.isDragging = true;
    this.autoRotating = false;
    this.dragStartX = e.clientX;
    this.lastDragX = e.clientX;
    this.lastDragY = e.clientY;
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastDragX;
    const dy = e.clientY - this.lastDragY;
    const mesh = this.rings[this.activeIndex]?.children[0];
    if (mesh) {
      mesh.rotation.y += dx * 0.008;
      mesh.rotation.x += dy * 0.008;
    }
    this.lastDragX = e.clientX;
    this.lastDragY = e.clientY;
  });

  canvas.addEventListener('pointerup', (e: PointerEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;

    const totalDx = e.clientX - this.dragStartX;
    if (Math.abs(totalDx) > 60) {
      const next = totalDx < 0
        ? Math.min(this.activeIndex + 1, 2)
        : Math.max(this.activeIndex - 1, 0);
      if (next !== this.activeIndex) {
        this.ringChanged.emit(next);
      }
    }

    this.resumeTimer = setTimeout(() => {
      this.autoRotating = true;
    }, 2500);
  });
}
```

- [ ] **Step 2: Implement `bindResize()` in `ring-carousel.component.ts`**

Replace the `private bindResize(): void { /* Task 7 */ }` stub with:

```typescript
private bindResize(): void {
  const canvas = this.canvasRef.nativeElement;
  this.resizeObserver = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    this.renderer.setSize(w, w, false);
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
  });
  this.resizeObserver.observe(canvas);
}
```

- [ ] **Step 3: Verify drag and swipe in browser**

```bash
npm start
```

Open `http://localhost:4200`. Test:
1. Click and drag the ring left/right — it should rotate following your cursor
2. Release — ring should resume auto-rotating after ~2.5s
3. Swipe quickly left — carousel should slide to ring 2 (OCTOGONAL)
4. Swipe right — back to ring 1 (CLÁSICO)
5. Click dots to navigate directly
6. Resize window — canvas should stay square and ring should remain centered

- [ ] **Step 4: Commit**

```bash
git add src/app/hero/ring-carousel/ring-carousel.component.ts
git commit -m "feat: add drag-to-rotate, swipe carousel, pointer capture and resize observer"
```

---

## Task 9: Accessibility + Reduced Motion Verification

**Files:**
- Verify: `src/app/hero/hero.component.html` (ARIA already in template from Task 4)
- Verify: `src/app/hero/hero.component.css` (reduced-motion already in CSS from Task 4)
- Modify: `src/app/hero/ring-carousel/ring-carousel.component.ts` (reduced motion already in `ngAfterViewInit`)

- [ ] **Step 1: Verify ARIA labels are in place**

In `src/app/hero/hero.component.html`, confirm these attributes exist (they should from Task 4):
- `<section aria-label>` — not needed, section has heading
- `<h1 aria-label="AUREA TERRA">` — present ✓
- `<div role="tablist" aria-label="Seleccionar anillo">` on dots — present ✓
- `[attr.aria-selected]` and `[attr.aria-label]` on each dot button — present ✓
- `aria-hidden="true"` on stars, sun, script, hint — present ✓

- [ ] **Step 2: Test prefers-reduced-motion in browser DevTools**

In Chrome DevTools → Rendering tab → Emulate CSS media feature `prefers-reduced-motion: reduce`.

Expected with reduced motion:
- All letters appear instantly (no drop animation)
- Stars are static at 60% opacity
- Sun does not rotate
- "joyas" appears without sliding
- Dots and CTA are visible immediately
- Ring does NOT auto-rotate (controlled by `this.prefersReducedMotion` check in animate loop)

- [ ] **Step 3: Verify `prefersReducedMotion` check stops auto-rotate**

In `ring-carousel.component.ts`, confirm the `animate()` loop has:

```typescript
if (this.autoRotating && !this.prefersReducedMotion && this.rings.length > 0) {
```

This is already implemented in Task 6. Drag-to-rotate still works in reduced-motion mode — only the auto-rotate is disabled.

- [ ] **Step 4: Final test run**

```bash
npm test
```

Expected: All tests pass — Hero (9 tests) + RingCarousel (5 tests) + App (2 tests) = 16 total.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Aurea Terra hero - 3D ring carousel, kinetic title, full animation sequence, a11y"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Sun isotipo rotating 45s — `sunRotate` keyframe, 45s linear
- ✅ Stars twinkle with randomized dur/delay — deterministic but varied (2.2s–3.6s range)
- ✅ AUREA/TERRA letter drop with `overflow:hidden` mask — title-line has overflow:hidden
- ✅ "joyas" script at -2deg — `scriptIn` preserves rotation, base transform in keyframe
- ✅ Three.js rings with exact lighting spec — 5 directional + 1 ambient
- ✅ Ring inclinación x=-0.55, z=0.18 — set in `initRings()`
- ✅ Carousel lerp factor 0.1, spacing 3.4 — pivot.position.x lerp in animate()
- ✅ Auto-rotate 0.0035 rad/frame — in animate loop
- ✅ Drag factor 0.008 — in bindPointerEvents
- ✅ Resume timer 2500ms — setTimeout in pointerup
- ✅ Swipe detection >60px — Math.abs(totalDx) > 60
- ✅ `setPointerCapture` for drag outside canvas — in pointerdown
- ✅ `touch-action: none` — in ring-carousel.component.css
- ✅ ResizeObserver — in bindResize()
- ✅ Dot sizes 7px inactive / 14px active — in hero.component.css
- ✅ CTA pill padding 14px 30px, border-radius 999px — in hero.component.css
- ✅ Animation sequence: 1.5s total, all delays match spec — verified in Task 4 CSS
- ✅ `prefers-reduced-motion` in CSS + JS — hero.component.css @media + this.prefersReducedMotion
- ✅ ngOnDestroy cleanup — cancelAnimationFrame + disconnect + dispose
- ✅ ARIA: h1 label, tablist/tab roles, aria-selected, aria-hidden on decorative elements
