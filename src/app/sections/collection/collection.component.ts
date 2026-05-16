import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

interface Piece {
  id: string;
  name: string;
  category: string;
  variant: number;
}

const WHATSAPP_BASE = 'https://wa.me/5491100000000';

@Component({
  selector: 'app-collection',
  imports: [ScrollRevealDirective],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.css',
})
export class CollectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('track') trackRef!: ElementRef<HTMLElement>;

  readonly pieces: Piece[] = [
    { id: 'mar-de-oro',    name: 'Mar de Oro',    category: 'Anillo',  variant: 1 },
    { id: 'lluvia-de-sal', name: 'Lluvia de Sal', category: 'Collar',  variant: 2 },
    { id: 'orbita',        name: 'Órbita',        category: 'Aro',     variant: 3 },
    { id: 'duna',          name: 'Duna',          category: 'Anillo',  variant: 4 },
    { id: 'noche-clara',   name: 'Noche Clara',   category: 'Collar',  variant: 5 },
    { id: 'eco',           name: 'Eco',           category: 'Pulsera', variant: 6 },
  ];

  readonly progress = signal(0);
  readonly thumbWidth = signal(20);

  private isDragging = false;
  private startX = 0;
  private startScrollLeft = 0;

  ngAfterViewInit(): void {
    queueMicrotask(() => this.updateProgress());
  }

  ngOnDestroy(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    track.removeEventListener('pointerdown', this.onPointerDown);
    track.removeEventListener('pointermove', this.onPointerMove);
    track.removeEventListener('pointerup', this.onPointerUp);
    track.removeEventListener('pointercancel', this.onPointerUp);
    track.removeEventListener('scroll', this.updateProgress);
  }

  onTrackScroll(): void {
    this.updateProgress();
  }

  onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    const track = this.trackRef.nativeElement;
    this.isDragging = true;
    this.startX = e.clientX;
    this.startScrollLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
    track.style.cursor = 'grabbing';
    track.style.scrollBehavior = 'auto';
  };

  onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    const track = this.trackRef.nativeElement;
    const dx = e.clientX - this.startX;
    track.scrollLeft = this.startScrollLeft - dx;
  };

  onPointerUp = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;
    const track = this.trackRef.nativeElement;
    try { track.releasePointerCapture(e.pointerId); } catch {}
    track.style.cursor = '';
    track.style.scrollBehavior = '';
  };

  waLink(piece: Piece): string {
    const msg = encodeURIComponent(`Hola, me interesa la pieza "${piece.name}".`);
    return `${WHATSAPP_BASE}?text=${msg}`;
  }

  private updateProgress = (): void => {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    if (max <= 0) {
      this.progress.set(0);
      this.thumbWidth.set(100);
      return;
    }
    this.progress.set((track.scrollLeft / max) * 100);
    this.thumbWidth.set((track.clientWidth / track.scrollWidth) * 100);
  };
}
