import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() sidebarToggle = new EventEmitter<void>();

  constructor(public authService: AuthService) {}

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  login() {
    this.authService.login('usuario&#64;exemplo.com', 'senha123');
  }

  logout() {
    this.authService.logout();
  }
}
