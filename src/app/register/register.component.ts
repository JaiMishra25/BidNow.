import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: 'buyer' | 'seller' = 'buyer';
  phone: string = '';
  address: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  passwordCriteria = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  };

  constructor(
    private router: Router, 
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  validatePassword(password: string): void {
    this.passwordCriteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }

  onPasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.validatePassword(target.value);
  }

  onRegister(form: any) {
    if (form.valid && this.password === this.confirmPassword) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userData = {
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        phone: this.phone,
        address: this.address
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Registration successful! Redirecting to login...';
          this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
    } else if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
    }
  }
}
