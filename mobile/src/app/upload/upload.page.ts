import { Component } from '@angular/core';
import { PostService } from '../services/post.service';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
  standalone: false
})
export class UploadPage {
  selectedImageUri: string | null = null;
  selectedImageBlob: Blob | null = null;
  
  privacyLevel: number = 2; // Default to Region (2)
  isPublic: boolean = true;
  includeInPassport: boolean = true;
  isUploading: boolean = false;
  isLocating: boolean = false;

  latitude: number | null = null;
  longitude: number | null = null;
  locationName: string | null = null;
  autoLocationInfo: { city: string, state: string, country: string } | null = null;
  isGeocoding: boolean = false;

  isSearchModalOpen: boolean = false;
  isSearchingPlaces: boolean = false;
  hasSearched: boolean = false;
  searchResults: any[] = [];

  constructor(
    private postService: PostService, 
    private router: Router,
    private toastCtrl: ToastController
  ) {
    const savedVisibility = localStorage.getItem('default_post_visibility');
    if (savedVisibility !== null) {
      this.isPublic = savedVisibility === 'true';
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt // Abre popup no web/celular perguntando: Câmera ou Galeria?
      });

      this.selectedImageUri = image.webPath || null;
      
      // Converte o arquivo selecionado em um Blob real para enviarmos ao Backend!
      if (image.webPath) {
        const response = await fetch(image.webPath);
        this.selectedImageBlob = await response.blob();
      }
    } catch (e) {
      console.log('Seleção cancelada pelo usuário ou erro.', e);
    }
  }

  async getLocation() {
    this.isLocating = true;
    try {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw new Error('Permissão de localização negada pelo usuário');
        }
      }

      // Captura a localização REAL do GPS do celular ou do navegador!
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
      
      this.fetchAutoLocationName();
    } catch (e) {
      console.error('Erro de GPS:', e);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao obter localização. Verifique o GPS do aparelho e as permissões!',
        duration: 4000,
        color: 'danger'
      });
      toast.present();
    } finally {
      this.isLocating = false;
    }
  }

  async fetchAutoLocationName() {
    if (!this.latitude || !this.longitude) return;
    this.isGeocoding = true;
    try {
      const response = await fetch(`${environment.apiUrl}/places/reverse?lat=${this.latitude}&lon=${this.longitude}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        this.autoLocationInfo = await response.json();
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isGeocoding = false;
    }
  }

  get displayLocation(): string {
    if (!this.autoLocationInfo) return 'Local Desconhecido';

    const parts = [];
    if (this.privacyLevel == 1 && this.autoLocationInfo.city) parts.push(this.autoLocationInfo.city);
    if ((this.privacyLevel == 1 || this.privacyLevel == 2) && this.autoLocationInfo.state) parts.push(this.autoLocationInfo.state);
    if (this.autoLocationInfo.country) parts.push(this.autoLocationInfo.country);

    return parts.join(', ') || 'Terras Longínquas';
  }

  async sharePost() {
    if (!this.selectedImageBlob) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, tire uma foto ou selecione uma imagem da galeria primeiro!',
        duration: 3000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    if (this.latitude === null || this.longitude === null) {
      const toast = await this.toastCtrl.create({
        message: 'Obtenha a sua localização atual usando o botão de GPS antes de postar!',
        duration: 3000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    this.isUploading = true;

    // Criando um envio real e 100% verdadeiro!
    const formData = new FormData();
    formData.append('PrivacyLevel', this.privacyLevel.toString());
    formData.append('IsPublic', this.isPublic.toString());
    formData.append('IncludedInPassport', this.includeInPassport.toString());
    formData.append('Latitude', this.latitude.toString());
    formData.append('Longitude', this.longitude.toString());
    if (this.locationName) {
      formData.append('LocationName', this.locationName);
    }
    formData.append('File', this.selectedImageBlob, 'meu_momento.jpg');

    localStorage.setItem('default_post_visibility', this.isPublic.toString());

    this.postService.uploadPost(formData).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.selectedImageUri = null;
        this.selectedImageBlob = null;
        this.latitude = null;
        this.longitude = null;
        this.router.navigate(['/']); // Volta pro Feed
      },
      error: async (err) => {
        this.isUploading = false;
        const toast = await this.toastCtrl.create({
          message: 'Erro ao enviar a postagem pro banco de dados.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
        console.error(err);
      }
    });
  }

  // --- Location Search Logic ---

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  openLocationSearch() {
    this.isSearchModalOpen = true;
    this.searchResults = [];
    this.hasSearched = false;
  }

  closeLocationSearch() {
    this.isSearchModalOpen = false;
  }

  clearLocationName() {
    this.locationName = null;
  }

  async searchPlaces(event: any) {
    const query = event.target.value?.trim();
    if (!query || query.length < 3) {
      this.searchResults = [];
      this.hasSearched = false;
      return;
    }

    if (!this.latitude || !this.longitude) return;

    this.isSearchingPlaces = true;
    this.hasSearched = true;

    try {
      const response = await fetch(`${environment.apiUrl}/places/search?q=${encodeURIComponent(query)}&lat=${this.latitude}&lon=${this.longitude}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }

      const data = await response.json();

      this.searchResults = data.map((item: any) => {
        const placeLat = parseFloat(item.lat);
        const placeLon = parseFloat(item.lon);
        const distance = this.getDistanceFromLatLonInKm(this.latitude!, this.longitude!, placeLat, placeLon);
        
        return {
          id: item.id,
          name: item.name,
          address: item.address,
          lat: placeLat,
          lon: placeLon,
          distanceKm: distance,
          tooFar: distance > 15 // 15km Radius Rule
        };
      }).sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    } catch (e) {
      console.error('Error fetching places', e);
    } finally {
      this.isSearchingPlaces = false;
    }
  }

  selectPlace(place: any) {
    if (place.tooFar) return;
    this.locationName = place.name;
    this.latitude = place.lat;
    this.longitude = place.lon;
    this.closeLocationSearch();
  }
}
