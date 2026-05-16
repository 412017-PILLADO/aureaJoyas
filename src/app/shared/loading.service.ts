import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly ringsLoaded = signal(false);

  markRingsLoaded(): void {
    this.ringsLoaded.set(true);
  }
}
