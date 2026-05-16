import { AfterViewInit, Component } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

@Component({
  selector: 'app-instagram',
  imports: [ScrollRevealDirective],
  templateUrl: './instagram.component.html',
  styleUrl: './instagram.component.css',
})
export class InstagramComponent implements AfterViewInit {
  readonly handle = 'aureaterrajoyas_';
  readonly profileUrl = `https://instagram.com/${this.handle}`;

  // Replace each entry with the real permalink of the post you want to show.
  // Six duplicates of the same post for now to preview the layout.
  readonly permalinks: string[] = [
    'https://www.instagram.com/p/DYSwpOzEZnw/',
    'https://www.instagram.com/p/DYSwpOzEZnw/',
    'https://www.instagram.com/p/DYSwpOzEZnw/',
    'https://www.instagram.com/p/DYSwpOzEZnw/',
    'https://www.instagram.com/p/DYSwpOzEZnw/',
    'https://www.instagram.com/p/DYSwpOzEZnw/',
  ];

  embedUrl(permalink: string): string {
    return `${permalink}?utm_source=ig_embed&utm_campaign=loading`;
  }

  ngAfterViewInit(): void {
    // Trigger embed.js to render the blockquotes added by Angular.
    // Safe to call even if the script hasn't loaded yet — it auto-runs on load.
    setTimeout(() => window.instgrm?.Embeds.process(), 0);
  }
}
