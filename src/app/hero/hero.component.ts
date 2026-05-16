import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { RingCarouselComponent } from './ring-carousel/ring-carousel.component';

@Component({
  selector: 'app-hero',
  imports: [RingCarouselComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements AfterViewInit {
  ready = false;

  constructor(private cdr: ChangeDetectorRef) {}

  activeRing = 0;
  readonly ringLabels = ['CLÁSICO', 'OCTOGONAL', 'GRABADO'];
  readonly aureaLetters = 'AUREA'.split('');
  readonly terraLetters = 'TERRA'.split('');

  ngAfterViewInit() {
    this.ready = true;
    this.cdr.detectChanges();
  }

  onRingChanged(i: number) {
    this.activeRing = i;
  }

  onScrollToCollection(e: Event): void {
    e.preventDefault();
    const target = document.getElementById('coleccion');
    if (!target) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.scrollIntoView();
      return;
    }

    const startY = window.scrollY;
    const targetY = target.getBoundingClientRect().top + window.scrollY;
    const distance = targetY - startY;
    const duration = 1400;
    const startTime = performance.now();

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const easeInOut = (t: number): number =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOut(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        html.style.scrollBehavior = prevBehavior;
      }
    };

    requestAnimationFrame(step);
  }
}
