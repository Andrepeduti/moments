import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PassportService {
  private apiUrl = `${environment.apiUrl}/passport`;

  constructor(private http: HttpClient) {}

  getMyPassport() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getUserPassport(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }

  getBadgeDetails(badgeId: string) {
    return this.http.get<any>(`${this.apiUrl}/badge/${badgeId}`);
  }

  getBadgePhotos(badgeId: string, userId?: string) {
    const url = userId ? `${this.apiUrl}/badge/${badgeId}/photos/${userId}` : `${this.apiUrl}/badge/${badgeId}/photos`;
    return this.http.get<any[]>(url);
  }
}
