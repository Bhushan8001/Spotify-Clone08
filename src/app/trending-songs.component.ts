import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlbumCardComponent } from './album-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, AlbumCardComponent],
  selector: 'app-trending-songs',
  templateUrl: './trending-songs.component.html',
  styleUrls: ['./trending-songs.component.css'],
})
export class TrendingSongsComponent {
  @Input() songs: any[] = [];
  @Output() playSong = new EventEmitter<any>();
  @Output() addToLibrary = new EventEmitter<any>();
}
