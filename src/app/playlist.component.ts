import { Component, ElementRef, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TrendingSongsComponent } from './trending-songs.component';
import { PopularArtistsComponent } from './popular-artists.component';
import { AlbumCardComponent } from './album-card.component';
import { SongsListComponent } from './songs-list.component';
import { AdminSongsComponent } from './admin-songs.component';
import { SongService } from './song.service';
import { PlaylistView } from './view-types';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TrendingSongsComponent,
    PopularArtistsComponent,
    AlbumCardComponent,
    SongsListComponent,
    AdminSongsComponent
  ],
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css'],
})
export class PlaylistComponent implements OnChanges {
  constructor(private songService: SongService) {}

  @Input() view: PlaylistView = 'home';
  @Input() trendingSongs: any[] = [];
  @Input() popularArtists: any[] = [];
  @Input() albums: any[] = [];
  @Input() radioChannels: any[] = [];
  @Input() allSongs: any[] = [];
  @Input() searchQuery = '';
  @Input() favoriteSongs: any[] = [];
  @Input() customPlaylists: any[] = [];

@Output() playSong = new EventEmitter<any>();
  @Output() addToLibrary = new EventEmitter<any>();
  @Output() addToPlaylist = new EventEmitter<{ playlistName: string; songs: any[] }>();
  @Output() createPlaylist = new EventEmitter<string>();
  @Output() deletePlaylist = new EventEmitter<string>();
  @Output() refreshSongs = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  deleteConfirmOpen = false;
  deleteTargetPlaylist = '';

  reels = [
    {
      title: 'Night Drive Edit',
      creator: 'Aisha & the City Lights',
      duration: '0:18',
      poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=520&fit=crop',
      video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
    {
      title: 'Neon Workout',
      creator: 'Pulse Mode',
      duration: '0:22',
      poster: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&h=520&fit=crop',
      video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
    {
      title: 'Calm Coastline',
      creator: 'Drift Club',
      duration: '0:15',
      poster: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=520&fit=crop',
      video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
  ];

  newPlaylistName = '';
  selectedPlaylistName = '';
  isAddSongModalOpen = false;
  addSongModalQuery = '';
  addSongModalPlaylistName = '';
  homeCompactBackground: string | null = null;
  libraryCompactBackground: string | null = null;
  homeHoverBackground: string | null = null;
  libraryHoverBackground: string | null = null;
  private homeCompactImage = '';
  private libraryCompactImage = '';
  private homeHoverImage = '';
  private libraryHoverImage = '';
  private backgroundCache = new Map<string, string>();

  uploadTitle = '';
  uploadArtist = '';
  uploadAlbum = '';
  uploadImage = '';
  uploadFile: File | null = null;
  uploading = false;
  uploadError = '';
  uploadSuccess = '';
  isMobileCreateOpen = true;

  @ViewChild('uploadFileInput') uploadFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('uploadFileInputMobile') uploadFileInputMobile?: ElementRef<HTMLInputElement>;
  @ViewChild('mobileCreateInput') mobileCreateInput?: ElementRef<HTMLInputElement>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['albums']) {
      this.updateHomeCompactBackground();
    }
    if (changes['favoriteSongs'] || changes['allSongs']) {
      this.updateLibraryCompactBackground();
    }
  }

  get filteredSongs() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      return this.allSongs;
    }
    return this.allSongs.filter((song) =>
      [song.title, song.artist, song.album].some((field) =>
        (field || '').toLowerCase().includes(query)
      )
    );
  }

  onCreatePlaylist() {
    const name = this.newPlaylistName.trim();
    if (!name) {
      return;
    }
    this.createPlaylist.emit(name);
    this.newPlaylistName = '';
  }

  openMobileCreate() {
    this.isMobileCreateOpen = true;
    if (this.mobileCreateInput?.nativeElement) {
      setTimeout(() => this.mobileCreateInput?.nativeElement.focus(), 0);
    }
  }

  onMobileCreatePlaylist() {
    if (!this.newPlaylistName.trim()) {
      return;
    }
    this.onCreatePlaylist();
  }

  isSongInPlaylist(playlist: { name: string; songs: any[] }, song: any) {
    return playlist.songs.some(
      (existing) => existing.title === song.title && existing.artist === song.artist
    );
  }

  onAddSongToPlaylist(playlist: { name: string; songs: any[] }, song: any) {
    if (this.isSongInPlaylist(playlist, song)) {
      return;
    }
    this.addToPlaylist.emit({ playlistName: playlist.name, songs: [song] });
  }

  onUploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files?.length) {
      this.uploadFile = null;
      return;
    }
    this.uploadFile = input.files[0];
  }

  onUploadSong() {
    this.uploadError = '';
    this.uploadSuccess = '';

    if (!this.uploadTitle.trim() || !this.uploadArtist.trim()) {
      this.uploadError = 'Title and artist are required.';
      return;
    }
    if (!this.uploadFile) {
      this.uploadError = 'Please choose an audio file.';
      return;
    }
    if (this.uploadFile.size > 50 * 1024 * 1024) {
      this.uploadError = 'Audio file must be 50MB or smaller.';
      return;
    }

    const formData = new FormData();
    formData.append('title', this.uploadTitle.trim());
    formData.append('artist', this.uploadArtist.trim());
    if (this.uploadAlbum.trim()) {
      formData.append('album', this.uploadAlbum.trim());
    }
    if (this.uploadImage.trim()) {
      formData.append('image', this.uploadImage.trim());
    }
    formData.append('song', this.uploadFile);

    this.uploading = true;
    this.songService
      .uploadSong(formData)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: () => {
          this.uploadSuccess = 'Song uploaded successfully.';
          this.resetUploadForm();
          this.refreshSongs.emit();
        },
        error: (err) => {
          this.uploadError =
            err?.error?.message || 'Upload failed. Please check the API and try again.';
        },
      });
  }

  private resetUploadForm() {
    this.uploadTitle = '';
    this.uploadArtist = '';
    this.uploadAlbum = '';
    this.uploadImage = '';
    this.uploadFile = null;
    if (this.uploadFileInput?.nativeElement) {
      this.uploadFileInput.nativeElement.value = '';
    }
    if (this.uploadFileInputMobile?.nativeElement) {
      this.uploadFileInputMobile.nativeElement.value = '';
    }
  }

  get modalPresentSongs() {
    const source = this.favoriteSongs.length ? this.favoriteSongs : this.allSongs;
    const query = this.addSongModalQuery.toLowerCase().trim();
    if (!query) {
      return source;
    }
    return source.filter((song) =>
      [song.title, song.artist, song.album]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }

  get addSongModalPlaylist() {
    return this.customPlaylists.find((playlist) => playlist.name === this.addSongModalPlaylistName) || null;
  }

  onLibraryAction(song: any) {
    if (this.selectedPlaylistName) {
      this.addToPlaylist.emit({ playlistName: this.selectedPlaylistName, songs: [song] });
    } else {
      this.addToLibrary.emit(song);
    }
  }

  onOpenAddSongModal(playlist: { name: string; songs: any[] }) {
    this.addSongModalPlaylistName = playlist.name;
    this.addSongModalQuery = '';
    this.isAddSongModalOpen = true;
  }

  closeAddSongModal() {
    this.isAddSongModalOpen = false;
    this.addSongModalPlaylistName = '';
    this.addSongModalQuery = '';
  }

  showDeleteConfirm(pl: { name: string; songs: any[] }) {
    this.deleteTargetPlaylist = pl.name;
    this.deleteConfirmOpen = true;
  }

  confirmDelete() {
    if (this.deleteTargetPlaylist) {
      this.deletePlaylist.emit(this.deleteTargetPlaylist);
    }
    this.cancelDelete();
  }

  cancelDelete() {
    this.deleteConfirmOpen = false;
    this.deleteTargetPlaylist = '';
  }

  isSongInModalPlaylist(song: any) {
    if (!this.addSongModalPlaylist) {
      return false;
    }
    return this.addSongModalPlaylist.songs.some(
      (existing: any) => existing.title === song.title && existing.artist === song.artist
    );
  }

  addSongToModalPlaylist(song: any) {
    if (!this.addSongModalPlaylist || this.isSongInModalPlaylist(song)) {
      return;
    }
    this.addToPlaylist.emit({ playlistName: this.addSongModalPlaylist.name, songs: [song] });
  }

  onAddPresentSongsToPlaylist(playlist: { name: string; songs: any[] }) {
    const sourceSongs = this.favoriteSongs.length ? this.favoriteSongs : this.allSongs;
    const newSongs = sourceSongs.filter((song) =>
      !playlist.songs.some(
        (existing) => existing.title === song.title && existing.artist === song.artist
      )
    );
    if (!newSongs.length) {
      return;
    }
    this.addToPlaylist.emit({ playlistName: playlist.name, songs: newSongs });
  }

  onAddSongToDefaultPlaylist(song: any) {
    if (!this.customPlaylists.length) {
      return;
    }
    const targetPlaylist = this.customPlaylists[0];
    if (targetPlaylist.songs.some((existing: any) => existing.title === song.title && existing.artist === song.artist)) {
      return;
    }
    this.addToPlaylist.emit({ playlistName: targetPlaylist.name, songs: [song] });
  }

  playReel(video: HTMLVideoElement | null) {
    if (!video) return;
    video.muted = true;
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') {
      playback.catch(() => undefined);
    }
  }

  pauseReel(video: HTMLVideoElement | null) {
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  onCompactHover(imageUrl: string | undefined, target: 'home' | 'library') {
    const image = imageUrl || '';
    if (!image) {
      this.clearCompactHover(target);
      return;
    }
    if (target === 'home') {
      this.homeHoverImage = image;
    } else {
      this.libraryHoverImage = image;
    }
    this.setHoverBackgroundFromImage(image, target);
  }

  clearCompactHover(target: 'home' | 'library') {
    if (target === 'home') {
      this.homeHoverImage = '';
      this.homeHoverBackground = null;
    } else {
      this.libraryHoverImage = '';
      this.libraryHoverBackground = null;
    }
  }

  private updateHomeCompactBackground() {
    const image = this.albums[0]?.image;
    if (!image) {
      this.homeCompactBackground = null;
      this.homeCompactImage = '';
      return;
    }
    if (image === this.homeCompactImage) {
      return;
    }
    this.homeCompactImage = image;
    this.setCompactBackgroundFromImage(image, 'home');
  }

  private updateLibraryCompactBackground() {
    const source = this.favoriteSongs.length ? this.favoriteSongs : this.allSongs;
    const image = source[0]?.image;
    if (!image) {
      this.libraryCompactBackground = null;
      this.libraryCompactImage = '';
      return;
    }
    if (image === this.libraryCompactImage) {
      return;
    }
    this.libraryCompactImage = image;
    this.setCompactBackgroundFromImage(image, 'library');
  }

  private setHoverBackgroundFromImage(imageUrl: string, target: 'home' | 'library') {
    const cached = this.backgroundCache.get(imageUrl);
    if (cached) {
      if (target === 'home') {
        this.homeHoverBackground = cached;
      } else {
        this.libraryHoverBackground = cached;
      }
      return;
    }
    this.extractDominantColor(imageUrl).then((color) => {
      if (!color) {
        if (target === 'home' && this.homeHoverImage === imageUrl) {
          this.homeHoverBackground = null;
        }
        if (target === 'library' && this.libraryHoverImage === imageUrl) {
          this.libraryHoverBackground = null;
        }
        return;
      }
      const background = `linear-gradient(90deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.4), rgba(10, 12, 15, 0.75))`;
      this.backgroundCache.set(imageUrl, background);
      if (target === 'home' && this.homeHoverImage === imageUrl) {
        this.homeHoverBackground = background;
      }
      if (target === 'library' && this.libraryHoverImage === imageUrl) {
        this.libraryHoverBackground = background;
      }
    });
  }

  private async setCompactBackgroundFromImage(imageUrl: string, target: 'home' | 'library') {
    const cached = this.backgroundCache.get(imageUrl);
    if (cached) {
      if (target === 'home') {
        this.homeCompactBackground = cached;
      } else {
        this.libraryCompactBackground = cached;
      }
      return;
    }
    const color = await this.extractDominantColor(imageUrl);
    if (target === 'home' && imageUrl !== this.homeCompactImage) {
      return;
    }
    if (target === 'library' && imageUrl !== this.libraryCompactImage) {
      return;
    }
    if (!color) {
      if (target === 'home') {
        this.homeCompactBackground = null;
      } else {
        this.libraryCompactBackground = null;
      }
      return;
    }
    const background = `linear-gradient(90deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.35), rgba(10, 12, 15, 0.7))`;
    this.backgroundCache.set(imageUrl, background);
    if (target === 'home') {
      this.homeCompactBackground = background;
    } else {
      this.libraryCompactBackground = background;
    }
  }

  private extractDominantColor(imageUrl: string): Promise<{ r: number; g: number; b: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 32) {
            continue;
          }
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        if (!count) {
          resolve(null);
          return;
        }
        resolve({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        });
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  }
}
