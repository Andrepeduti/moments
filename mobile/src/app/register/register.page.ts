import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ToastController, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  name = '';
  username = '';
  email = '';
  password = '';
  nationality = 'BR';
  
  countries = [
    { code: 'AF', name: 'Afeganistão' }, { code: 'ZA', name: 'África do Sul' }, { code: 'AL', name: 'Albânia' }, { code: 'DE', name: 'Alemanha' },
    { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antígua e Barbuda' }, { code: 'SA', name: 'Arábia Saudita' },
    { code: 'DZ', name: 'Argélia' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armênia' }, { code: 'AU', name: 'Austrália' },
    { code: 'AT', name: 'Áustria' }, { code: 'AZ', name: 'Azerbaijão' }, { code: 'BS', name: 'Bahamas' }, { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' }, { code: 'BH', name: 'Bahrein' }, { code: 'BE', name: 'Bélgica' }, { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benim' }, { code: 'BY', name: 'Bielorrússia' }, { code: 'BO', name: 'Bolívia' }, { code: 'BA', name: 'Bósnia e Herzegovina' },
    { code: 'BW', name: 'Botsuana' }, { code: 'BR', name: 'Brasil' }, { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgária' },
    { code: 'BF', name: 'Burquina Faso' }, { code: 'BI', name: 'Burundi' }, { code: 'BT', name: 'Butão' }, { code: 'CV', name: 'Cabo Verde' },
    { code: 'CM', name: 'Camarões' }, { code: 'KH', name: 'Camboja' }, { code: 'CA', name: 'Canadá' }, { code: 'QA', name: 'Catar' },
    { code: 'KZ', name: 'Cazaquistão' }, { code: 'TD', name: 'Chade' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
    { code: 'CY', name: 'Chipre' }, { code: 'CO', name: 'Colômbia' }, { code: 'KM', name: 'Comores' }, { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (RD)' }, { code: 'KP', name: 'Coreia do Norte' }, { code: 'KR', name: 'Coreia do Sul' }, { code: 'CI', name: 'Costa do Marfim' },
    { code: 'CR', name: 'Costa Rica' }, { code: 'HR', name: 'Croácia' }, { code: 'CU', name: 'Cuba' }, { code: 'DK', name: 'Dinamarca' },
    { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' }, { code: 'EG', name: 'Egito' }, { code: 'SV', name: 'El Salvador' },
    { code: 'AE', name: 'Emirados Árabes Unidos' }, { code: 'EC', name: 'Equador' }, { code: 'ER', name: 'Eritreia' }, { code: 'SK', name: 'Eslováquia' },
    { code: 'SI', name: 'Eslovênia' }, { code: 'ES', name: 'Espanha' }, { code: 'US', name: 'Estados Unidos' }, { code: 'EE', name: 'Estônia' },
    { code: 'SZ', name: 'Eswatini' }, { code: 'ET', name: 'Etiópia' }, { code: 'FJ', name: 'Fiji' }, { code: 'PH', name: 'Filipinas' },
    { code: 'FI', name: 'Finlândia' }, { code: 'FR', name: 'França' }, { code: 'GA', name: 'Gabão' }, { code: 'GM', name: 'Gâmbia' },
    { code: 'GH', name: 'Gana' }, { code: 'GE', name: 'Geórgia' }, { code: 'GD', name: 'Granada' }, { code: 'GR', name: 'Grécia' },
    { code: 'GT', name: 'Guatemala' }, { code: 'GY', name: 'Guiana' }, { code: 'GN', name: 'Guiné' }, { code: 'GQ', name: 'Guiné Equatorial' },
    { code: 'GW', name: 'Guiné-Bissau' }, { code: 'HT', name: 'Haiti' }, { code: 'NL', name: 'Holanda' }, { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungria' }, { code: 'YE', name: 'Iêmen' }, { code: 'MH', name: 'Ilhas Marshall' }, { code: 'SB', name: 'Ilhas Salomão' },
    { code: 'IN', name: 'Índia' }, { code: 'ID', name: 'Indonésia' }, { code: 'IR', name: 'Irã' }, { code: 'IQ', name: 'Iraque' },
    { code: 'IE', name: 'Irlanda' }, { code: 'IS', name: 'Islândia' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Itália' },
    { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japão' }, { code: 'JO', name: 'Jordânia' }, { code: 'KW', name: 'Kuwait' },
    { code: 'LA', name: 'Laos' }, { code: 'LS', name: 'Lesoto' }, { code: 'LV', name: 'Letônia' }, { code: 'LB', name: 'Líbano' },
    { code: 'LR', name: 'Libéria' }, { code: 'LY', name: 'Líbia' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lituânia' },
    { code: 'LU', name: 'Luxemburgo' }, { code: 'MK', name: 'Macedônia do Norte' }, { code: 'MG', name: 'Madagascar' }, { code: 'MY', name: 'Malásia' },
    { code: 'MW', name: 'Malawi' }, { code: 'MV', name: 'Maldivas' }, { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
    { code: 'MA', name: 'Marrocos' }, { code: 'MU', name: 'Maurício' }, { code: 'MR', name: 'Mauritânia' }, { code: 'MX', name: 'México' },
    { code: 'MM', name: 'Mianmar' }, { code: 'FM', name: 'Micronésia' }, { code: 'MZ', name: 'Moçambique' }, { code: 'MD', name: 'Moldávia' },
    { code: 'MC', name: 'Mônaco' }, { code: 'MN', name: 'Mongólia' }, { code: 'ME', name: 'Montenegro' }, { code: 'NA', name: 'Namíbia' },
    { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' }, { code: 'NI', name: 'Nicarágua' }, { code: 'NE', name: 'Níger' },
    { code: 'NG', name: 'Nigéria' }, { code: 'NO', name: 'Noruega' }, { code: 'NZ', name: 'Nova Zelândia' }, { code: 'OM', name: 'Omã' },
    { code: 'PW', name: 'Palau' }, { code: 'PA', name: 'Panamá' }, { code: 'PG', name: 'Papua-Nova Guiné' }, { code: 'PK', name: 'Paquistão' },
    { code: 'PY', name: 'Paraguai' }, { code: 'PE', name: 'Peru' }, { code: 'PL', name: 'Polônia' }, { code: 'PT', name: 'Portugal' },
    { code: 'KE', name: 'Quênia' }, { code: 'KG', name: 'Quirguistão' }, { code: 'KI', name: 'Kiribati' }, { code: 'GB', name: 'Reino Unido' },
    { code: 'CF', name: 'República Centro-Africana' }, { code: 'CZ', name: 'República Tcheca' }, { code: 'RO', name: 'Romênia' }, { code: 'RW', name: 'Ruanda' },
    { code: 'RU', name: 'Rússia' }, { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'São Tomé e Príncipe' },
    { code: 'VC', name: 'São Vicente e Granadinas' }, { code: 'SN', name: 'Senegal' }, { code: 'SL', name: 'Serra Leoa' }, { code: 'RS', name: 'Sérvia' },
    { code: 'SC', name: 'Seychelles' }, { code: 'SG', name: 'Singapura' }, { code: 'SY', name: 'Síria' }, { code: 'SO', name: 'Somália' },
    { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudão' }, { code: 'SS', name: 'Sudão do Sul' }, { code: 'SE', name: 'Suécia' },
    { code: 'CH', name: 'Suíça' }, { code: 'SR', name: 'Suriname' }, { code: 'TJ', name: 'Tajiquistão' }, { code: 'TH', name: 'Tailândia' },
    { code: 'TZ', name: 'Tanzânia' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad e Tobago' },
    { code: 'TN', name: 'Tunísia' }, { code: 'TM', name: 'Turcomenistão' }, { code: 'TR', name: 'Turquia' }, { code: 'TV', name: 'Tuvalu' },
    { code: 'UA', name: 'Ucrânia' }, { code: 'UG', name: 'Uganda' }, { code: 'UY', name: 'Uruguai' }, { code: 'UZ', name: 'Uzbequistão' },
    { code: 'VU', name: 'Vanuatu' }, { code: 'VA', name: 'Vaticano' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnã' },
    { code: 'ZM', name: 'Zâmbia' }, { code: 'ZW', name: 'Zimbábue' }
  ];
  
  selectedImageUri: string | null = null;
  selectedImageBlob: Blob | null = null;
  isLoading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      this.selectedImageUri = image.webPath || null;
      
      if (image.webPath) {
        const response = await fetch(image.webPath);
        this.selectedImageBlob = await response.blob();
      }
    } catch (e) {
      console.log('Seleção cancelada pelo usuário ou erro.', e);
    }
  }

  async register() {
    if (!this.name || !this.username || !this.email || !this.password) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha todos os campos obrigatórios.',
        duration: 3000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('Name', this.name);
    formData.append('Username', this.username);
    formData.append('Email', this.email);
    formData.append('Password', this.password);
    formData.append('Nationality', this.nationality);
    
    if (this.selectedImageBlob) {
      formData.append('ProfilePicture', this.selectedImageBlob, 'avatar.jpg');
    }

    this.authService.register(formData).subscribe({
      next: async (res) => {
        this.isLoading = false;

        try {
          const result = await BiometricAuth.checkBiometry();
          if (result.isAvailable) {
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
          }
        } catch (e) {
          console.error('Erro ao verificar biometria no registro', e);
        }

        this.router.navigate(['/tabs/home']);
      },
      error: async (err) => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({
          message: err.error || 'Erro ao registrar. Tente outro usuário ou email.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }
}
