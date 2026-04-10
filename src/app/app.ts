import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideNavComponent } from './side-nav.component';
import { TopBarComponent } from './top-bar.component';
import { PlaylistComponent } from './playlist.component';
import { PlayerComponent } from './player.component';
import { SongsListComponent } from './songs-list.component';
import { AdminSongsComponent } from './admin-songs.component';
import { SongService } from './song.service';
import { Song } from './models/song';
import { AppView, PlaylistView } from './view-types';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SideNavComponent,
    TopBarComponent,
    PlaylistComponent,
    PlayerComponent,
    SongsListComponent,
    AdminSongsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private songService = inject(SongService);

  currentView = signal<AppView>('home');
  searchQuery = signal('');
  isPlaying = signal(false);
  isShuffle = signal(false);
  isRepeat = signal(false);
  currentSong = signal<Song | null>(null);
  isNowPlayingOpen = signal(false);

  trendingSongs: Song[] = [];
  albums: Song[] = [];
  radioChannels: { title: string; artist: string; image: string; audioUrl: string }[] = [];
  popularArtists: { name: string; image: string }[] = [];
  allSongs: Song[] = [];
  favoriteSongs = signal<Song[]>([]);
  customPlaylists = signal<{ name: string; songs: Song[] }[]>([]);

  ngOnInit() {
    this.loadSongs();
    this.loadCustomPlaylists();
    this.loadFavorites();
  }

  private loadCustomPlaylists() {
    try {
      const saved = localStorage.getItem('spotifyCustomPlaylists');
      if (saved) {
        this.customPlaylists.set(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Failed to load custom playlists:', err);
    }
  }

  private saveCustomPlaylists() {
    try {
      localStorage.setItem('spotifyCustomPlaylists', JSON.stringify(this.customPlaylists()));
    } catch (err) {
      console.warn('Failed to save custom playlists:', err);
    }
  }

  private loadFavorites() {
    try {
      const saved = localStorage.getItem('spotifyFavorites');
      if (saved) {
        this.favoriteSongs.set(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    }
  }

  private saveFavorites() {
    try {
      localStorage.setItem('spotifyFavorites', JSON.stringify(this.favoriteSongs()));
    } catch (err) {
      console.warn('Failed to save favorites:', err);
    }
  }

  private loadSongs() {
    this.songService.getSongs().subscribe({
      next: (songs) => {
        if (!songs || !songs.length) {
          this.setSongCatalog([]);
          return;
        }
        this.setSongCatalog(songs);
      },
      error: (err) => {
        console.warn('Failed to load songs from API.', err);
        this.setSongCatalog([]);
      },
    });
  }

  private setSongCatalog(songs: Song[]) {
    this.trendingSongs = songs;
    this.albums = songs;
    this.allSongs = songs;
    this.radioChannels = this.buildRadioChannels(songs);
    this.popularArtists = this.buildPopularArtists(songs);
  }

  onRefreshSongs() {
    this.loadSongs();
  }

  private buildRadioChannels(source: Song[]) {
    return source.slice(0, 5).map((song, index) => ({
      title: song.album ? `${song.album} Radio` : `Radio ${index + 1}`,
      artist: song.artist,
      image: song.image,
      audioUrl: song.audioUrl,
    }));
  }

  private buildPopularArtists(source: Song[]) {
    const unique = new Map<string, string>();
    source.forEach((song) => {
      if (!unique.has(song.artist)) {
        unique.set(song.artist, song.image);
      }
    });
    return Array.from(unique.entries())
      .slice(0, 8)
      .map(([name, image]) => ({ name, image }));
  }

  onNavigate(view: AppView) {
    this.currentView.set(view);
  }

  onMobileCreate() {
    this.currentView.set('library');
    this.scrollToSection('mobile-create-section');
  }

  private scrollToSection(id: string) {
    if (typeof window === 'undefined') {
      return;
    }
    window.setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentView.set('search');
  }

  isPlaylistView() {
    const view = this.currentView();
    return view === 'home' || view === 'search' || view === 'library' || view === 'upload';
  }

  get playlistView(): PlaylistView {
    return this.currentView() as PlaylistView;
  }

  onPlaySong(song: Song) {
    this.currentSong.set(song);
    this.isPlaying.set(true);
    this.isNowPlayingOpen.set(true);
  }

  onToggleNowPlaying() {
    this.isNowPlayingOpen.update((open) => !open);
  }

  onToggleShuffle() {
    this.isShuffle.update((value) => !value);
  }

  onToggleRepeat() {
    this.isRepeat.update((value) => !value);
  }

  private getRandomSong(): Song | null {
    if (!this.allSongs.length) {
      return null;
    }
    const candidates = this.currentSong()
      ? this.allSongs.filter(
          (song) => song.title !== this.currentSong()!.title || song.artist !== this.currentSong()!.artist
        )
      : this.allSongs;
    if (!candidates.length) {
      return this.allSongs[0];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  onTogglePlay() {
    if (!this.currentSong()) {
      const nextSong = this.isShuffle() ? this.getRandomSong() : this.allSongs[0];
      if (nextSong) {
        this.onPlaySong(nextSong);
      }
      return;
    }
    this.isPlaying.update((v) => {
      const next = !v;
      if (next) {
        this.isNowPlayingOpen.set(true);
      }
      return next;
    });
  }

  onNext() {
    if (!this.currentSong()) return;
    const nextSong = this.isShuffle() ? this.getRandomSong() : this.getSequentialNext();
    if (nextSong) {
      this.onPlaySong(nextSong);
      this.isNowPlayingOpen.set(true);
    }
  }

  private getSequentialNext(): Song | null {
    if (!this.currentSong()) return null;
    const index = this.allSongs.findIndex(
      (song) => song.title === this.currentSong()!.title && song.artist === this.currentSong()!.artist
    );
    return this.allSongs[(index + 1) % this.allSongs.length];
  }

  onPrev() {
    if (!this.currentSong()) return;
    const index = this.allSongs.findIndex((song) => song.title === this.currentSong()!.title && song.artist === this.currentSong()!.artist);
    const prev = this.allSongs[(index - 1 + this.allSongs.length) % this.allSongs.length];
    if (prev) {
      this.onPlaySong(prev);
      this.isNowPlayingOpen.set(true);
    }
  }

  onCreatePlaylist(name: string) {
    if (!name.trim()) return;
    this.customPlaylists.update((list) => [...list, { name, songs: [] }]);
    this.saveCustomPlaylists();
    this.currentView.set('library');
  }

  onAddToLibrary(song: Song) {
    this.favoriteSongs.update((list) => {
      if (list.some((item) => item.title === song.title && item.artist === song.artist)) {
        return list;
      }
      return [...list, song];
    });
    this.saveFavorites();
  }

  onAddToPlaylist(event: { playlistName: string; songs: Song[] }) {
    this.customPlaylists.update((playlists) =>
      playlists.map((playlist) => {
        if (playlist.name !== event.playlistName) {
          return playlist;
        }
        const songsToAdd = event.songs.filter(
          (song) => !playlist.songs.some((existing) => existing.title === song.title && existing.artist === song.artist)
        );
        return {
          ...playlist,
          songs: [...playlist.songs, ...songsToAdd],
        };
      })
    );
    this.saveCustomPlaylists();
  }

  onDeletePlaylist(name: string) {
    if (!confirm(`Delete playlist "${name}"? This cannot be undone.`)) return;
    this.customPlaylists.update((playlists) => playlists.filter(p => p.name !== name));
    this.saveCustomPlaylists();
  }

}


