import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

interface Step {
  n: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-how-to-buy',
  imports: [ScrollRevealDirective],
  templateUrl: './how-to-buy.component.html',
  styleUrl: './how-to-buy.component.css',
})
export class HowToBuyComponent {
  readonly steps: Step[] = [
    { n: '01', title: 'Explorá',     desc: 'Recorré nuestra selección curada. Cada pieza es única y rotamos el catálogo seguido.' },
    { n: '02', title: 'Consultá',    desc: 'Escribinos por WhatsApp o Instagram con la pieza que te enamoró. Te respondemos al toque.' },
    { n: '03', title: 'Coordinamos', desc: 'Te pasamos disponibilidad, precio y formas de pago. Acordamos juntos cómo recibirla.' },
    { n: '04', title: 'Recibí',      desc: 'Encuentro en Córdoba, retiro o envío a coordinar. Empaque listo para regalar.' },
  ];
}
