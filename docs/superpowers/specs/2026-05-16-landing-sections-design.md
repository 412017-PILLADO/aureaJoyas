# Aurea Terra Joyas — Landing Sections (post-hero) Design Spec
**Date:** 2026-05-16
**Scope:** Four new sections rendered after the existing hero, completing the landing.
**Stack:** Angular 21 · CSS puro · sin Tailwind · sin GSAP · IntersectionObserver para scroll reveals
**Brand model:** Reventa boutique de joyas (no es artesanal). Tono: "detalles que enamoran".

---

## 1. Arquitectura de componentes

```
src/app/
  app.ts / app.html                ← monta Hero + 4 secciones nuevas en orden
  hero/                            ← ya existe
  shared/
    scroll-reveal.directive.ts     ← standalone directive con IntersectionObserver
  sections/
    details/
      details.component.{ts,html,css}     ← "Detalles que enamoran"
    collection/
      collection.component.{ts,html,css}  ← Carrusel horizontal scrolleable, 6 cards
    how-to-buy/
      how-to-buy.component.{ts,html,css}  ← 4 pasos numerados
    contact/
      contact.component.{ts,html,css}     ← Hablemos + Footer (mismo componente)
```

Cada sección es un componente standalone. La directiva `scrollReveal` se importa por componente que la use. `app.html` queda:

```html
<app-hero />
<app-details />
<app-collection />
<app-how-to-buy />
<app-contact />
```

---

## 2. Tokens nuevos en `src/styles.css`

Agregar al `:root`:

```css
--section-padding-y: clamp(64px, 12vw, 120px);
--section-padding-x: clamp(20px, 5vw, 48px);
--container-max: 1200px;
--whatsapp-number: 5491100000000;    /* placeholder, reemplazar */
--whatsapp-url: 'https://wa.me/5491100000000';
--instagram-url: 'https://instagram.com/aureaterrajoyas';
--contact-email: 'hola@aureaterra.com';
```

Las dos últimas (`--whatsapp-url`, etc.) son strings de referencia documental; los componentes las leen como constantes TS.

---

## 3. ScrollRevealDirective

**Archivo:** `src/app/shared/scroll-reveal.directive.ts`

**Comportamiento:**
- Selector: `[scrollReveal]`
- En `ngAfterViewInit`, crea un `IntersectionObserver` con `{ threshold: 0.15, rootMargin: '0px 0px -10% 0px' }`
- Cuando el host entra en viewport, agrega la clase `.is-visible` y desconecta el observer (one-shot)
- Si `prefers-reduced-motion: reduce`, agrega `.is-visible` inmediatamente sin observer
- En `ngOnDestroy`, desconecta el observer si sigue activo

**CSS de soporte** (global en `styles.css`):

```css
[scrollReveal] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 600ms var(--ease-out-expo), transform 600ms var(--ease-out-expo);
}
[scrollReveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  [scrollReveal] { opacity: 1; transform: none; transition: none; }
}
```

Stagger entre hijos de una sección se logra con `transition-delay` en CSS de cada componente, no en la directiva.

---

## 4. Section: Details ("Detalles que enamoran")

**Propósito:** narrative bridge entre el hero y el catálogo. Tono sensorial.

**Layout:**
- Mobile (default): stack vertical — texto arriba, bloque decorativo debajo
- ≥768px: 2 columnas 60/40 — texto izquierda, decorativo derecha

**Contenido:**
- Eyebrow Inter uppercase tracking-wider cobalt-65: "EL DETALLE"
- H2 Playfair Display 500 cobalt, font-size `clamp(36px, 6vw, 56px)`, line-height 1.05:  
  *"Los detalles que enamoran"*
- P Inter 400 ink, font-size `clamp(16px, 2vw, 18px)`, line-height 1.65, max-width 56ch:  
  *"Hay piezas que pasan. Y hay piezas que se quedan. Las que elegimos para vos tienen ese gesto mínimo —una curva inesperada, un brillo que se enciende con la luz, un peso que cae perfecto sobre la piel— que transforma cualquier mañana en algo distinto."*
- Subtle gold accent line under H2 (1px × 48px, `--color-gold`)

**Bloque decorativo (derecha):**
- Cuadro `aspect-ratio: 4/5`, fondo gradient sutil de `--color-cobalt` a `#0F1654`
- SVG inline centrado: sol estilizado (mismo trazo que el hero-sun) + 3 estrellitas alrededor en oro
- Border-radius: 2px (cuadrado, casi sin radio para sentir "editorial")

**Animaciones:**
- Toda la sección con `scrollReveal`
- Eyebrow y H2 entran con stagger via `transition-delay`: 0ms eyebrow, 80ms H2, 160ms párrafo, 240ms bloque decorativo

---

## 5. Section: Collection ("La colección")

**Propósito:** mostrar 6 piezas con CTA directo a WhatsApp.

**Layout:**
- Header de sección centrado: eyebrow "LA COLECCIÓN" + H2 Playfair "Piezas seleccionadas" + párrafo corto
- Cinta horizontal scrolleable con `scroll-snap-type: x mandatory`
- Card width: `min(78vw, 320px)` en mobile, `clamp(260px, 22vw, 320px)` en desktop
- `gap: 24px`, padding-inline igual al container
- `overflow-x: auto`, `scrollbar-width: none`, `::-webkit-scrollbar { display: none }`
- Drag con mouse implementado en `CollectionComponent` (mousedown → mousemove con `scrollLeft -= dx` → mouseup). Touch nativo del browser ya snapea.
- Indicador de progreso debajo: línea fina horizontal donde una barra cobalto representa la posición de scroll (computada en `scroll` event).

**Card structure:**
```
.collection-card
  .card-media           ← aspect-ratio: 1, gradient cobalt→darker, overlay sutil con sol/estrellas SVG decorativos
  .card-body
    .card-category      ← "ANILLO" / "COLLAR" / "ARO"  (Inter uppercase tracking, cobalt-65)
    .card-name          ← Playfair Display, font-size 20px, ink
    .card-cta           ← <a href="wa.me/...?text=..."> "Consultar por WhatsApp" + arrow icon
```

**Data (en CollectionComponent.ts):**

```ts
readonly pieces: Piece[] = [
  { id: 'mar-de-oro',     name: 'Mar de Oro',     category: 'Anillo' },
  { id: 'lluvia-de-sal',  name: 'Lluvia de Sal',  category: 'Collar' },
  { id: 'orbita',         name: 'Órbita',         category: 'Aro' },
  { id: 'duna',           name: 'Duna',           category: 'Anillo' },
  { id: 'noche-clara',    name: 'Noche Clara',    category: 'Collar' },
  { id: 'eco',            name: 'Eco',            category: 'Pulsera' },
];

interface Piece { id: string; name: string; category: string; }

readonly whatsappBase = 'https://wa.me/5491100000000';
waLink(piece: Piece): string {
  const msg = encodeURIComponent(`Hola, me interesa la pieza "${piece.name}".`);
  return `${this.whatsappBase}?text=${msg}`;
}
```

**Media placeholder:**
- Cada card tiene una "media" decorativa procedural (no imágenes externas): gradient + SVG overlay con composición distinta según el `id`. 6 variantes hardcodeadas en el CSS (o como `[ngStyle]` calculado).
- Para una de las cards (la "Mar de Oro" por ejemplo), opcional: render del anillo octogonal — **fuera de scope para esta iteración**. Por ahora todas son placeholders procedurales.

**Animaciones:**
- Header con `scrollReveal`
- La cinta con `scrollReveal` (stagger en cards via `transition-delay: calc($index * 50ms)` aplicado en el template)
- Hover en card desktop: `transform: translateY(-4px)` y card-media `transform: scale(1.03)` con transición.

---

## 6. Section: HowToBuy ("Cómo comprar")

**Propósito:** orientar al comprador en 4 pasos.

**Layout:**
- Header centrado: eyebrow "EN 4 PASOS" + H2 "Cómo comprar"
- Grid de 4 cards:
  - Mobile: 1 col
  - Tablet (≥640px): 2 cols
  - Desktop (≥1024px): 4 cols
- gap: clamp(16px, 3vw, 32px)

**Card structure:**
```
.step-card
  .step-number   ← Playfair Display 600, font-size clamp(48px, 8vw, 72px), color: --color-gold
  .step-title    ← Inter 500, font-size 14px, uppercase tracking 0.2em, cobalt
  .step-desc     ← Inter 400, font-size 15px, ink, line-height 1.5, max-width 28ch
```

**Data:**

```ts
readonly steps = [
  { n: '01', title: 'Explorá',  desc: 'Recorré nuestra selección curada. Cada pieza es única y rotamos el catálogo cada semana.' },
  { n: '02', title: 'Consultá', desc: 'Tocá "Consultar por WhatsApp" en la pieza que te enamoró. Te respondemos en minutos.' },
  { n: '03', title: 'Reservá',  desc: 'Confirmás la pieza con una seña. La sacamos del catálogo y queda apartada para vos.' },
  { n: '04', title: 'Recibí',   desc: 'Envío asegurado a todo el país o retiro en CABA. Empaque listo para regalar.' },
];
```

**Animaciones:**
- Sección con `scrollReveal` global
- Stagger interno: cada card con `transition-delay: calc($index * 80ms)` cuando la sección se activa

---

## 7. Section: Contact + Footer ("Hablemos")

**Propósito:** cerrar con CTAs directos + footer simple.

**Layout (Contact):**
- Fondo: `--color-cobalt` (sección invertida para ritmo visual — única excepción al "continuidad total")
- Padding vertical: `--section-padding-y`
- Centro: H2 Playfair offwhite "Hablemos" + párrafo corto offwhite-80
- 3 CTAs en flex row, gap 16px (stack en mobile):
  - WhatsApp · Instagram · Email
  - Cada uno: SVG icon 24×24 trazo offwhite + label Inter uppercase + arrow
  - Botones tipo pill outline offwhite, hover invierte (background offwhite, text cobalt)

**Layout (Footer):**
- Fondo: `--color-ink`
- Padding: 32px clamp(20px, 5vw, 48px)
- Grid flex: marca a la izquierda ("Aurea Terra Joyas"), legals a la derecha ("Términos · Privacidad")
- Mobile: stack centered
- Tipografía offwhite-60, font-size 12px, letter-spacing 0.1em

**Data (constants en `ContactComponent.ts`):**

```ts
readonly contacts = {
  whatsapp: 'https://wa.me/5491100000000',
  instagram: 'https://instagram.com/aureaterrajoyas',
  email: 'hola@aureaterra.com',
};
```

Email es `mailto:hola@aureaterra.com`.

**Animaciones:**
- Bloque Hablemos con `scrollReveal`
- CTAs con stagger 60ms entre cada uno
- Footer sin animación (siempre visible al hacer scroll)

---

## 8. Estructura visual completa

| Sección | Bg | Texto principal | Padding-y |
|---|---|---|---|
| Hero | offwhite | cobalt | 100dvh |
| Details | offwhite | cobalt + ink | `--section-padding-y` |
| Collection | offwhite | ink + cobalt | `--section-padding-y` |
| HowToBuy | offwhite | cobalt + ink | `--section-padding-y` |
| Contact | cobalt | offwhite | `--section-padding-y` |
| Footer | ink | offwhite-60 | 32px |

---

## 9. Accesibilidad

- Cada sección `<section>` con `aria-labelledby` apuntando al H2 (que tiene id)
- WhatsApp/Instagram/Email links con `aria-label` descriptivo, `target="_blank"`, `rel="noopener noreferrer"`
- La cinta horizontal de Collection es scrolleable con teclado (focus en cada card → tab navega; Arrow keys nativo en `overflow-x: auto`)
- `prefers-reduced-motion` desactiva todas las transiciones de reveal y transform-hovers
- Contraste verificado: cobalt #1E2A8C sobre offwhite #FAFAF7 es AAA para large text

---

## 10. Performance

- No new dependencies (no GSAP, no Lenis, no Intersection-observer polyfill — soporte nativo desde Safari 12+)
- Cada componente standalone con `templateUrl` y `styleUrl` separados (lazy-friendly aunque ahora todo se renderiza junto)
- No imágenes externas — todos los visuales son SVG inline + gradients CSS
- `scroll-snap-type` nativo, sin JS de snap

---

## 11. Fuera de scope (futuras iteraciones)

- Renderizar el anillo octogonal en una de las cards de Collection
- Página de detalle por pieza
- Formulario funcional (newsletter o contacto)
- Multi-idioma
- CMS / fuente de datos externa para piezas
