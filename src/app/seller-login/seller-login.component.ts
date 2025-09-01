import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface LoginCredentials {
    email: string;
    password: string;
}

@Component({
    standalone: true,
    imports: [RouterModule, FormsModule, CommonModule],
    selector: 'app-seller-login',
    templateUrl: './seller-login.component.html',
    styleUrl: './seller-login.component.css'
})
export class SellerLoginComponent implements OnInit {
    email: string = '';
    password: string = '';
    errorMessage: string = '';
    successMessage: string = '';
    isLoading: boolean = false;
    rememberMe: boolean = false;
    showPassword: boolean = false;
    isAdminLogin: boolean = false; // Track login type

    // Simulated credentials for both user and admin
    private userCredentials: LoginCredentials[] = [
        { email: 'user@example.com', password: 'Password123@' },
        { email: 'user2@example.com', password: 'Mypassword456@' },
        { email: 'user3@example.com', password: 'Securepass789@' },
        { email: 'user4@example.com', password: 'Userpass321@' },
        { email: 'user5@example.com', password: 'Guestuser123@' },
        { email: 'seller@example.com', password: 'Password123@'}
    ];
    private adminCredentials: LoginCredentials[] = [
        { email: 'admin@example.com', password: 'Admin123@' },
    ];

    constructor(private router: Router) {}

    ngOnInit() {
        // Check for saved credentials in localStorage
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            this.email = savedEmail;
            this.rememberMe = true;
        }
    }

    setLoginType(isAdmin: boolean) {
        this.isAdminLogin = isAdmin;
        this.errorMessage = ''; // Clear error message when switching
    }

    onLogin(form: NgForm) {
        // Reset messages
        this.errorMessage = '';
        this.successMessage = '';

        // Validate form
        if (!form.valid) {
            this.errorMessage = 'Please fill out the form correctly.';
            return;
        }

        // Start loading
        this.isLoading = true;

        // Simulate API call with validation
        this.authenticateUser(this.email, this.password);
    }

    private authenticateUser(email: string, password: string) {
        setTimeout(() => {
            const isValidUser = this.isAdminLogin
                ? this.validateCredentials(this.adminCredentials, email, password)
                : this.validateCredentials(this.userCredentials, email, password);

            if (isValidUser) {
                this.handleSuccessfulLogin();
            } else {
                this.handleLoginFailure();
            }

            this.isLoading = false;
        }, 1500);
    }

    private validateCredentials(credentials: LoginCredentials[], email: string, password: string): boolean {
        return credentials.some(cred => cred.email === email && cred.password === password);
    }

    private handleSuccessfulLogin() {
        if (this.rememberMe && !this.isAdminLogin) {
            localStorage.setItem('rememberedEmail', this.email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        this.successMessage = 'Login successful!';
        this.errorMessage = '';

        setTimeout(() => {
            this.router.navigate([this.isAdminLogin ? '/admin-dashboard' : '/dashboard']);
        }, 1500);
    }

    private handleLoginFailure() {
        this.errorMessage = this.isAdminLogin
            ? 'Invalid admin credentials.'
            : 'Invalid email or password.';
        this.successMessage = '';
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onForgotPassword() {
        this.router.navigate(['/password-recovery']);
    }

    onSignUp() {
        this.router.navigate(['/register']);
    }
}