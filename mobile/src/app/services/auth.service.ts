import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.tokenSubject.next(res.token);
      })
    );
  }

  register(formData: FormData) {
    return this.http.post<any>(`${this.apiUrl}/register`, formData).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.tokenSubject.next(res.token);
      })
    );
  }

  socialLogin(data: any) {
    return this.http.post<any>(`${this.apiUrl}/social-login`, data).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.tokenSubject.next(res.token);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }
}
