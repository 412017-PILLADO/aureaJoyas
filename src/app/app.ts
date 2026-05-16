import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { StarfieldComponent } from './shared/starfield.component';
import { LoaderComponent } from './shared/loader.component';
import { DetailsComponent } from './sections/details/details.component';
import { CollectionComponent } from './sections/collection/collection.component';
import { HowToBuyComponent } from './sections/how-to-buy/how-to-buy.component';
import { ContactComponent } from './sections/contact/contact.component';

@Component({
  selector: 'app-root',
  imports: [
    LoaderComponent,
    StarfieldComponent,
    HeroComponent,
    DetailsComponent,
    CollectionComponent,
    HowToBuyComponent,
    ContactComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
