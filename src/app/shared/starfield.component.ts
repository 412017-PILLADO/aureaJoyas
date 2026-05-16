import { Component } from '@angular/core';

interface Star {
  char: string;
  style: string;
}

@Component({
  selector: 'app-starfield',
  templateUrl: './starfield.component.html',
  styleUrl: './starfield.component.css',
})
export class StarfieldComponent {
  readonly stars: Star[] = this.build();

  private build(): Star[] {
    const chars = ['✦', '✶', '⋆', '✦', '⋆', '✶'];
    const positions: Array<[number, number, number]> = [
      // [topPct, leftPct, sizePx]
      [4, 8, 11],   [7, 28, 9],   [3, 55, 13],  [6, 78, 10],  [10, 92, 8],
      [14, 18, 12], [12, 45, 9],  [16, 65, 11], [18, 85, 10],
      [22, 7, 9],   [26, 30, 12], [24, 58, 8],  [28, 80, 11],
      [34, 14, 10], [38, 40, 9],  [36, 70, 13], [40, 88, 8],
      [46, 5, 12],  [50, 28, 10], [48, 55, 9],  [52, 75, 11],
      [58, 18, 8],  [62, 45, 12], [60, 65, 9],  [64, 90, 10],
      [72, 10, 11], [76, 50, 8],  [78, 80, 13],
      [86, 30, 10], [92, 65, 9],
    ];
    return positions.map((p, i) => {
      const [top, left, size] = p;
      const dur = (2.4 + (i % 6) * 0.4).toFixed(1);
      const delay = ((i * 0.27) % 4.5).toFixed(2);
      return {
        char: chars[i % chars.length],
        style:
          `top:${top}vh;left:${left}vw;` +
          `font-size:${size}px;` +
          `--dur:${dur}s;--delay:${delay}s;`,
      };
    });
  }
}
