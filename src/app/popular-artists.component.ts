import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistCardComponent } from './artist-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, ArtistCardComponent],
  selector: 'app-popular-artists',
  templateUrl: './popular-artists.component.html',
  styleUrls: ['./popular-artists.component.css'],
})
export class PopularArtistsComponent {
  @Input() artists: any[] = [];
}
