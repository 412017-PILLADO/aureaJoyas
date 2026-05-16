import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

interface Piece {
  id: string;
  name: string;
  category: string;
  variant: number;
  /** Full TiendaNube product URL. Leave empty to fall back to the store home. */
  productUrl?: string;
  /** Direct image URL (TiendaNube CDN or any HTTPS URL). If empty, the procedural SVG is shown. */
  imageUrl?: string;
}

const STORE_URL = 'https://aureaterra.mitiendanube.com';
const DRAG_THRESHOLD_PX = 8;

@Component({
  selector: 'app-collection',
  imports: [ScrollRevealDirective],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.css',
})
export class CollectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('track') trackRef!: ElementRef<HTMLElement>;

  readonly storeUrl = STORE_URL;

  // Pegá acá las URLs reales de cada producto en TiendaNube + la URL de la foto principal.
  // Si dejás productUrl vacío, la card linkea a la home de la tienda.
  // Si dejás imageUrl vacío, se muestra el placeholder SVG con la variante numérica.
  readonly pieces: Piece[] = [
    { id: 'mar-de-oro',    name: 'Mar de Oro',    category: 'Anillo',  variant: 1, productUrl: '', imageUrl: '' },
    { id: 'lluvia-de-sal', name: 'Lluvia de Sal', category: 'Collar',  variant: 2, productUrl: '', imageUrl: '' },
    { id: 'orbita',        name: 'Órbita',        category: 'Aro',     variant: 3, productUrl: '', imageUrl: '' },
    { id: 'duna',          name: 'Duna',          category: 'Anillo',  variant: 4, productUrl: '', imageUrl: '' },
    { id: 'noche-clara',   name: 'Noche Clara',   category: 'Collar',  variant: 5, productUrl: '', imageUrl: '' },
    { id: 'eco',           name: 'Eco',           category: 'Pulsera', variant: 6, productUrl: '', imageUrl: '' },
  ];

  readonly progress = signal(0);
  readonly thumbWidth = signal(20);

  private isDragging = false;
  private startX = 0;
  private startScrollLeft = 0;
  private dragDistance = 0;

  ngAfterViewInit(): void {
    queueMicrotask(() => this.updateProgress());
  }

  ngOnDestroy(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    track.removeEventListener('scroll', this.updateProgress);
  }

  cardHref(piece: Piece): string {
    return piece.productUrl || this.storeUrl;
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
    this.dragDistance = 0;
    track.style.cursor = 'grabbing';
    track.style.scrollBehavior = 'auto';
  };

  onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    const track = this.trackRef.nativeElement;
    const dx = e.clientX - this.startX;
    this.dragDistance = Math.max(this.dragDistance, Math.abs(dx));
    track.scrollLeft = this.startScrollLeft - dx;
  };

  onPointerUp = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;
    const track = this.trackRef.nativeElement;
    try { track.releasePointerCapture(e.pointerId); } catch {}
    track.style.cursor = '';
    track.style.scrollBehavior = '';

    // Prevent the click that would otherwise fire on the card after a real drag
    if (this.dragDistance > DRAG_THRESHOLD_PX) {
      const blockClick = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        track.removeEventListener('click', blockClick, true);
      };
      track.addEventListener('click', blockClick, true);
    }
  };

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
