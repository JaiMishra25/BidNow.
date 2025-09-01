import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BackendAuctionService } from '../services/backend-auction.service';
import { AuthService } from '../services/auth.service';

interface Bid {
  _id: string;
  amount: number;
  bidder: string | { name: string; email: string };
  timestamp: Date;
  auctionId: string;
}

@Component({
  standalone: true,
  selector: 'app-auction-detail',
  templateUrl: './auction-detail.component.html',
  styleUrls: ['./auction-detail.component.css'],
  imports: [CommonModule, FormsModule],  // Add CommonModule and FormsModule here
})
export class AuctionDetailComponent implements OnInit, OnDestroy {
  public auction: any = {};
  public allAuctions: any[] = [];
  public bidHistory: Bid[] = [];
  public timerInterval: any;
  public currentBidAmount: number = 0;
  public userBidAmount: number | null = null;
  public timer: string = '';
  public isLoading = false;
  public currentUser: any = null;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private auctionService: BackendAuctionService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    // Get auction ID from route parameters
    const auctionId = this.route.snapshot.paramMap.get('id');
    if (auctionId) {
      this.loadAuctionDetails(auctionId);
    } else {
      // Fallback to router state if no route param
      const state = history.state || {};
      this.auction = state['auction'] || {};
      this.allAuctions = state['auctions'] || [];
      this.currentBidAmount = this.auction.currentBid || this.auction.startingBid || 0;
      this.startTimer();
      this.loadBidHistory();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  loadAuctionDetails(auctionId: string): void {
    this.auctionService.getAuctionById(auctionId).subscribe({
      next: (auction) => {
        this.auction = auction;
        this.currentBidAmount = auction.currentBid || auction.startingBid || 0;
        this.startTimer();
        this.loadBidHistory();
      },
      error: (error) => {
        console.error('Error loading auction details:', error);
        this.snackBar.open('Failed to load auction details', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      }
    });
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(this.auction.endTime).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(this.timerInterval);
        this.timer = 'Auction Ended';
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        this.timer = `${hours}h ${minutes}m ${seconds}s`;
      }
    }, 1000);
  }

  loadBidHistory(): void {
    const auctionId = this.auction._id || this.auction.id;
    if (auctionId) {
      this.auctionService.getAuctionBids(auctionId).subscribe({
        next: (bids) => {
          this.bidHistory = bids;
        },
        error: (error) => {
          console.error('Error loading bid history:', error);
        }
      });
    }
  }

  placeBid(): void {
    if (!this.currentUser) {
      this.snackBar.open('Please login to place a bid', 'Close', { duration: 3000 });
      return;
    }

    if (!this.userBidAmount || this.userBidAmount <= this.currentBidAmount) {
      this.snackBar.open('Bid must be higher than the current bid!', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    
    const auctionId = this.auction._id || this.auction.id;
    this.auctionService.placeBid({
      auctionId: auctionId,
      amount: this.userBidAmount
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.currentBidAmount = this.userBidAmount!;
        this.userBidAmount = null;
        
        // Add new bid to history
        this.bidHistory.unshift({
          _id: response.bid._id || 'temp-id',
          amount: response.bid.amount,
          bidder: this.currentUser.name,
          timestamp: new Date(),
          auctionId: auctionId
        });
        
        this.snackBar.open(`Bid of $${response.bid.amount} placed successfully!`, 'Close', { duration: 3000 });
        
        // Reload bid history to get updated data
        this.loadBidHistory();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error placing bid:', error);
        this.snackBar.open(error.error?.message || 'Failed to place bid', 'Close', { duration: 5000 });
      }
    });
  }

  viewNextAuction(): void {
    const currentIndex = this.allAuctions.findIndex((a) => a.id === this.auction.id);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % this.allAuctions.length;
      this.auction = this.allAuctions[nextIndex];
      this.currentBidAmount = this.auction.currentBid || 0;
      this.bidHistory = []; // Reset bid history when switching auctions
    }
  }

  viewPreviousAuction(): void {
    const currentIndex = this.allAuctions.findIndex((a) => a.id === this.auction.id);
    if (currentIndex !== -1) {
      const previousIndex = (currentIndex - 1 + this.allAuctions.length) % this.allAuctions.length;
      this.auction = this.allAuctions[previousIndex];
      this.currentBidAmount = this.auction.currentBid || 0;
      this.bidHistory = []; // Reset bid history when switching auctions
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard'], { 
      state: { 
        auctions: this.allAuctions 
      } 
    });
  }

  getBidderName(bidder: string | { name: string; email: string }): string {
    if (typeof bidder === 'string') {
      return bidder;
    }
    return bidder?.name || 'Unknown';
  }

  getWinnerName(winner: string | { name: string; email: string }): string {
    if (typeof winner === 'string') {
      return winner;
    }
    return winner?.name || 'Unknown';
  }
}
