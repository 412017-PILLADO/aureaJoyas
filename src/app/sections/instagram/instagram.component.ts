import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

interface IgPost {
  id: number;
  url: string;
  caption: string;
}

@Component({
  selector: 'app-instagram',
  imports: [ScrollRevealDirective],
  templateUrl: './instagram.component.html',
  styleUrl: './instagram.component.css',
})
export class InstagramComponent {
  readonly handle = 'aureaterrajoyas';
  readonly profileUrl = `https://instagram.com/${this.handle}`;

  readonly posts: IgPost[] = [
    { id: 1, url: this.profileUrl, caption: 'Anillo Mar de Oro' },
    { id: 2, url: this.profileUrl, caption: 'Collar Lluvia de Sal' },
    { id: 3, url: this.profileUrl, caption: 'Aro Órbita' },
    { id: 4, url: this.profileUrl, caption: 'Anillo Duna' },
    { id: 5, url: this.profileUrl, caption: 'Collar Noche Clara' },
    { id: 6, url: this.profileUrl, caption: 'Pulsera Eco' },
  ];
}
