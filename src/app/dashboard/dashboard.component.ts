import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendAuctionService, BackendAuction, CreateAuctionData } from '../services/backend-auction.service';
import { AuthService } from '../services/auth.service';
import { SocketService, BidUpdate, AuctionUpdate } from '../services/socket.service';
import { Subscription } from 'rxjs';

interface Auction {
  id: string;
  title: string;
  imageUrl?: string;
  info: string;
  timeLeft: string;
  startTime?: Date;
  endTime?: Date;
  currentBid?: number;
  minimumBid?: number;
  seller?: string;
  status: 'ongoing' | 'pending' | 'approved' | 'ended' | 'past';
  duration?: number; // Duration in hours
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, FormsModule, MatSnackBarModule],
})
export class DashboardComponent implements OnInit, OnDestroy {
  upcomingAuctions: Auction[] = [];
  currentAuctions: Auction[] = [];
  finishedAuctions: Auction[] = [];
  filteredUpcomingAuctions: Auction[] = [];
  filteredCurrentAuctions: Auction[] = [];
  filteredFinishedAuctions: Auction[] = [];
  searchQuery: string = '';
  timerInterval: any;

  // For adding and managing auctions
  newAuction: Auction = {
    id: '',
    title: '',
    info: '',
    currentBid: 0,
    minimumBid: 0,
    imageUrl: '',
    timeLeft: '',
    status: 'pending' as 'ongoing' | 'pending' | 'approved' | 'ended' | 'past',
    startTime: new Date(),
    duration: 24 // Default 24 hours
  };
  showAddAuctionForm: boolean = false;
  selectedImage: File | null = null;
  startTimeString: string = '';
  currentUser: any = null;
  public isConnected = false;

  private bidUpdateSubscription?: Subscription;
  private auctionUpdateSubscription?: Subscription;
  private connectionStatusSubscription?: Subscription;

  constructor(
    public router: Router,
    private snackBar: MatSnackBar,
    private auctionService: BackendAuctionService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get current user
    this.currentUser = this.authService.getCurrentUser();

    // Load auctions from backend
    this.loadBackendAuctions();
    
    // Initialize start time string for form
    this.initializeStartTime();

    this.timerInterval = setInterval(() => this.updateTimers(), 1000);

    // Initialize Socket.IO subscriptions
    this.initializeSocketSubscriptions();
  }

  loadBackendAuctions(): void {
    // Get all auctions from backend
    this.auctionService.getAllAuctions().subscribe({
      next: (response: { auctions: BackendAuction[]; totalPages: number; currentPage: number; total: number }) => {
        // Convert backend auctions to local auction format
        const allAuctions = response.auctions.map((auction: BackendAuction) => ({
          id: auction._id,
          title: auction.title,
          info: auction.description,
          imageUrl: auction.imageUrl ? `http://localhost:3000${auction.imageUrl}` : undefined,
          timeLeft: this.calculateTimeLeft(new Date(auction.endTime)),
          startTime: new Date(auction.startTime),
          endTime: new Date(auction.endTime),
          currentBid: auction.currentBid,
          minimumBid: auction.startingBid,
          seller: auction.seller,
          status: (auction.status === 'ongoing' ? 'ongoing' : auction.status === 'pending' ? 'pending' : auction.status === 'approved' ? 'approved' : auction.status === 'ended' ? 'ended' : 'past') as 'ongoing' | 'pending' | 'approved' | 'ended' | 'past'
        }));

        // Filter auctions based on status
        this.upcomingAuctions = allAuctions.filter(a => a.status === 'pending' || a.status === 'approved');
        this.currentAuctions = allAuctions.filter(a => a.status === 'ongoing');
        this.finishedAuctions = allAuctions.filter(a => a.status === 'ended' || a.status === 'past');
        
        // Initialize filtered arrays
        this.filteredUpcomingAuctions = [...this.upcomingAuctions];
        this.filteredCurrentAuctions = [...this.currentAuctions];
        this.filteredFinishedAuctions = [...this.finishedAuctions];
      },
      error: (error: any) => {
        console.error('Error loading auctions:', error);
        this.snackBar.open('Failed to load auctions', 'Close', { duration: 3000 });
      }
    });
  }

  calculateTimeLeft(endTime: Date): string {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  }

  toggleAddAuctionForm(): void {
    this.showAddAuctionForm = !this.showAddAuctionForm;
    if (this.showAddAuctionForm) {
      this.initializeStartTime();
    }
  }

  initializeStartTime(): void {
    // Set default start time to 1 hour from now
    const defaultStartTime = new Date(Date.now() + 60 * 60 * 1000);
    this.startTimeString = defaultStartTime.toISOString().slice(0, 16);
    this.newAuction.startTime = defaultStartTime;
  }

  addAuction(): void {
    // Enhanced validation
    if (!this.newAuction.title?.trim()) {
      this.snackBar.open('Please enter an auction title.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.newAuction.info?.trim()) {
      this.snackBar.open('Please enter an auction description.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.newAuction.minimumBid || this.newAuction.minimumBid <= 0) {
      this.snackBar.open('Please enter a valid starting bid amount.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.startTimeString) {
      this.snackBar.open('Please select a start time.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.newAuction.duration || this.newAuction.duration <= 0) {
      this.snackBar.open('Please select a valid auction duration.', 'Close', { duration: 3000 });
      return;
    }

    // Convert start time string to Date object
    const startTime = new Date(this.startTimeString);
    const endTime = new Date(startTime.getTime() + (this.newAuction.duration! * 60 * 60 * 1000));

    // Validate start time is in the future
    if (startTime <= new Date()) {
      this.snackBar.open('Start time must be in the future.', 'Close', { duration: 3000 });
      return;
    }

    // Validate end time is after start time
    if (endTime <= startTime) {
      this.snackBar.open('End time must be after start time.', 'Close', { duration: 3000 });
      return;
    }

    // Create auction data for backend
    const auctionData: CreateAuctionData = {
      title: this.newAuction.title.trim(),
      description: this.newAuction.info.trim(),
      startingBid: this.newAuction.minimumBid,
      minimumBid: this.newAuction.minimumBid, // Same as startingBid for now
      category: 'general', // Default category
      startTime: startTime,
      endTime: endTime
    };

    console.log('Creating auction with data:', auctionData);
    console.log('Selected image:', this.selectedImage);

    // Create auction using backend service
    this.auctionService.createAuction(auctionData, this.selectedImage || undefined).subscribe({
      next: (response) => {
        console.log('Auction created successfully:', response);
        this.snackBar.open('Auction created successfully! It will be reviewed by admin before going live.', 'Close', { duration: 5000 });
        
        // Reset form and close modal
        this.resetNewAuctionForm();
        this.toggleAddAuctionForm();
        
        // Reload auctions to update the list
        this.loadBackendAuctions();
      },
      error: (error: any) => {
        console.error('Error creating auction:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to create auction. Please try again.';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  resetNewAuctionForm(): void {
    this.newAuction = {
      id: '',
      title: '',
      info: '',
      currentBid: 0,
      minimumBid: 0,
      imageUrl: '',
      timeLeft: '',
      status: 'pending' as 'ongoing' | 'pending' | 'approved' | 'ended' | 'past',
      startTime: new Date(),
      duration: 24
    };
    this.selectedImage = null;
    this.initializeStartTime();
  }

  deleteAuction(auction: Auction): void {
    this.auctionService.deleteAuction(auction.id).subscribe({
      next: () => {
        this.snackBar.open('Auction deleted successfully.', 'Close', { duration: 3000 });
        this.loadBackendAuctions(); // Reload auctions to update the list
      },
      error: (error: any) => {
        console.error('Error deleting auction:', error);
        this.snackBar.open('Failed to delete auction', 'Close', { duration: 3000 });
      }
    });
  }

  updateTimers(): void {
    const now = new Date();
    const formatTime = (ms: number): string => {
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const updateTime = (auction: Auction, key: 'startTime' | 'endTime') => {
      if (!auction[key]) return;
      const diff = auction[key]!.getTime() - now.getTime();
      auction.timeLeft = diff > 0 ? formatTime(diff) : 'Expired';
    };

    this.upcomingAuctions.forEach((auction) => updateTime(auction, 'startTime'));
    this.currentAuctions.forEach((auction) => updateTime(auction, 'endTime'));
    this.finishedAuctions.forEach((auction) => updateTime(auction, 'endTime'));
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.toLowerCase();
    this.filteredUpcomingAuctions = this.upcomingAuctions.filter((a) =>
      a.title.toLowerCase().includes(query)
    );
    this.filteredCurrentAuctions = this.currentAuctions.filter((a) =>
      a.title.toLowerCase().includes(query)
    );
    this.filteredFinishedAuctions = this.finishedAuctions.filter((a) =>
      a.title.toLowerCase().includes(query)
    );
  }

  onImageUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.selectedImage = file;
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.newAuction.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onPlaceBid(auction: Auction): void {
    const currentBid = auction.currentBid || auction.minimumBid || 0;
    const minBid = auction.minimumBid || (currentBid + 1);
    
    // Create a simple modal for bid input
    const bidAmount = prompt(`Enter your bid for ${auction.title}\n\nCurrent bid: $${currentBid}\nMinimum bid: $${minBid}\n\nYour bid must be higher than $${currentBid}`);
    
    if (bidAmount) {
      const bid = parseFloat(bidAmount);
      
      if (isNaN(bid) || bid <= currentBid) {
        this.snackBar.open('Invalid bid amount. It must be higher than the current bid.', 'Close', { duration: 3000 });
        return;
      }

      if (bid < minBid) {
        this.snackBar.open(`Bid must be at least $${minBid}`, 'Close', { duration: 3000 });
        return;
      }

      // Use backend service to place bid
      this.auctionService.placeBid({
        auctionId: auction.id,
        amount: bid
      }).subscribe({
        next: (response) => {
          this.snackBar.open(`Bid of $${bid} placed successfully on ${auction.title}`, 'Close', { duration: 3000 });
          this.loadBackendAuctions(); // Reload auctions to update bid info
        },
        error: (error: any) => {
          console.error('Error placing bid:', error);
          this.snackBar.open(error.error?.message || 'Failed to place bid', 'Close', { duration: 5000 });
        }
      });
    }
  }

  viewAuctionDetail(auction: Auction): void {
    this.router.navigate(['./auction-detail', auction.id], {
      state: { auction, auctions: this.currentAuctions },
    });
  }

  onBid(auction: Auction): void {
    this.onPlaceBid(auction);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  initializeSocketSubscriptions(): void {
    // Subscribe to connection status
    this.connectionStatusSubscription = this.socketService.connectionStatus$.subscribe(
      (connected) => {
        this.isConnected = connected;
      }
    );

    // Subscribe to bid updates
    this.bidUpdateSubscription = this.socketService.bidUpdates$.subscribe(
      (bidUpdate) => {
        if (bidUpdate) {
          this.handleBidUpdate(bidUpdate);
        }
      }
    );

    // Subscribe to auction updates
    this.auctionUpdateSubscription = this.socketService.auctionUpdates$.subscribe(
      (auctionUpdate) => {
        if (auctionUpdate) {
          this.handleAuctionUpdate(auctionUpdate);
        }
      }
    );
  }

  handleBidUpdate(bidUpdate: BidUpdate): void {
    console.log('🔄 Dashboard received bid update:', bidUpdate);
    
    // Update current bid in all auction lists
    this.updateAuctionBid(bidUpdate.auctionId, bidUpdate.currentBid);
    
    // Show notification
    this.snackBar.open(
      `New bid: $${bidUpdate.currentBid} on auction`, 
      'Close', 
      { duration: 3000 }
    );
  }

  handleAuctionUpdate(auctionUpdate: AuctionUpdate): void {
    console.log('🔄 Dashboard received auction update:', auctionUpdate);
    
    // Update auction status
    this.updateAuctionStatus(auctionUpdate.auctionId, auctionUpdate.status, auctionUpdate.currentBid);
    
    // Show notification
    this.snackBar.open(
      `Auction status updated: ${auctionUpdate.status}`, 
      'Close', 
      { duration: 3000 }
    );
  }

  updateAuctionBid(auctionId: string, newBid: number): void {
    // Update in upcoming auctions
    this.upcomingAuctions.forEach(auction => {
      if (auction.id === auctionId) {
        auction.currentBid = newBid;
      }
    });
    this.filteredUpcomingAuctions.forEach(auction => {
      if (auction.id === auctionId) {
        auction.currentBid = newBid;
      }
    });

    // Update in current auctions
    this.currentAuctions.forEach(auction => {
      if (auction.id === auctionId) {
        auction.currentBid = newBid;
      }
    });
    this.filteredCurrentAuctions.forEach(auction => {
      if (auction.id === auctionId) {
        auction.currentBid = newBid;
      }
    });

    // Update in finished auctions
    this.finishedAuctions.forEach(auction => {
      if (auction.id === auctionId) {
        auction.currentBid = newBid;
      }
    });
    this.filteredFinishedAuctions.forEach(auction => {
      if (auction.id === auctionId) {
        auction.currentBid = newBid;
      }
    });
  }

  updateAuctionStatus(auctionId: string, newStatus: string, newBid?: number): void {
    // Find auction in all lists and update status
    const updateAuctionInList = (list: Auction[]) => {
      list.forEach(auction => {
        if (auction.id === auctionId) {
          auction.status = newStatus as any;
          if (newBid !== undefined) {
            auction.currentBid = newBid;
          }
        }
      });
    };

    updateAuctionInList(this.upcomingAuctions);
    updateAuctionInList(this.currentAuctions);
    updateAuctionInList(this.finishedAuctions);
    updateAuctionInList(this.filteredUpcomingAuctions);
    updateAuctionInList(this.filteredCurrentAuctions);
    updateAuctionInList(this.filteredFinishedAuctions);

    // Re-categorize auctions based on new status
    this.categorizeAuctions();
  }

  categorizeAuctions(): void {
    // This method should be implemented to re-categorize auctions based on status
    // For now, we'll just reload the auctions
    this.loadBackendAuctions();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Clean up Socket.IO subscriptions
    if (this.bidUpdateSubscription) {
      this.bidUpdateSubscription.unsubscribe();
    }
    if (this.auctionUpdateSubscription) {
      this.auctionUpdateSubscription.unsubscribe();
    }
    if (this.connectionStatusSubscription) {
      this.connectionStatusSubscription.unsubscribe();
    }
  }
}