import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AdminStats {
  totalUsers: number;
  totalAuctions: number;
  pendingAuctions: number;
  activeAuctions: number;
  totalBids: number;
  openDisputes: number;
  resolvedDisputes: number;
  totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  getPendingAuctions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auctions/pending`, { headers: this.getHeaders() });
  }

  approveAuction(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auctions/${id}/approve`, {}, { headers: this.getHeaders() });
  }

  rejectAuction(id: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auctions/${id}/reject`, { reason }, { headers: this.getHeaders() });
  }

  deleteAuction(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/auctions/${id}`, { headers: this.getHeaders() });
  }

  endAuction(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auctions/${id}/end`, {}, { headers: this.getHeaders() });
  }

  getUsers(params?: { role?: string; blocked?: boolean; page?: number; limit?: number }): Observable<any> {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.blocked !== undefined) query.append('blocked', String(params.blocked));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    const url = qs ? `${this.apiUrl}/users?${qs}` : `${this.apiUrl}/users`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  blockUser(id: string, isBlocked: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/block`, { isBlocked }, { headers: this.getHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() });
  }
}


