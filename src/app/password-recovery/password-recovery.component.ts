import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.css'],
})
export class PasswordRecoveryComponent {
  email: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private router: Router) {}

  onRecoverPassword(form: any) {
    if (!form.valid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }
  
    // Simulate success response
    setTimeout(() => {
      this.successMessage = 'Password recovery email sent! Check your email for the recovery link.';
      this.errorMessage = '';
    }, 500);
  }
  navigateToLogin() {
    this.router.navigate(['/login']); // Update this path if your login component route is different
  }
}
