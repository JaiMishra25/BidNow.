import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { BackendAuctionService } from '../services/backend-auction.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Auction {
  _id: string;
  title: string;
  status: string;
  currentBid?: number;
  startingBid: number;
  endTime: Date;
  createdAt: Date;
  seller: string;
  winner?: string;
}

interface User {
  _id: string;
  name: string;
  address?: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  isBlocked?: boolean;
  createdAt: Date;
  numberOfBids?: number;
  accountStatus?: string;
  lastLogin?: string;
  stats?: {
    auctionsCreated: number;
    auctionsWon: number;
    totalBids: number;
    activeBids: number;
    recentBids: number;
    totalAmountBid: number;
    averageBidAmount: number;
  };
}

interface UserStats {
  totalBids: number;
  totalAuctions: number;
  wonAuctions: number;
  activeBids: number;
  auctionsCreated: number;
  recentBids: number;
  totalAmountBid: number;
  averageBidAmount: number;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
  imports: [CommonModule, FormsModule],  // Add FormsModule here
})
export class UserDetailComponent implements OnInit {
  userId!: string;
  userDetails!: User;
  userStats!: UserStats;
  userAuctions: Auction[] = [];
  userBids: any[] = [];
  auctionSearchQuery = '';
  auctionStatusFilter = 'all';
  filteredAuctions: Auction[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private adminService: AdminService,
    private auctionService: BackendAuctionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.userStats = {
      totalBids: 0,
      totalAuctions: 0,
      wonAuctions: 0,
      activeBids: 0,
      auctionsCreated: 0,
      recentBids: 0,
      totalAmountBid: 0,
      averageBidAmount: 0
    };
    this.fetchUserDetails();
    this.fetchUserAuctions();
    this.fetchUserBids();
  }

  fetchUserDetails(): void {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (response) => {
        const user = response.users.find((u: User) => u._id === this.userId);
        if (user) {
          this.userDetails = user;
          // Update userStats from the enhanced user data
          if (user.stats) {
            this.userStats = {
              totalBids: user.stats.totalBids,
              totalAuctions: user.stats.auctionsCreated,
              wonAuctions: user.stats.auctionsWon,
              activeBids: user.stats.activeBids,
              auctionsCreated: user.stats.auctionsCreated,
              recentBids: user.stats.recentBids,
              totalAmountBid: user.stats.totalAmountBid,
              averageBidAmount: user.stats.averageBidAmount
            };
          }
        } else {
          this.snackBar.open('User not found', 'Close', { duration: 3000 });
          this.router.navigate(['/admin-dashboard']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
        this.snackBar.open('Failed to fetch user details', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  fetchUserAuctions(): void {
    this.auctionService.getAllAuctions().subscribe({
      next: (response) => {
        this.userAuctions = response.auctions.filter((auction: Auction) => 
          auction.seller && auction.seller.toString() === this.userId
        );
        this.filterAuctions();
        this.calculateUserStats();
      },
      error: (error) => {
        console.error('Error fetching user auctions:', error);
        this.userAuctions = [];
        this.calculateUserStats();
      }
    });
  }

  fetchUserBids(): void {
    this.auctionService.getUserBids().subscribe({
      next: (response) => {
        this.userBids = response || [];
        this.calculateUserStats();
      },
      error: (error) => {
        console.error('Error fetching user bids:', error);
        this.userBids = [];
        this.calculateUserStats();
      }
    });
  }

  calculateUserStats(): void {
    const totalAmountBid = this.userBids.reduce((sum, bid) => sum + (bid.amount || 0), 0);
    const averageBidAmount = this.userBids.length > 0 ? totalAmountBid / this.userBids.length : 0;
    
    // Calculate recent bids (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBids = this.userBids.filter(bid => new Date(bid.timestamp) >= thirtyDaysAgo).length;

    this.userStats = {
      totalBids: this.userBids.length,
      totalAuctions: this.userAuctions.length,
      wonAuctions: this.userAuctions.filter(a => a.status === 'ended' && a.winner && a.winner.toString() === this.userId).length,
      activeBids: this.userBids.filter(b => b.auction && b.auction.status === 'ongoing').length,
      auctionsCreated: this.userAuctions.length,
      recentBids: recentBids,
      totalAmountBid: totalAmountBid,
      averageBidAmount: averageBidAmount
    };
  }

  // Add the method to navigate to the admin dashboard
  goToAdminDashboard(): void {
    this.router.navigate(['/admin-dashboard']);  // Navigate to the admin dashboard route
  }

  sendMessage(): void {
    alert(`Message sent to ${this.userDetails.email}`);
  }

  blockUser(): void {
    if (confirm(`Are you sure you want to block ${this.userDetails.name}?`)) {
      this.adminService.blockUser(this.userDetails._id, true).subscribe({
        next: (response) => {
          this.userDetails.isBlocked = true;
          this.snackBar.open(`${this.userDetails.name} has been blocked`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error blocking user:', error);
          this.snackBar.open('Failed to block user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  unblockUser(): void {
    if (confirm(`Are you sure you want to unblock ${this.userDetails.name}?`)) {
      this.adminService.blockUser(this.userDetails._id, false).subscribe({
        next: (response) => {
          this.userDetails.isBlocked = false;
          this.snackBar.open(`${this.userDetails.name} has been unblocked`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error unblocking user:', error);
          this.snackBar.open('Failed to unblock user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  filterAuctions(): void {
    if (this.auctionStatusFilter === 'all') {
      this.filteredAuctions = this.userAuctions;
    } else {
      this.filteredAuctions = this.userAuctions.filter(
        (auction) => auction.status === this.auctionStatusFilter
      );
    }

    if (this.auctionSearchQuery) {
      this.filteredAuctions = this.filteredAuctions.filter((auction) =>
        auction.title.toLowerCase().includes(this.auctionSearchQuery.toLowerCase())
      );
    }
  }

  sortAuctions(property: keyof Auction): void {
    this.filteredAuctions.sort((a, b) => {
      if (typeof a[property] === 'string' && typeof b[property] === 'string') {
        return a[property].toString().localeCompare(b[property].toString());
      }
      return 0;
    });
  }

  viewAuctionDetails(auctionId: string): void {
    this.router.navigate(['/auction-detail', auctionId]);
  }
}
