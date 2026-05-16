# Aurea Terra Joyas

Landing page de reventa boutique de joyas. Hero con carrusel 3D de anillos (Three.js + GLB),
secciones de colección, Instagram, "Cómo comprar" y contacto. Mobile-first, sin Tailwind, sin GSAP.

## Stack

- Angular 21 (standalone components, `@for` / `@if`)
- Three.js + GLTFLoader + DRACOLoader (lazy)
- CSS puro con custom properties
- IntersectionObserver para reveals on scroll

## Scripts

```bash
npm install
npm start           # dev server en http://localhost:4200
npm run build       # producción → dist/aurea/browser
npm test            # vitest
```

## Estructura

```
src/app/
  app.{ts,html,css}                  # shell, monta starfield + 5 sections
  hero/
    hero.component.{ts,html,css}     # título cinético + carrusel 3D
    ring-carousel/                   # Three.js escena, lighting, drag
  sections/
    details/                         # "Los detalles que enamoran"
    collection/                      # cinta horizontal con CTA a WhatsApp
    instagram/                       # grid de posts + CTA "Seguinos"
    how-to-buy/                      # 4 pasos: Explorá / Consultá / Coordinamos / Recibí
    contact/                         # "Hablemos" + footer
  shared/
    scroll-reveal.directive.ts       # IntersectionObserver one-shot
    starfield.component.{ts,html,css}# estrellitas fijas con twinkle global
```

## Modelos 3D

Los anillos vienen de `public/*.glb`. Para incorporar un nuevo modelo desde Rhino (`.3dm`)
podés correr el script de conversión (extrae los render meshes cacheados del Brep):

```bash
npm install --no-save rhino3dm @gltf-transform/core
node scripts/convert-3dm-to-glb.mjs <archivo.3dm> [salida.glb]
```

El archivo `.3dm` debe haber sido guardado en Rhino con Display en Shaded o Rendered
para que las superficies tengan meshes cacheados. Si no, abrilo en Rhino, cambialo a
shaded, guardalo y re-corré el script.

Los slots se asignan en `src/app/hero/ring-carousel/ring-carousel.component.ts` en
el array `modelPaths`.

## Deploy

`vercel.json` está configurado para apuntar a `dist/aurea/browser`. Conectar el repo
en el dashboard de Vercel y desplegar — Vercel auto-detecta Angular.
