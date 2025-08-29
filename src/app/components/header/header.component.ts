import { Component, signal } from '@angular/core';
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
  dropdownAberto = signal<boolean>(false);
  vtAtual = signal<string>('10ª VT de São Paulo');

  constructor(public authService: AuthService) {}

  login() {
    this.authService.login('usuario@exemplo.com', 'senha123');
  }

  logout() {
    this.authService.logout();
  }

  toggleDropdown() {
    this.dropdownAberto.set(!this.dropdownAberto());
  }

  selecionarVT(vt: string) {
    this.vtAtual.set(vt);
    this.dropdownAberto.set(false);
  }
}
