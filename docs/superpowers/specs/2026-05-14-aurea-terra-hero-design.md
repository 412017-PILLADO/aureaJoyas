# Aurea Terra Joyas — Hero Design Spec
**Date:** 2026-05-14  
**Scope:** Hero section only (mobile-first). Full landing iterated after.  
**Stack:** Angular 21 · CSS puro · Three.js · sin Tailwind · sin GSAP

---

## 1. Arquitectura de componentes

```
src/app/
  app.ts / app.html / app.css        ← shell, monta HeroComponent
  hero/
    hero.component.ts                ← estado del carrusel, lógica de cambio de anillo
    hero.component.html              ← markup completo del hero
    hero.component.css               ← estilos + @keyframes
    ring-carousel/
      ring-carousel.component.ts    ← Three.js: escena, cámara, lighting, drag, auto-rotate
      ring-carousel.component.html  ← <canvas #canvas>
      ring-carousel.component.css   ← sizing del canvas, touch-action: none
```

**Interfaces entre componentes:**
- `HeroComponent` → `RingCarouselComponent`: `@Input() activeIndex: number`
- `RingCarouselComponent` → `HeroComponent`: `@Output() ringChanged: EventEmitter<number>` (emite al swipe horizontal >60px o al recibir un nuevo input)
- Swipe detection: `pointerup` con `deltaX > 60px` cambia de anillo

---

## 2. Tokens de diseño (CSS custom properties)

Definidos en `src/styles.css` (globales):

```css
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
```

---

## 3. Tipografía

Fuentes cargadas desde Google Fonts en `index.html` con `preconnect` y `display=swap`:
- **Playfair Display 500** — titulares / display
- **Allura 400** — script cursivo
- **Inter 400 + 500** — UI, body, CTAs

Clases utilitarias en `styles.css`:
```css
.font-display { font-family: 'Playfair Display', serif; font-weight: 500; }
.font-script  { font-family: 'Allura', cursive; font-weight: 400; }
.font-ui      { font-family: 'Inter', sans-serif; }
body          { font-family: 'Inter', sans-serif; background: var(--color-offwhite); color: var(--color-ink); }
```

---

## 4. Sistema de animaciones CSS

### @keyframes (en `hero.component.css`)

```css
@keyframes letterDrop {
  from { opacity: 0; transform: translateY(-18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scriptIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
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
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

### Secuencia de entrada del hero

Las animaciones usan `animation-fill-mode: both` y `animation-play-state: paused` por defecto. Angular añade la clase `.hero--ready` en `afterViewInit` para cambiar a `running`.

| Elemento | animation-delay | Duración | Keyframe |
|---|---|---|---|
| Letras AUREA (×5) | 50ms, 100ms, 150ms, 200ms, 250ms | 400ms | letterDrop |
| Letras TERRA (×5) | 300ms, 350ms, 400ms, 450ms, 500ms | 400ms | letterDrop |
| "joyas" script | 650ms | 450ms | scriptIn |
| Canvas Three.js | 800ms | 400ms | fadeIn |
| Dots | 950ms | 350ms | fadeIn |
| CTA | 1150ms | 350ms | fadeIn |

**Total: todo visible a ~1.5s.**

Letras generadas con `@for` en el template, delay calculado inline:
```html
<span class="letter" [style.animation-delay]="($index * 50 + 50) + 'ms'">{{ letter }}</span>
```
El contenedor `.title-line` tiene `overflow: hidden` para el efecto mask.

### Estrellas (twinkle)

8-10 `<span class="star">✦ / ✶ / ⋆</span>` con posición absolute hardcodeada en CSS. Cada uno recibe `--dur` y `--delay` como variables CSS inline desde Angular (valores random en `ngOnInit`).

```css
.star {
  animation: twinkle var(--dur, 2.8s) ease-in-out var(--delay, 0s) infinite;
}
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .letter    { animation: none; opacity: 1; transform: none; }
  .star      { animation: none; opacity: 0.6; }
  .hero-sun  { animation: none; }
}
```
El auto-rotate del Three.js se desactiva con `window.matchMedia('(prefers-reduced-motion: reduce)').matches` en el componente.

---

## 5. Three.js Ring Carousel

### Setup

```
WebGLRenderer: alpha true, antialias true, pixelRatio min(devicePixelRatio, 2)
PerspectiveCamera: fov 35, near 0.1, far 100, position (0, 0, 4.8)
```

### Lighting

| Tipo | Color | Intensity | Posición |
|---|---|---|---|
| AmbientLight | #ffffff | 0.5 | — |
| DirectionalLight (key) | #fff4d6 | 2.8 | (3, 5, 6) |
| DirectionalLight (fill) | #c4dafc | 1.4 | (-5, -1, 3) |
| DirectionalLight (rim) | #ffffff | 2.0 | (-2, 4, -5) |
| DirectionalLight (bottom) | #fff0d0 | 1.0 | (0, -4, 2) |
| DirectionalLight (side) | #ffffff | 1.4 | (6, 0, 1) |

### 3 anillos procedurales (placeholders)

**CLÁSICO:**
```js
new TorusGeometry(1, 0.28, 64, 128)
new MeshPhysicalMaterial({ color: 0xDFB874, metalness: 1, roughness: 0.22, clearcoat: 0.3, clearcoatRoughness: 0.1 })
```

**OCTOGONAL:**
```js
new TorusGeometry(1, 0.22, 16, 8)
new MeshStandardMaterial({ color: 0xE5BD7C, metalness: 0.95, roughness: 0.25, flatShading: true })
```

**GRABADO:**
```js
new TorusGeometry(1, 0.26, 64, 128)
new MeshPhysicalMaterial({ color: 0xD9A887, metalness: 1, roughness: 0.3 })
// bumpMap procedural con canvas texture para simular canaletas
```

**Inclinación base de cada anillo:**
```js
ring.rotation.x = -0.55;
ring.rotation.z =  0.18;
```

### Carrusel y transición

- 3 `Group`s en la escena, separados 3.4 unidades en X (posiciones X: 0, 3.4, 6.8)
- Un `pivot` Group padre contiene los 3. Su `position.x` hace lerp hacia `targetX = activeIndex * -3.4` con factor 0.1 por frame
- Solo el anillo activo auto-rota; los otros retienen su última rotación

### Comportamiento de rotación

```
Auto-rotate:  activeRing.rotation.y += 0.0035 por frame (~30s por vuelta)
Drag factor:  0.008
Resume timer: 2500ms tras soltar el puntero
Drag detect:  pointerdown/pointermove/pointerup (unificado mouse + touch)
```

### Comunicación con el hero

- Emite `ringChanged(index)` al swipe horizontal >60px
- Responde a `activeIndex` input para mover el pivot

### Resize

`ResizeObserver` en el canvas actualiza `camera.aspect` y `renderer.setSize` en cada cambio de tamaño.

---

## 6. Estructura del template del hero

```html
<section class="hero" [class.hero--ready]="ready">

  <!-- Sol isotipo -->
  <div class="hero-sun" aria-hidden="true">
    <svg viewBox="0 0 80 80"><!-- SVG del spec --></svg>
  </div>

  <!-- Estrellas -->
  @for (star of stars; track $index) {
    <span class="star" aria-hidden="true"
          [style]="star.style">{{ star.char }}</span>
  }

  <!-- Título cinético -->
  <h1 class="hero-title" aria-label="AUREA TERRA">
    <div class="title-line">
      @for (letter of 'AUREA'.split(''); track $index) {
        <span class="letter font-display"
              [style.animation-delay]="($index * 50 + 50) + 'ms'">{{ letter }}</span>
      }
    </div>
    <div class="title-line">
      @for (letter of 'TERRA'.split(''); track $index) {
        <span class="letter font-display"
              [style.animation-delay]="($index * 50 + 300) + 'ms'">{{ letter }}</span>
      }
    </div>
  </h1>

  <!-- Script -->
  <p class="hero-script font-script" aria-hidden="true">joyas</p>

  <!-- Carrusel 3D -->
  <app-ring-carousel
    [activeIndex]="activeRing"
    (ringChanged)="onRingChanged($event)"
  />

  <!-- Label modelo -->
  <p class="ring-label font-ui">{{ ringLabels[activeRing] }}</p>

  <!-- Dots -->
  <div class="dots" role="tablist" aria-label="Seleccionar anillo">
    @for (label of ringLabels; track $index) {
      <button class="dot"
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

**Estado en `HeroComponent`:**
```ts
ready = false;
activeRing = 0;
ringLabels = ['CLÁSICO', 'OCTOGONAL', 'GRABADO'];
stars = [/* 8-10 objetos con char, posición y timing random */];

ngAfterViewInit() { this.ready = true; }
onRingChanged(i: number) { this.activeRing = i; }
```

---

## 7. Dependencias a instalar

```bash
npm install three
npm install --save-dev @types/three
```

GSAP: no requerido para el hero.  
Lenis: no requerido para el hero (sin scroll en la sección hero).

---

## 8. Consideraciones de performance

- `pixelRatio: min(devicePixelRatio, 2)` — evita renders 3x en pantallas retina altas
- Three.js cargado con dynamic `import('three')` en `afterViewInit` para no bloquear el parse inicial
- Fuentes con `display=swap` — texto visible inmediatamente con fallback
- Canvas tiene `width: 100%; aspect-ratio: 1` — sin cálculos de layout extra
- `cancelAnimationFrame` en `ngOnDestroy` para no dejar el loop corriendo

---

## 9. Accesibilidad

- `aria-label="AUREA TERRA"` en el `<h1>` (las letras individuales son spans decorativos)
- `aria-hidden="true"` en estrellas, sol, script "joyas", hint
- Dots como `role="tablist"` con `role="tab"` y `aria-selected`
- CTA como `<a>` con `href` real (no `<button>`)
- `prefers-reduced-motion` respetado en CSS y en el loop Three.js
