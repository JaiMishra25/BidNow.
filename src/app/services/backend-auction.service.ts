import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface BackendAuction {
  _id: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  imageUrl?: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'ongoing' | 'ended' | 'cancelled';
  seller: string;
  startTime: Date;
  endTime: Date;
  bids: BackendBid[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BackendBid {
  _id: string;
  auctionId: string;
  bidder: string;
  amount: number;
  timestamp: Date;
  auction?: {
    _id: string;
    title: string;
    imageUrl?: string;
    status: string;
    endTime: Date;
  };
}

export interface CreateAuctionData {
  title: string;
  description: string;
  startingBid: number;
  minimumBid: number;
  category: string;
  startTime: Date;
  endTime: Date;
}

export interface PlaceBidData {
  auctionId: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackendAuctionService {
  private apiUrl = environment.apiUrl;
  private auctionsSubject = new BehaviorSubject<BackendAuction[]>([]);
  public auctions$ = this.auctionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all auctions
  getAllAuctions(status?: string, category?: string): Observable<{
    auctions: BackendAuction[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    let url = `${this.apiUrl}/auctions`;
    const params: string[] = [];
    
    if (status) params.push(`status=${status}`);
    if (category) params.push(`category=${category}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<{
      auctions: BackendAuction[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(url).pipe(
      tap(response => {
        // Update local state
        this.auctionsSubject.next(response.auctions);
      }),
      catchError(error => {
        console.error('Error fetching auctions:', error);
        return throwError(() => error);
      })
    );
  }

  // Get auction by ID
  getAuctionById(id: string): Observable<BackendAuction> {
    return this.http.get<BackendAuction>(`${this.apiUrl}/auctions/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching auction:', error);
        return throwError(() => error);
      })
    );
  }

  // Create new auction (sellers only)
  createAuction(auctionData: CreateAuctionData, image?: File): Observable<{
    message: string;
    auction: BackendAuction;
  }> {
    const formData = new FormData();
    
    if (image) {
      formData.append('image', image);
    }
    
    Object.keys(auctionData).forEach(key => {
      const value = auctionData[key as keyof CreateAuctionData];
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else {
        formData.append(key, String(value));
      }
    });

    return this.http.post<{
      message: string;
      auction: BackendAuction;
    }>(`${this.apiUrl}/auctions`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      tap(response => {
        // Add new auction to local state
        const currentAuctions = this.auctionsSubject.value;
        this.auctionsSubject.next([...currentAuctions, response.auction]);
      }),
      catchError(error => {
        console.error('Error creating auction:', error);
        return throwError(() => error);
      })
    );
  }

  // Update auction
  updateAuction(id: string, auctionData: Partial<CreateAuctionData>): Observable<{
    message: string;
    auction: BackendAuction;
  }> {
    return this.http.put<{
      message: string;
      auction: BackendAuction;
    }>(`${this.apiUrl}/auctions/${id}`, auctionData, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        // Update auction in local state
        const currentAuctions = this.auctionsSubject.value;
        const updatedAuctions = currentAuctions.map(auction => 
          auction._id === id ? response.auction : auction
        );
        this.auctionsSubject.next(updatedAuctions);
      }),
      catchError(error => {
        console.error('Error updating auction:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete auction
  deleteAuction(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/auctions/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Remove auction from local state
        const currentAuctions = this.auctionsSubject.value;
        const filteredAuctions = currentAuctions.filter(auction => auction._id !== id);
        this.auctionsSubject.next(filteredAuctions);
      }),
      catchError(error => {
        console.error('Error deleting auction:', error);
        return throwError(() => error);
      })
    );
  }

  // Place a bid
  placeBid(bidData: PlaceBidData): Observable<{
    message: string;
    bid: BackendBid;
    updatedAuction: BackendAuction;
  }> {
    return this.http.post<{
      message: string;
      bid: BackendBid;
      updatedAuction: BackendAuction;
    }>(`${this.apiUrl}/bids`, bidData, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        // Update auction in local state with new bid
        const currentAuctions = this.auctionsSubject.value;
        const updatedAuctions = currentAuctions.map(auction => 
          auction._id === bidData.auctionId ? response.updatedAuction : auction
        );
        this.auctionsSubject.next(updatedAuctions);
      }),
      catchError(error => {
        console.error('Error placing bid:', error);
        return throwError(() => error);
      })
    );
  }

  // Get bids for an auction
  getAuctionBids(auctionId: string): Observable<BackendBid[]> {
    return this.http.get<BackendBid[]>(`${this.apiUrl}/bids/auction/${auctionId}`).pipe(
      catchError(error => {
        console.error('Error fetching bids:', error);
        return throwError(() => error);
      })
    );
  }

  // Get user's auctions (for sellers)
  getUserAuctions(): Observable<BackendAuction[]> {
    return this.http.get<BackendAuction[]>(`${this.apiUrl}/auctions/my-auctions`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching user auctions:', error);
        return throwError(() => error);
      })
    );
  }

  // Get user's bids (for buyers)
  getUserBids(): Observable<BackendBid[]> {
    return this.http.get<BackendBid[]>(`${this.apiUrl}/bids/my-bids`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching user bids:', error);
        return throwError(() => error);
      })
    );
  }

  // Approve auction (admin only)
  approveAuction(auctionId: string): Observable<{ message: string; auction: BackendAuction }> {
    return this.http.patch<{ message: string; auction: BackendAuction }>(
      `${this.apiUrl}/auctions/${auctionId}/approve`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Update auction status in local state
        const currentAuctions = this.auctionsSubject.value;
        const updatedAuctions = currentAuctions.map(auction => 
          auction._id === auctionId ? response.auction : auction
        );
        this.auctionsSubject.next(updatedAuctions);
      }),
      catchError(error => {
        console.error('Error approving auction:', error);
        return throwError(() => error);
      })
    );
  }

  // Reject auction (admin only)
  rejectAuction(auctionId: string, reason: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/auctions/${auctionId}/reject`,
      { reason },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Remove rejected auction from local state
        const currentAuctions = this.auctionsSubject.value;
        const filteredAuctions = currentAuctions.filter(auction => auction._id !== auctionId);
        this.auctionsSubject.next(filteredAuctions);
      }),
      catchError(error => {
        console.error('Error rejecting auction:', error);
        return throwError(() => error);
      })
    );
  }
}
