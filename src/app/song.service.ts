import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Song } from './models/song';

const SERVER_BASE = 'http://localhost:3000';
const API_BASE = `${SERVER_BASE}`;
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
];

@Injectable({
  providedIn: 'root',
})
export class SongService {
  constructor(private http: HttpClient) {}

  getSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(`${API_BASE}/songs`).pipe(
      map((songs) => songs.map((song) => this.normalizeSong(song)))
    );
  }

  uploadSong(payload: FormData): Observable<unknown> {
    return this.http.post(`${API_BASE}/upload`, payload);
  }

  deleteSong(id: string): Observable<unknown> {
    return this.http.delete(`${API_BASE}/songs/${id}`);
  }

  private normalizeSong(song: Song): Song {
    const image = this.normalizeImage(song);
    let audioUrl = song.audioUrl || '';

    if (!audioUrl && song.filePath) {
      const normalizedPath = song.filePath.replace(/\\/g, '/');
      if (normalizedPath.startsWith('http')) {
        audioUrl = normalizedPath;
      } else if (normalizedPath.startsWith('music/')) {
        audioUrl = `${SERVER_BASE}/${normalizedPath}`;
      } else if (normalizedPath.startsWith('/music/')) {
        audioUrl = `${SERVER_BASE}${normalizedPath}`;
      } else if (normalizedPath.startsWith('uploads/')) {
        audioUrl = `${SERVER_BASE}/${normalizedPath.replace(/^uploads\//, 'music/')}`;
      } else if (normalizedPath.startsWith('/uploads/')) {
        audioUrl = `${SERVER_BASE}${normalizedPath.replace(/^\/uploads\//, '/music/')}`;
      } else {
        audioUrl = `${SERVER_BASE}/music/${normalizedPath}`;
      }
    } else if (audioUrl && !audioUrl.startsWith('http')) {
      audioUrl = `${SERVER_BASE}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
    }

    return { ...song, image, audioUrl };
  }

  private normalizeImage(song: Song): string {
    const supplied = (song.image || '').trim();
    if (supplied) {
      return supplied;
    }
    const base = `${song.title || ''}|${song.artist || ''}|${song.album || ''}`;
    const index = this.hashString(base) % DEFAULT_IMAGES.length;
    return DEFAULT_IMAGES[index];
  }

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
