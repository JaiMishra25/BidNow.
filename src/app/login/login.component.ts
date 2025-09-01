import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface LoginCredentials {
    email: string;
    password: string;
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    email: string = '';
    password: string = '';
    errorMessage: string = '';
    successMessage: string = '';
    isLoading: boolean = false;
    rememberMe: boolean = false;
    showPassword: boolean = false;
    isAdminLogin: boolean = false; // Track login type

    constructor(
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        // Check if user is already logged in
        if (this.authService.isAuthenticated()) {
            const user = this.authService.getCurrentUser();
            if (user) {
                this.redirectBasedOnRole(user.role);
            }
        }
    }

    setLoginType(isAdmin: boolean) {
        this.isAdminLogin = isAdmin;
        this.errorMessage = '';
        this.successMessage = '';
    }

    onLogin(form: NgForm) {
        if (form.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            this.authService.login({
                email: this.email,
                password: this.password
            }).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    // Disallow admin login from user login page
                    if (response.user.role === 'admin') {
                        this.authService.logout();
                        this.errorMessage = 'Please use the Admin Login page to sign in as admin.';
                        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
                        this.router.navigate(['/admin-login']);
                        return;
                    }

                    this.successMessage = 'Login successful!';
                    this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
                    
                    // Redirect based on user role
                    this.redirectBasedOnRole(response.user.role);
                },
                error: (error) => {
                    this.isLoading = false;
                    this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
                    this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
                }
            });
        } else {
            this.errorMessage = 'Please fill in all required fields.';
            this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
        }
    }

    private redirectBasedOnRole(role: string) {
        switch (role) {
            case 'admin':
                this.router.navigate(['/admin-dashboard']);
                break;
            case 'seller':
                this.router.navigate(['/dashboard']);
                break;
            case 'buyer':
            default:
                this.router.navigate(['/dashboard']);
                break;
        }
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onForgotPassword() {
        if (this.email) {
            this.authService.forgotPassword(this.email).subscribe({
                next: (response) => {
                    this.snackBar.open('Password reset email sent!', 'Close', { duration: 3000 });
                },
                error: (error) => {
                    this.snackBar.open(error.error?.message || 'Failed to send reset email', 'Close', { duration: 5000 });
                }
            });
        } else {
            this.snackBar.open('Please enter your email first', 'Close', { duration: 3000 });
        }
    }

    onSignUp() {
        this.router.navigate(['/register']);
    }
}