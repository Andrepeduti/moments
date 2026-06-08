import { environment } from '../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ProfileService } from '../services/profile.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: false
})
export class EditProfilePage implements OnInit {
  profileData: any = {};
  countries = [
    { code: 'AF', name: 'Afeganistão' }, { code: 'ZA', name: 'África do Sul' }, { code: 'AL', name: 'Albânia' }, { code: 'DE', name: 'Alemanha' },
    { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antígua e Barbuda' }, { code: 'SA', name: 'Arábia Saudita' },
    { code: 'DZ', name: 'Argélia' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armênia' }, { code: 'AU', name: 'Austrália' },
    { code: 'AT', name: 'Áustria' }, { code: 'AZ', name: 'Azerbaijão' }, { code: 'BS', name: 'Bahamas' }, { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' }, { code: 'BH', name: 'Bahrein' }, { code: 'BE', name: 'Bélgica' }, { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' }, { code: 'BY', name: 'Bielorrússia' }, { code: 'BO', name: 'Bolívia' }, { code: 'BA', name: 'Bósnia e Herzegovina' },
    { code: 'BW', name: 'Botsuana' }, { code: 'BR', name: 'Brasil' }, { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgária' },
    { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' }, { code: 'BT', name: 'Butão' }, { code: 'CV', name: 'Cabo Verde' },
    { code: 'CM', name: 'Camarões' }, { code: 'KH', name: 'Camboja' }, { code: 'CA', name: 'Canadá' }, { code: 'QA', name: 'Catar' },
    { code: 'KZ', name: 'Cazaquistão' }, { code: 'TD', name: 'Chade' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
    { code: 'CY', name: 'Chipre' }, { code: 'CO', name: 'Colômbia' }, { code: 'KM', name: 'Comores' }, { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (RDC)' }, { code: 'KP', name: 'Coreia do Norte' }, { code: 'KR', name: 'Coreia do Sul' }, { code: 'CI', name: 'Costa do Marfim' },
    { code: 'CR', name: 'Costa Rica' }, { code: 'HR', name: 'Croácia' }, { code: 'CU', name: 'Cuba' }, { code: 'DK', name: 'Dinamarca' },
    { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' }, { code: 'EG', name: 'Egito' }, { code: 'SV', name: 'El Salvador' },
    { code: 'AE', name: 'Emirados Árabes' }, { code: 'EC', name: 'Equador' }, { code: 'ER', name: 'Eritreia' }, { code: 'SK', name: 'Eslováquia' },
    { code: 'SI', name: 'Eslovênia' }, { code: 'ES', name: 'Espanha' }, { code: 'US', name: 'Estados Unidos' }, { code: 'EE', name: 'Estônia' },
    { code: 'ET', name: 'Etiópia' }, { code: 'FJ', name: 'Fiji' }, { code: 'PH', name: 'Filipinas' }, { code: 'FI', name: 'Finlândia' },
    { code: 'FR', name: 'França' }, { code: 'GA', name: 'Gabão' }, { code: 'GM', name: 'Gâmbia' }, { code: 'GH', name: 'Gana' },
    { code: 'GE', name: 'Geórgia' }, { code: 'GD', name: 'Granada' }, { code: 'GR', name: 'Grécia' }, { code: 'GT', name: 'Guatemala' },
    { code: 'GY', name: 'Guiana' }, { code: 'GN', name: 'Guiné' }, { code: 'GW', name: 'Guiné-Bissau' }, { code: 'GQ', name: 'Guiné Equatorial' },
    { code: 'HT', name: 'Haiti' }, { code: 'NL', name: 'Holanda' }, { code: 'HN', name: 'Honduras' }, { code: 'HU', name: 'Hungria' },
    { code: 'YE', name: 'Iêmen' }, { code: 'MH', name: 'Ilhas Marshall' }, { code: 'IN', name: 'Índia' }, { code: 'ID', name: 'Indonésia' },
    { code: 'IR', name: 'Irã' }, { code: 'IQ', name: 'Iraque' }, { code: 'IE', name: 'Irlanda' }, { code: 'IS', name: 'Islândia' },
    { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Itália' }, { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japão' },
    { code: 'JO', name: 'Jordânia' }, { code: 'KW', name: 'Kuwait' }, { code: 'LA', name: 'Laos' }, { code: 'LS', name: 'Lesoto' },
    { code: 'LV', name: 'Letônia' }, { code: 'LB', name: 'Líbano' }, { code: 'LR', name: 'Libéria' }, { code: 'LY', name: 'Líbia' },
    { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lituânia' }, { code: 'LU', name: 'Luxemburgo' }, { code: 'MK', name: 'Macedônia do Norte' },
    { code: 'MG', name: 'Madagascar' }, { code: 'MY', name: 'Malásia' }, { code: 'MW', name: 'Malawi' }, { code: 'MV', name: 'Maldivas' },
    { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' }, { code: 'MA', name: 'Marrocos' }, { code: 'MU', name: 'Maurício' },
    { code: 'MR', name: 'Mauritânia' }, { code: 'MX', name: 'México' }, { code: 'MM', name: 'Mianmar' }, { code: 'FM', name: 'Micronésia' },
    { code: 'MZ', name: 'Moçambique' }, { code: 'MD', name: 'Moldávia' }, { code: 'MC', name: 'Mônaco' }, { code: 'MN', name: 'Mongólia' },
    { code: 'ME', name: 'Montenegro' }, { code: 'NA', name: 'Namíbia' }, { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
    { code: 'NI', name: 'Nicarágua' }, { code: 'NE', name: 'Níger' }, { code: 'NG', name: 'Nigéria' }, { code: 'NO', name: 'Noruega' },
    { code: 'NZ', name: 'Nova Zelândia' }, { code: 'OM', name: 'Omã' }, { code: 'PA', name: 'Panamá' }, { code: 'PG', name: 'Papua Nova Guiné' },
    { code: 'PK', name: 'Paquistão' }, { code: 'PY', name: 'Paraguai' }, { code: 'PE', name: 'Peru' }, { code: 'PL', name: 'Polônia' },
    { code: 'PT', name: 'Portugal' }, { code: 'KE', name: 'Quênia' }, { code: 'KG', name: 'Quirguistão' }, { code: 'KI', name: 'Kiribati' },
    { code: 'GB', name: 'Reino Unido' }, { code: 'CF', name: 'República Centro-Africana' }, { code: 'CZ', name: 'República Tcheca' }, { code: 'DO', name: 'República Dominicana' },
    { code: 'RO', name: 'Romênia' }, { code: 'RW', name: 'Ruanda' }, { code: 'RU', name: 'Rússia' }, { code: 'SB', name: 'Ilhas Salomão' },
    { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'LC', name: 'Santa Lúcia' }, { code: 'KN', name: 'São Cristóvão e Nevis' },
    { code: 'ST', name: 'São Tomé e Príncipe' }, { code: 'VC', name: 'São Vicente e Granadinas' }, { code: 'SC', name: 'Seicheles' }, { code: 'SN', name: 'Senegal' },
    { code: 'SL', name: 'Serra Leoa' }, { code: 'RS', name: 'Sérvia' }, { code: 'SG', name: 'Singapura' }, { code: 'SY', name: 'Síria' },
    { code: 'SO', name: 'Somália' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SZ', name: 'Eswatini' }, { code: 'SD', name: 'Sudão' },
    { code: 'SS', name: 'Sudão do Sul' }, { code: 'SE', name: 'Suécia' }, { code: 'CH', name: 'Suíça' }, { code: 'SR', name: 'Suriname' },
    { code: 'TJ', name: 'Tajiquistão' }, { code: 'TH', name: 'Tailândia' }, { code: 'TW', name: 'Taiwan' }, { code: 'TZ', name: 'Tanzânia' },
    { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad e Tobago' }, { code: 'TN', name: 'Tunísia' },
    { code: 'TM', name: 'Turcomenistão' }, { code: 'TR', name: 'Turquia' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UA', name: 'Ucrânia' },
    { code: 'UG', name: 'Uganda' }, { code: 'UY', name: 'Uruguai' }, { code: 'UZ', name: 'Uzbequistão' }, { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vaticano' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnã' }, { code: 'ZM', name: 'Zâmbia' },
    { code: 'ZW', name: 'Zimbábue' }
  ];

  constructor(
    private profileService: ProfileService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.profileService.profile$.pipe(
      filter(profile => !!profile),
      take(1)
    ).subscribe(profile => {
      // Fazemos uma cópia para poder editar no form sem alterar o estado global até salvar
      this.profileData = { ...profile };
    });
  }


  saveProfile() {
    this.profileService.updateProfile(this.profileData);
    this.navCtrl.back();
  }

  getImageUrl(url: string) {
    if (!url) return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    if (url.startsWith('http')) return url;
    return `${environment.baseUrl}${url}`;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadProfilePicture(file).subscribe({
        next: (res: any) => {
          this.profileData.profilePictureUrl = res.profilePictureUrl;
        },
        error: (err) => console.error('Erro ao enviar foto', err)
      });
    }
  }
}
