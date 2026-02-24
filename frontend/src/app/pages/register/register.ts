import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)]],
      confirmPassword: ['', Validators.required],
      cuenta_poe: ['']
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      this.toastr.error(this.error, 'Error');
      return;
    }

    this.isLoading = true;
    this.error = '';

    const { nombre, email, cuenta_poe } = this.registerForm.value;

    this.authService.register({ nombre, email, password, cuenta_poe }).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.isLoading = false;
        this.success = true;
        this.toastr.success('¡Cuenta creada exitosamente!', 'Bienvenido');
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error al crear la cuenta';
        this.toastr.error(this.error, 'Error');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  get nombre() { return this.registerForm.get('nombre'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get cuenta_poe() { return this.registerForm.get('cuenta_poe'); }
}
