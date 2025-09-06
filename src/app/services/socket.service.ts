import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type Socket = ReturnType<typeof io>;

export interface BidUpdate {
  auctionId: string;
  currentBid: number;
  bidder: string;
  timestamp: Date;
  bidId: string;
}

export interface AuctionUpdate {
  auctionId: string;
  status: string;
  currentBid: number;
  winner?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private bidUpdatesSubject = new BehaviorSubject<BidUpdate | null>(null);
  private auctionUpdatesSubject = new BehaviorSubject<AuctionUpdate | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public bidUpdates$ = this.bidUpdatesSubject.asObservable();
  public auctionUpdates$ = this.auctionUpdatesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    try {
      // Connect to the backend Socket.IO server
      this.socket = io(environment.apiUrl.replace('/api', ''), {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
        this.connectionStatusSubject.next(true);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('❌ Disconnected from Socket.IO server:', reason);
        this.connectionStatusSubject.next(false);
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('❌ Socket.IO connection error:', error);
        this.connectionStatusSubject.next(false);
      });

      // Listen for bid updates
      this.socket.on('bid-update', (data: BidUpdate) => {
        console.log('📈 Received bid update:', data);
        this.bidUpdatesSubject.next(data);
      });

      // Listen for auction updates (status changes, etc.)
      this.socket.on('auction-update', (data: AuctionUpdate) => {
        console.log('🔄 Received auction update:', data);
        this.auctionUpdatesSubject.next(data);
      });

    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  // Join an auction room to receive updates
  joinAuction(auctionId: string): void {
    if (this.socket && this.socket.connected) {
      console.log(`🔗 Joining auction room: ${auctionId}`);
      this.socket.emit('join-auction', auctionId);
    } else {
      console.warn('⚠️ Socket not connected, cannot join auction room');
    }
  }

  // Leave an auction room
  leaveAuction(auctionId: string): void {
    if (this.socket && this.socket.connected) {
      console.log(`🔌 Leaving auction room: ${auctionId}`);
      this.socket.emit('leave-auction', auctionId);
    }
  }

  // Emit a new bid (this will be handled by the backend)
  emitNewBid(auctionId: string, bidData: { currentBid: number; bidder: string }): void {
    if (this.socket && this.socket.connected) {
      console.log(`💰 Emitting new bid for auction ${auctionId}:`, bidData);
      this.socket.emit('new-bid', {
        auctionId,
        ...bidData
      });
    } else {
      console.warn('⚠️ Socket not connected, cannot emit bid');
    }
  }

  // Get current connection status
  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  // Reconnect if disconnected
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.initializeSocket();
  }

  // Clean up on service destruction
  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
