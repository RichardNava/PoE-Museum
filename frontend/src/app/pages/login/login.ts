import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    this.error = '';
    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.isLoading = false;
        this.toastr.success('¡Bienvenido, ' + user.nombre + '!', 'Login exitoso');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error al iniciar sesión';
        this.toastr.error(this.error, 'Error');
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
