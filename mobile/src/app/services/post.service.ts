import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'http://localhost:5106/api/posts';

  constructor(private http: HttpClient) {}

  uploadPost(formData: FormData) {
    return this.http.post<any>(this.apiUrl, formData);
  }

  getDiscoverFeed(lat?: number, lon?: number) {
    let url = `${this.apiUrl}/discover`;
    if (lat && lon) {
      url += `?lat=${lat}&lon=${lon}`;
    }
    return this.http.get<any[]>(url);
  }

  getFriendsFeed() {
    return this.http.get<any[]>(`${this.apiUrl}/friends`);
  }

  reportPost(postId: string) {
    return this.http.post(`${this.apiUrl}/${postId}/report`, {});
  }
}
