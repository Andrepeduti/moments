import { Component } from '@angular/core';
import { PostService } from '../services/post.service';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ToastController } from '@ionic/angular';

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
      // Captura a localização REAL do GPS do celular ou do navegador!
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: 'Erro ao obter localização. Verifique se você deu permissão no navegador!',
        duration: 4000,
        color: 'danger'
      });
      toast.present();
    } finally {
      this.isLocating = false;
    }
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
}
