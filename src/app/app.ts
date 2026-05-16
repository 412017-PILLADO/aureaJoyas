import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { StarfieldComponent } from './shared/starfield.component';
import { DetailsComponent } from './sections/details/details.component';
import { CollectionComponent } from './sections/collection/collection.component';
import { InstagramComponent } from './sections/instagram/instagram.component';
import { HowToBuyComponent } from './sections/how-to-buy/how-to-buy.component';
import { ContactComponent } from './sections/contact/contact.component';

@Component({
  selector: 'app-root',
  imports: [
    StarfieldComponent,
    HeroComponent,
    DetailsComponent,
    CollectionComponent,
    InstagramComponent,
    HowToBuyComponent,
    ContactComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
