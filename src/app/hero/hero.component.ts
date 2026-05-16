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
}
