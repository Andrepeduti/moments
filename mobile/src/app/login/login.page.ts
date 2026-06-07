import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async login() {
    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigateByUrl('/', { replaceUrl: true });
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: 'E-mail ou senha incorretos.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  async fakeSocialLogin() {
    const randomNum = Math.floor(Math.random() * 10000);
    const mockEmail = `tester${randomNum}@moments.com`;
    
    this.authService.socialLogin({
      provider: 'google',
      providerToken: 'fake-token',
      email: mockEmail,
      name: `Tester ${randomNum}`
    }).subscribe({
      next: () => {
        this.router.navigateByUrl('/', { replaceUrl: true });
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Erro no login social.',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }
}
