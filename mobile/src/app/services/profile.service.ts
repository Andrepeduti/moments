import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:5106/api/users';

  private profileObj: any = {
    name: '...',
    bio: '...',
    nationality: '...',
    profilePictureUrl: 'https://i.pravatar.cc/150?img=11'
  };

  private profileSubject = new BehaviorSubject<any>(this.profileObj);
  public profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.token$.subscribe(token => {
      if (token) {
        this.fetchProfile();
      } else {
        this.profileObj = {
          name: '...',
          bio: '...',
          nationality: '...',
          profilePictureUrl: 'https://i.pravatar.cc/150?img=11'
        };
        this.profileSubject.next(this.profileObj);
      }
    });
  }

  fetchProfile() {
    this.http.get(`${this.apiUrl}/me`).subscribe({
      next: (res: any) => {
        this.profileObj = { ...this.profileObj, ...res };
        this.profileSubject.next(this.profileObj);
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  getProfile() {
    return { ...this.profileObj };
  }

  getUserProfile(userId: string) {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }

  updateProfile(data: any) {
    // Atualiza otimisticamente a UI
    this.profileObj = { ...this.profileObj, ...data };
    this.profileSubject.next(this.profileObj);
    
    // Salva no backend
    this.http.put(`${this.apiUrl}/me`, data).subscribe({
      next: (res: any) => {
        this.profileObj = { ...this.profileObj, ...res };
        this.profileSubject.next(this.profileObj);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        // Em caso de erro, reverte as mudanças buscando do servidor novamente
        this.fetchProfile();
      }
    });
  }

  uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/me/photo`, formData);
  }
}
