import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ILoginResponse, IUser } from '@task-manager/data';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<Omit<IUser, 'createdAt' | 'updatedAt'> | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.currentUser());
  isOwner = computed(() => this.currentUser()?.role === 'owner');
  isAdmin = computed(() => this.currentUser()?.role === 'admin' || this.currentUser()?.role === 'owner');

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  // load user from local storage on init
  private loadFromStorage(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    // console.log('loading from storage, token exists:', !!token);
    if (token && userStr) {
      try {
        this.currentUser.set(JSON.parse(userStr));
      } catch {
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        // console.log('login success, saving token');
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    role?: string;
  }): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>('/api/auth/register', data).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.router.navigate(['/login']);
  }
}
