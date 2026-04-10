import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppView } from './view-types';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css'],
})
export class SideNavComponent {
  @Input() activeView: AppView = 'home';
  @Input() recentlyPlayed: any[] = [];
  @Input() favoriteSongs: any[] = [];
  @Input() customPlaylists: any[] = [];
  @Input() searchQuery = '';

  @Output() navigate = new EventEmitter<AppView>();
  @Output() search = new EventEmitter<string>();

  isCollapsed = true;
  libraryTab: 'playlists' | 'artists' = 'playlists';

  get filteredRecently() {
    const term = this.searchQuery?.toLowerCase().trim();
    if (!term) {
      return this.recentlyPlayed;
    }
    return this.recentlyPlayed.filter((item) =>
      [item.title, item.artist, item.album]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  selectLibraryTab(tab: 'playlists' | 'artists') {
    this.libraryTab = tab;
  }

  onSearch(value: string) {
    this.searchQuery = value;
    this.search.emit(value);
    this.navigate.emit('search');
  }
}

