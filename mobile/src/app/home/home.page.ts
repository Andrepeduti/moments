import { Component, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PostService } from '../services/post.service';
import { FriendService } from '../services/friend.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnDestroy {
  activeTab: 'amigos' | 'descobrir' = 'descobrir';
  posts: any[] = [];
  userLat: number | null = null;
  userLon: number | null = null;
  isLoading: boolean = true;
  pendingRequestsCount: number = 0;
  private countSub?: Subscription;

  constructor(
    private postService: PostService,
    private friendService: FriendService,
    private sanitizer: DomSanitizer
  ) {
    // Assina o stream reativo — atualiza o badge automaticamente
    this.countSub = this.friendService.pendingCount$.subscribe(count => {
      this.pendingRequestsCount = count;
    });
  }

  ngOnDestroy() {
    this.countSub?.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.getUserLocation();
    this.loadFeed();
    // Busca pendentes para atualizar o BehaviorSubject (o badge já é reativo)
    this.friendService.getPendingRequests().subscribe();
  }

  async getUserLocation() {
    this.userLat = -23.5505;
    this.userLon = -46.6333;
  }

  loadFeed(event?: any) {
    if (!event) {
      this.isLoading = true;
      this.posts = []; // Limpa postagens velhas ao trocar a aba
    }
    
    const request = this.activeTab === 'descobrir' 
      ? this.postService.getDiscoverFeed(this.userLat ?? undefined, this.userLon ?? undefined)
      : this.postService.getFriendsFeed();

    request.subscribe({
      next: (res: any[]) => {
        this.posts = this.processPosts(res);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (err) => {
        console.error('Error fetching feed', err);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  doRefresh(event: any) {
    this.friendService.getPendingRequests().subscribe();
    this.getUserLocation().then(() => {
      this.loadFeed(event);
    });
  }

  segmentChanged(event: any) {
    this.loadFeed();
  }

  processPosts(posts: any[]) {
    return posts.map(p => ({
      ...p,
      locationName: p.locationName ? p.locationName.replace(/^,\s*/, '') : 'Local desconhecido',
      isFlipped: false,
      distance: this.calculateDistance(p.lat, p.lon)
    }));
  }

  getImageUrl(url: string) {
    if (!url) return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    if (url.startsWith('http')) return url;
    return `http://localhost:5106${url}`;
  }

  getMapUrl(post: any): string {
    const lat = post.lat || 0;
    const lon = post.lon || 0;
    const baseUrl = 'https://static-maps.yandex.ru/1.x/?lang=en_US&l=map&size=450,450';
    
    if (post.privacyLevel === 3) {
      // Nível Macro: Mostra o País
      let center = `0,0`;
      let zoom = 1;
      const locName = post.locationName || '';
      
      if (locName.includes('Brasil')) {
        center = `-51.9253,-14.2350`; zoom = 4; // Yandex usa lon,lat
      } else if (locName.includes('Portugal')) {
        center = `-8.2245,39.3999`; zoom = 6;
      } else if (locName.includes('United States')) {
        center = `-95.7129,37.0902`; zoom = 3;
      }
      
      return `${baseUrl}&ll=${center}&z=${zoom}`;
    } else if (post.privacyLevel === 2) {
      // Região Aproximada: Zoom afastado e SEM marcador
      return `${baseUrl}&ll=${lon},${lat}&z=12`;
    } else {
      // Local Exato: Zoom focado e COM marcador
      return `${baseUrl}&ll=${lon},${lat}&z=15&pt=${lon},${lat},pm2rdm`;
    }
  }

  toggleFlip(post: any) {
    post.isFlipped = !post.isFlipped;
  }

  reportPost(post: any, event: Event) {
    event.stopPropagation();
    this.postService.reportPost(post.id).subscribe(() => {
      // Mock: hide it locally for immediate feedback
      this.posts = this.posts.filter(p => p.id !== post.id);
    });
  }

  // Haversine formula
  calculateDistance(lat: number | null, lon: number | null): number | null {
    if (lat == null || lon == null || this.userLat == null || this.userLon == null) return null;
    
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat - this.userLat);
    const dLon = this.deg2rad(lon - this.userLon); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(this.userLat)) * Math.cos(this.deg2rad(lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return Math.round(R * c);
  }

  deg2rad(deg: number) {
    return deg * (Math.PI/180);
  }
}
