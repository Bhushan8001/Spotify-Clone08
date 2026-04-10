import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css'],
})
export class PlayerComponent implements OnChanges {
[x: string]: any;
  @Input() currentSong: any = null;
  @Input() isPlaying = false;
  isMobileExpanded = false;
  playerBackground: string | null = null;

  currentTime = '0:00';
  duration = '0:00';
  progress = 0;

  @Output() togglePlay = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Input() shuffle = false;
  @Input() repeat = false;
  @Output() toggleShuffle = new EventEmitter<void>();
  @Output() toggleRepeat = new EventEmitter<void>();

  @ViewChild('audioPlayer', { static: true }) audioPlayer!: ElementRef<HTMLAudioElement>;
  private currentPoster = '';
  private backgroundCache = new Map<string, string>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentSong'] && this.audioPlayer) {
      const audio = this.audioPlayer.nativeElement;
      if (this.currentSong?.audioUrl) {
        audio.src = this.currentSong.audioUrl;
        audio.load();
        if (this.isPlaying) {
          audio.play().catch(() => {});
        }
      }
      this.updatePlayerBackground(this.currentSong?.image);
    }
    if (changes['isPlaying'] && this.audioPlayer) {
      const audio = this.audioPlayer.nativeElement;
      if (this.isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
  }

  updateProgress() {
    const audio = this.audioPlayer.nativeElement;
    if (!audio.duration || isNaN(audio.duration)) {
      return;
    }
    this.progress = (audio.currentTime / audio.duration) * 100;
    this.currentTime = formatTime(audio.currentTime);
    this.duration = formatTime(audio.duration);
  }

  seek(event: MouseEvent) {
    const audio = this.audioPlayer.nativeElement;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = fraction * audio.duration;
  }

  onEnded() {
    const audio = this.audioPlayer.nativeElement;
    if (this.repeat) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    this.next.emit();
  }

  openMobilePlayer(event?: MouseEvent) {
    if (typeof window !== 'undefined' && window.innerWidth > 900) {
      return;
    }
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button') || target?.closest('input')) {
      return;
    }
    this.isMobileExpanded = true;
  }

  closeMobilePlayer() {
    this.isMobileExpanded = false;
  }

  private updatePlayerBackground(imageUrl?: string) {
    const image = imageUrl || '';
    if (!image) {
      this.playerBackground = null;
      this.currentPoster = '';
      return;
    }
    if (image === this.currentPoster) {
      return;
    }
    this.currentPoster = image;
    const cached = this.backgroundCache.get(image);
    if (cached) {
      this.playerBackground = cached;
      return;
    }
    this.extractDominantColor(image).then((color) => {
      if (!color) {
        if (this.currentPoster === image) {
          this.playerBackground = null;
        }
        return;
      }
      const background = `rgb(${color.r}, ${color.g}, ${color.b})`;
      this.backgroundCache.set(image, background);
      if (this.currentPoster === image) {
        this.playerBackground = background;
      }
    });
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
