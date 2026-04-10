import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-artist-card',
  templateUrl: './artist-card.component.html',
  styleUrls: ['./artist-card.component.css'],
})
export class ArtistCardComponent {
  @Input() artist!: {
    name: string;
    image: string;
  };
}
