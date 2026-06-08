import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  isBiometricAvailable = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    try {
      const result = await BiometricAuth.checkBiometry();
      this.isBiometricAvailable = result.isAvailable;

      if (this.isBiometricAvailable && this.authService.isBiometricsEnabled) {
        await this.loginWithBiometrics();
      }
    } catch (e) {
      console.error('Biometria não disponível', e);
    }
  }

  async loginWithBiometrics() {
    try {
      await BiometricAuth.authenticate({
        reason: 'Faça login para acessar o Moments',
        iosFallbackTitle: 'Usar Senha',
        androidTitle: 'Autenticação',
        androidSubtitle: 'Use sua biometria'
      });

      // Se passou da biometria, tentamos logar com as credenciais salvas
      const storedEmail = localStorage.getItem('biometric_email');
      const storedPassword = localStorage.getItem('biometric_password');
      
      if (storedEmail && storedPassword) {
        this.email = storedEmail;
        this.password = storedPassword;
        this.login(true);
      } else {
        const toast = await this.toastCtrl.create({
          message: 'Credenciais não encontradas. Faça login com senha.',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
      }
    } catch (e) {
      console.error('Falha ou cancelamento na biometria', e);
    }
  }

  async login(isAuto = false) {
    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: async () => {
        if (!isAuto && !this.authService.isBiometricsEnabled && this.isBiometricAvailable) {
          const alert = await this.alertCtrl.create({
            header: 'Ativar Biometria?',
            message: 'Deseja usar sua biometria (FaceID/Digital) para entrar mais rápido nas próximas vezes?',
            buttons: [
              { text: 'Não', role: 'cancel' },
              { 
                text: 'Sim', 
                handler: () => {
                  this.authService.setBiometricsEnabled(true);
                  localStorage.setItem('biometric_email', this.email);
                  localStorage.setItem('biometric_password', this.password);
                }
              }
            ]
          });
          await alert.present();
          await alert.onDidDismiss();
        } else if (!isAuto && this.authService.isBiometricsEnabled) {
          // Se já ativado, só atualiza as senhas em cache (pode ter mudado)
          localStorage.setItem('biometric_email', this.email);
          localStorage.setItem('biometric_password', this.password);
        }

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
