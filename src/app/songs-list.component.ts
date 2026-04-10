import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from './song.service';
import { Song } from './models/song';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-songs-list',
  templateUrl: './songs-list.component.html',
  styleUrls: ['./songs-list.component.css'],
})
export class SongsListComponent implements OnInit {
  songs: Song[] = [];
  loading = false;
  error = '';
  @Output() playSong = new EventEmitter<Song>();

  constructor(private songService: SongService) {}

  ngOnInit() {
    this.loadSongs();
  }

  loadSongs() {
    this.loading = true;
    this.error = '';
    this.songService.getSongs().subscribe({
      next: (songs) => {
        this.songs = songs;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load songs. Please check the API.';
        this.loading = false;
      },
    });
  }
}
