import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = `${environment.apiUrl}/friends`;

  // Stream reativo com a contagem de solicitações pendentes
  private pendingCountSubject = new BehaviorSubject<number>(0);
  pendingCount$ = this.pendingCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  requestFriendship(targetUserId: string) {
    return this.http.post(`${this.apiUrl}/request/${targetUserId}`, {});
  }

  acceptFriendship(requesterId: string) {
    return this.http.post(`${this.apiUrl}/accept/${requesterId}`, {}).pipe(
      tap(() => {
        // Decrementa imediatamente ao aceitar
        const current = this.pendingCountSubject.getValue();
        this.pendingCountSubject.next(Math.max(0, current - 1));
      })
    );
  }

  getFriends() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getPendingRequests() {
    return this.http.get<any[]>(`${this.apiUrl}/pending`).pipe(
      tap((requests) => {
        // Atualiza o contador sempre que buscar as solicitações
        this.pendingCountSubject.next(requests.length);
      })
    );
  }

  checkFriendshipStatus(targetUserId: string) {
    return this.http.get<{status: string}>(`${this.apiUrl}/status/${targetUserId}?t=${new Date().getTime()}`);
  }

  getFriendCount(userId: string) {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count/${userId}`);
  }
}
