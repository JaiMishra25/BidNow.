import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
    standalone: true,
    imports: [RouterModule, FormsModule, CommonModule],
    selector: 'app-admin-login',
    templateUrl: './admin-login.component.html',
    styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
    email: string = '';
    password: string = '';
    errorMessage: string = '';
    isLoading: boolean = false;
    showPassword: boolean = false;

    constructor(private router: Router, private authService: AuthService) {}

    onAdminLogin(form: NgForm) {
        if (!form.valid) {
            this.errorMessage = 'Please fill out the form correctly.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.authService.login({ email: this.email, password: this.password }).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.user.role !== 'admin') {
              this.errorMessage = 'You are not authorized to access admin panel.';
              this.authService.logout();
              return;
            }
            this.router.navigate(['/admin-dashboard']);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.error?.message || 'Invalid admin credentials.';
          }
        });
    }
 
    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }
}
