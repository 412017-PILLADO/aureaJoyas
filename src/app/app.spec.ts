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
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }),
    });

    (globalThis as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    };

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

  it('renders all sections including the global starfield', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.starfield')).not.toBeNull();
    expect(el.querySelector('.hero')).not.toBeNull();
    expect(el.querySelector('.details')).not.toBeNull();
    expect(el.querySelector('.collection')).not.toBeNull();
    expect(el.querySelector('.ig')).not.toBeNull();
    expect(el.querySelector('.how')).not.toBeNull();
    expect(el.querySelector('.contact')).not.toBeNull();
    expect(el.querySelector('.footer')).not.toBeNull();
  });
});
