import { Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private loggedIn = signal<boolean>(false);

  constructor() {
    // Verifica se há um usuário salvo no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
      this.loggedIn.set(true);
    }
  }

  login(email: string, password: string): boolean {
    // Simulação de login - em produção, isso seria uma chamada para o backend
    if (email && password) {
      const user: User = {
        id: 1,
        name: 'Usuário Exemplo',
        email: email
      };
      
      this.currentUser.set(user);
      this.loggedIn.set(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    this.loggedIn.set(false);
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }
}
