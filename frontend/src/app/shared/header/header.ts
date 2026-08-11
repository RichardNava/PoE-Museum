import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  isMenuOpen = false;
  isNavigationOpen = false;
  currentUser: User | null = null;
  searchTerm = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onSearch(): void {
    const query = this.searchTerm.trim();
    this.searchTerm = '';
    this.router.navigate(['/home'], {
      queryParams: query ? { q: query } : {}
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleNavigation(): void {
    this.isNavigationOpen = !this.isNavigationOpen;
  }

  closeNavigation(): void {
    this.isNavigationOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.isMenuOpen = false;
    this.isNavigationOpen = false;
  }
}
