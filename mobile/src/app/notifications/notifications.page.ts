import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { FriendService } from '../services/friend.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: false
})
export class NotificationsPage {
  requests: any[] = [];
  isLoading = true;

  constructor(
    private friendService: FriendService,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.friendService.getPendingRequests().subscribe({
      next: (res) => {
        this.requests = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  async acceptRequest(requesterId: string) {
    this.friendService.acceptFriendship(requesterId).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Solicitação aceita com sucesso!',
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.requests = this.requests.filter(r => r.id !== requesterId);
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Erro ao aceitar solicitação.',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  getProfileImageUrl(url: string | undefined): string {
    if (!url) return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    if (url.startsWith('http')) return url;
    return `${environment.baseUrl}${url}`;
  }
}
