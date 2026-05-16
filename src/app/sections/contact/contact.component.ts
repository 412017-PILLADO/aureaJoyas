import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

@Component({
  selector: 'app-contact',
  imports: [ScrollRevealDirective],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  readonly whatsappUrl = 'https://wa.me/5491100000000';
  readonly instagramUrl = 'https://instagram.com/aureaterrajoyas';
  readonly email = 'hola@aureaterra.com';
  readonly year = new Date().getFullYear();
}
