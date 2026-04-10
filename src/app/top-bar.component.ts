import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppView } from './view-types';

@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css'],
})
export class TopBarComponent {
  @Input() activeView: AppView = 'home';
  @Input() searchQuery = '';
  @Output() home = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
}
