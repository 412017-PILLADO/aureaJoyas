import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent implements OnInit {
  private loading = inject(LoadingService);
  readonly visible = signal(true);
  readonly fading = signal(false);

  private startedAt = performance.now();
  private hideRequested = false;
  private readonly MIN_SHOW = 600;
  private readonly MAX_SHOW = 6000;

  constructor() {
    // React when the 3D models report loaded
    effect(() => {
      if (this.loading.ringsLoaded()) this.requestHide();
    });
  }

  ngOnInit(): void {
    // Safety net 1: fall back to window load (covers no-3D scenarios)
    if (document.readyState === 'complete') {
      this.requestHide();
    } else {
      window.addEventListener('load', () => this.requestHide(), { once: true });
    }
    // Safety net 2: hard cap
    setTimeout(() => this.hide(), this.MAX_SHOW);
  }

  private requestHide(): void {
    if (this.hideRequested) return;
    this.hideRequested = true;
    const elapsed = performance.now() - this.startedAt;
    const wait = Math.max(0, this.MIN_SHOW - elapsed);
    setTimeout(() => this.hide(), wait);
  }

  private hide(): void {
    if (!this.visible()) return;
    this.fading.set(true);
    setTimeout(() => this.visible.set(false), 450);
  }
}
