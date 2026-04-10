import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-album-card',
  templateUrl: './album-card.component.html',
  styleUrls: ['./album-card.component.css'],
})
export class AlbumCardComponent {
  @Input() album!: {
    image: string;
    title: string;
    artist: string;
    audioUrl?: string;
  };

  @Output() playSong = new EventEmitter<any>();
  @Output() addToLibrary = new EventEmitter<any>();

  onPlay(event: MouseEvent) {
    event.stopPropagation();
    this.playSong.emit(this.album);
  }

  onAdd(event: MouseEvent) {
    event.stopPropagation();
    this.addToLibrary.emit(this.album);
  }
}
