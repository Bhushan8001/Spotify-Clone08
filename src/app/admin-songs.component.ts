import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from './song.service';
import { Song } from './models/song';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-admin-songs',
  templateUrl: './admin-songs.component.html',
  styleUrls: ['./admin-songs.component.css'],
})
export class AdminSongsComponent implements OnInit {
  songs: Song[] = [];
  loading = false;
  error = '';
  deleting: Record<string, boolean> = {};
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

  deleteSong(song: Song) {
    if (!song._id || this.deleting[song._id]) {
      return;
    }
    const confirmed = confirm(`Delete "${song.title}" by ${song.artist}?`);
    if (!confirmed) {
      return;
    }
    this.deleting[song._id] = true;
    this.songService.deleteSong(song._id).subscribe({
      next: () => {
        this.songs = this.songs.filter((item) => item._id !== song._id);
        delete this.deleting[song._id!];
      },
      error: () => {
        this.error = 'Delete failed. Please try again.';
        delete this.deleting[song._id!];
      },
    });
  }
}
