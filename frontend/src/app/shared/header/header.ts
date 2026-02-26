import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { BuildService } from '../../services/build';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  isMenuOpen = false;
  currentUser: User | null = null;
  searchTerm = '';

  constructor(
    private authService: AuthService,
    private buildService: BuildService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onSearch(): void {
    this.buildService.setSearchTerm(this.searchTerm);
    if (this.router.url !== '/home') {
      this.router.navigate(['/home']);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.isMenuOpen = false;
  }
}