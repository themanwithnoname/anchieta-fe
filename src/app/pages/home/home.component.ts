import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  
  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  navigateToAbout() {
    this.router.navigate(['/about']);
  }

  openLogin() {
    // Simulação de login rápido para demonstração
    this.authService.login('usuario&#64;exemplo.com', 'senha123');
  }
}
