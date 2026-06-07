import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { PassportService } from '../services/passport.service';
import { ProfileService } from '../services/profile.service';
import { FriendService } from '../services/friend.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-passport',
  templateUrl: './passport.page.html',
  styleUrls: ['./passport.page.scss'],
  standalone: false
})
export class PassportPage {
  passportData: any[] = [];
  selectedCountry: any = null;
  userProfile: any = null;
  expandedImageUrl: string | null = null;

  activeFilter: string = 'all';
  flippedCountryId: string | null = null;
  focusedCountryId: string | null = null;
  countryStats: { [id: string]: any } = {};
  isModalLoading: boolean = false;

  hasError: boolean = false;
  isLoading: boolean = true;

  isOwnPassport: boolean = true;
  hasUserIdInRoute: boolean = false;
  userId: string | null = null;
  friendshipStatus: string = 'None'; // 'None', 'Pending_Sent', 'Pending_Received', 'Friends'
  isFriendRequestSent: boolean = false;
  friendCount: number | null = null;

  constructor(
    private passportService: PassportService,
    private profileService: ProfileService,
    private friendService: FriendService,
    private toastCtrl: ToastController,
    private route: ActivatedRoute
  ) { }

  ionViewWillEnter() {
    this.userId = this.route.snapshot.paramMap.get('userId');
    this.hasUserIdInRoute = !!this.userId;

    // Reset state before loading
    this.isLoading = true;
    this.hasError = false;
    this.passportData = [];
    this.userProfile = null;
    this.friendshipStatus = 'None';
    this.isFriendRequestSent = false;

    // Aguarda um perfil com ID real (ignora o estado inicial vazio)
    this.profileService.profile$.pipe(
      filter((profile: any) => !!(profile?.id || profile?.Id)),
      take(1)
    ).subscribe(profile => {
      const loggedInUserId = profile?.id || profile?.Id;

      // Avalia se é o próprio passaporte
      this.isOwnPassport = !this.userId || this.userId === loggedInUserId;

      if (!this.isOwnPassport && this.userId) {
        this.checkFriendStatus();
      }

      // Carrega contagem de amigos (do próprio ou de outro)
      const targetId = this.userId || loggedInUserId;
      if (targetId) {
        this.loadFriendCount(targetId);
      }
    });

    this.loadProfile();
    this.loadPassport();
  }

  checkFriendStatus() {
    this.friendService.checkFriendshipStatus(this.userId!).subscribe({
      next: (res) => {
        this.friendshipStatus = res.status;
        this.isFriendRequestSent = (res.status === 'Pending_Sent' || res.status === 'Friends');
      },
      error: (err) => console.error('Erro ao buscar status amizade', err)
    });
  }

  loadFriendCount(userId: string) {
    this.friendService.getFriendCount(userId).subscribe({
      next: (res) => this.friendCount = res.count,
      error: () => this.friendCount = 0
    });
  }

  loadProfile() {
    if (this.isOwnPassport) {
      this.profileService.profile$.subscribe(profile => {
        this.userProfile = profile;
      });
    } else {
      this.profileService.getUserProfile(this.userId!).subscribe({
        next: profile => this.userProfile = profile,
        error: () => this.hasError = true
      });
    }
  }

  getImageUrl(url: string) {
    if (!url) return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    if (url.startsWith('http')) return url;
    return `${environment.baseUrl}${url}`;
  }

  getOriginFlagUrl(countryCode: string | null): string | null {
    if (!countryCode || countryCode === '...') return null;
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  }

  retryLoading() {
    this.hasError = false;
    this.isLoading = true;

    if (this.isOwnPassport) {
      this.profileService.fetchProfile(); // Apenas forçar a busca, a inscrição (subscribe) já existe
    } else {
      this.loadProfile(); // Buscar novamente o perfil de terceiro
    }

    this.loadPassport();
  }

  async addFriend() {
    if (this.isOwnPassport || !this.userId || this.friendshipStatus === 'Pending_Sent' || this.friendshipStatus === 'Friends') return;

    this.friendService.requestFriendship(this.userId).subscribe({
      next: async (res: any) => {
        this.isFriendRequestSent = true;
        this.friendshipStatus = 'Pending_Sent';
        const toast = await this.toastCtrl.create({
          message: res.message === 'Already friends' ? 'Vocês já são amigos!' : 'Convite enviado!',
          duration: 3000,
          color: 'success'
        });
        toast.present();
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: 'Erro ao enviar convite.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  loadPassport() {
    const request = this.isOwnPassport
      ? this.passportService.getMyPassport()
      : this.passportService.getUserPassport(this.userId!);

    request.subscribe({
      next: (res) => {
        if (!res) res = [];
        this.passportData = res.map((c: any) => ({
          ...c,
          rarity: this.getCountryRarity(c)
        })).sort((a: any, b: any) => this.getRarityWeight(b.rarity) - this.getRarityWeight(a.rarity));
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  getCountryRarity(c: any): string {
    if (c.type === 4 && c.code === 'GALAXY') return 'galactic';
    if (c.type === 4 && c.code === 'OCEAN') return 'obsidian';

    let isPioneer = c.isPioneer;
    if (c.states) {
      for (const s of c.states) {
        if (s.isPioneer) isPioneer = true;
        if (s.cities) {
          for (const city of s.cities) {
            if (city.isPioneer) isPioneer = true;
          }
        }
      }
    }

    if (isPioneer) return 'pioneer';
    return 'base';
  }

  getRarityWeight(r: string): number {
    if (r === 'galactic') return 4;
    if (r === 'obsidian') return 3;
    if (r === 'pioneer') return 2;
    return 1;
  }

  get groupedPassportData() {
    const groups = [
      { rarity: 'galactic', title: 'Galácticos', icon: 'assets/rarities/galactic.png', items: [] as any[] },
      { rarity: 'obsidian', title: 'Terras Longínquas', icon: 'assets/rarities/obsidian.png', items: [] as any[] },
      { rarity: 'pioneer', title: 'Pioneiro', icon: 'assets/rarities/pioneer.png', items: [] as any[] },
      { rarity: 'base', title: 'Selo Base', icon: 'assets/rarities/base.png', items: [] as any[] }
    ];

    this.passportData.forEach(c => {
      const group = groups.find(g => g.rarity === c.rarity);
      if (group) group.items.push(c);
    });

    return groups.filter(g => g.items.length > 0);
  }

  flipCountry(country: any, event: Event) {
    event.stopPropagation();

    // Se clicar numa carta que já está expandida, a gente ignora aqui 
    // porque o clique real será no botão "Ver Coletânea" do verso da carta.
    if (this.focusedCountryId === country.id) {
      return;
    }

    // Aplica o focus instantaneamente (expande pro meio da tela)
    this.focusedCountryId = country.id;

    if (country.id.startsWith('fake-')) {
      // Garantir as propriedades corretas que o HTML espera
      country.unlockedAt = '2026-06-05T12:00:00Z';
      this.countryStats[country.id] = {
        unlockCount: 1,
        percentage: 100
      };
      return;
    }

    // Load stats if not already loaded
    if (!this.countryStats[country.id]) {
      this.passportService.getBadgeDetails(country.id).subscribe((details: any) => {
        this.countryStats[country.id] = details;
      });
    }
  }

  closeFlip() {
    // Fecha instantaneamente recolhendo para a prateleira
    this.focusedCountryId = null;
  }

  openCountryDetails(country: any, event: Event) {
    event.stopPropagation();
    // Use the stats we already fetched, or fetch again
    const details = this.countryStats[country.id] || {};
    this.selectedCountry = { ...country, ...details };

    this.isModalLoading = true;
    this.passportService.getBadgePhotos(country.id, this.userId || undefined).subscribe({
      next: (photos: any[]) => {
        this.selectedCountry.photos = photos;
        this.isModalLoading = false;
      },
      error: () => {
        this.selectedCountry.photos = [];
        this.isModalLoading = false;
      }
    });
  }

  closeCountryDetails() {
    this.selectedCountry = null;
  }

  getPhotosForState(stateId: string, photos: any[]) {
    if (!photos) return [];
    return photos.filter(p => p.stateId === stateId);
  }

  expandImage(photo: any) {
    this.expandedImageUrl = photo.imageUrl ? this.getImageUrl(photo.imageUrl) : 'https://picsum.photos/400/500?random=' + photo.id;
  }
}
