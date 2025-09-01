import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AdminService, AdminStats } from '../services/admin.service';
import { BackendAuctionService } from '../services/backend-auction.service';
import { AuthService } from '../services/auth.service';


interface Auction {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startingBid: number;
  currentBid?: number;
  minimumBid?: number;
  status: 'pending' | 'approved' | 'rejected' | 'ongoing' | 'ended' | 'cancelled';
  seller: any;
  startTime: Date;
  endTime: Date;
  category: string;
  createdAt: Date;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  isBlocked?: boolean;
  createdAt: Date;
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

interface Dispute {
  id: string;
  auctionTitle: string;
  reason: string;
  status: 'open' | 'resolved';
}

// Use AdminStats from AdminService

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [CommonModule, FormsModule,],
})
export class AdminDashboardComponent implements OnInit {
  allAuctions: Auction[] = [];
  pendingAuctions: Auction[] = [];
  approvedAuctions: Auction[] = [];
  ongoingAuctions: Auction[] = [];
  endedAuctions: Auction[] = [];
  rejectedAuctions: Auction[] = [];
  filteredCurrentAuctions: Auction[] = [];
  
  disputes: Dispute[] = []; // Keep mock disputes for now
  filteredDisputes: Dispute[] = [];
  
  users: User[] = [];
  filteredUsers: User[] = [];
  displayedUsers: User[] = [];
  usersPerPage: number = 5;
  hasMoreUsers: boolean = false;
  
  stats: AdminStats = {
    totalUsers: 0,
    totalAuctions: 0,
    pendingAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    totalRevenue: 0
  };

  showAddAuctionForm: boolean = false;
  selectedFilter: 'pending' | 'approved' | 'ongoing' | 'ended' | 'rejected' = 'pending';
  selectedDisputeStatus: 'all' | 'open' | 'resolved' = 'all';
  searchQuery: string = '';
  disputeSearchQuery: string = '';
  userSearchQuery: string = '';
  selectedUserRole: 'all' | 'buyer' | 'seller' = 'all';

  // Inject services
  private adminService = inject(AdminService);
  private auctionService = inject(BackendAuctionService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadStats();
    this.loadAllAuctions();
    this.loadUsers();
    this.loadDisputes(); // Keep mock disputes for now
    this.filterDisputes();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.snackBar.open('Failed to load statistics', 'Close', { duration: 3000 });
      }
    });
  }

  loadAllAuctions(): void {
    // Load all auctions and categorize them
    this.auctionService.getAllAuctions().subscribe({
      next: (response) => {
        this.allAuctions = response.auctions;
        this.categorizeAuctions();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading auctions:', error);
        this.snackBar.open('Failed to load auctions', 'Close', { duration: 3000 });
      }
    });
  }

  categorizeAuctions(): void {
    this.pendingAuctions = this.allAuctions.filter(a => a.status === 'pending');
    this.approvedAuctions = this.allAuctions.filter(a => a.status === 'approved');
    this.ongoingAuctions = this.allAuctions.filter(a => a.status === 'ongoing');
    this.endedAuctions = this.allAuctions.filter(a => a.status === 'ended');
    this.rejectedAuctions = this.allAuctions.filter(a => a.status === 'rejected');
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users || [];
        this.filteredUsers = [...this.users];
        this.updateDisplayedUsers();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  updateDisplayedUsers(): void {
    this.displayedUsers = this.filteredUsers.slice(0, this.usersPerPage);
    this.hasMoreUsers = this.filteredUsers.length > this.usersPerPage;
  }

  loadMoreUsers(): void {
    const currentLength = this.displayedUsers.length;
    const nextBatch = this.filteredUsers.slice(currentLength, currentLength + this.usersPerPage);
    this.displayedUsers = [...this.displayedUsers, ...nextBatch];
    this.hasMoreUsers = this.displayedUsers.length < this.filteredUsers.length;
  }

  viewAuctionDetail(auction: Auction): void {
    this.router.navigate(['/auction-detail', auction._id]);
  }

  // Search Auctions
  searchAuctions(): void {
    this.applyFilters();
  }

  // Apply Filters
  applyFilters(): void {
    let auctions: Auction[] = [];
    
    switch (this.selectedFilter) {
      case 'pending':
        auctions = this.pendingAuctions;
        break;
      case 'approved':
        auctions = this.approvedAuctions;
        break;
      case 'ongoing':
        auctions = this.ongoingAuctions;
        break;
      case 'ended':
        auctions = this.endedAuctions;
        break;
      case 'rejected':
        auctions = this.rejectedAuctions;
        break;
      default:
        auctions = this.allAuctions;
    }

    // Apply search filter
    if (this.searchQuery) {
      auctions = auctions.filter(auction =>
        auction.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredCurrentAuctions = auctions;
  }

  approveAuction(auction: Auction): void {
    this.adminService.approveAuction(auction._id).subscribe({
      next: (response) => {
        this.snackBar.open(`Auction "${auction.title}" approved successfully!`, 'Close', { 
          duration: 3000, 
          verticalPosition: 'top', 
          horizontalPosition: 'center' 
        });
        this.loadAllAuctions(); // Reload to get updated status
        this.loadStats(); // Update stats
      },
      error: (error) => {
        console.error('Error approving auction:', error);
        this.snackBar.open('Failed to approve auction', 'Close', { duration: 3000 });
      }
    });
  }
  
  rejectAuction(auction: Auction): void {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;

    this.adminService.rejectAuction(auction._id, reason).subscribe({
      next: (response) => {
        this.snackBar.open(`Auction "${auction.title}" rejected.`, 'Close', { 
          duration: 3000, 
          verticalPosition: 'top', 
          horizontalPosition: 'center' 
        });
        this.loadAllAuctions(); // Reload to get updated status
        this.loadStats(); // Update stats
      },
      error: (error) => {
        console.error('Error rejecting auction:', error);
        this.snackBar.open('Failed to reject auction', 'Close', { duration: 3000 });
      }
    });
  }  
  
  deleteAuction(auction: Auction): void {
    if (confirm(`Are you sure you want to delete auction "${auction.title}"?`)) {
      this.adminService.deleteAuction(auction._id).subscribe({
        next: (response) => {
          this.snackBar.open(`Auction "${auction.title}" deleted successfully.`, 'Close', { 
            duration: 3000, 
            verticalPosition: 'top', 
            horizontalPosition: 'center' 
          });
          this.loadAllAuctions(); // Reload to get updated list
          this.loadStats(); // Update stats
        },
        error: (error) => {
          console.error('Error deleting auction:', error);
          this.snackBar.open('Failed to delete auction', 'Close', { duration: 3000 });
        }
      });
    }
  }

  endAuction(auction: Auction): void {
    if (confirm(`Are you sure you want to end auction "${auction.title}" immediately? This will award the auction to the highest bidder.`)) {
      this.adminService.endAuction(auction._id).subscribe({
        next: (response) => {
          const winnerMsg = response.winner 
            ? `Auction ended. Winner: ${response.winner.bidder} with bid $${response.winner.amount}`
            : 'Auction ended with no bids.';
          this.snackBar.open(winnerMsg, 'Close', { 
            duration: 5000, 
            verticalPosition: 'top', 
            horizontalPosition: 'center' 
          });
          this.loadAllAuctions(); // Reload to get updated status
          this.loadStats(); // Update stats
        },
        error: (error) => {
          console.error('Error ending auction:', error);
          this.snackBar.open('Failed to end auction', 'Close', { duration: 3000 });
        }
      });
    }
  }
  
  viewUserDetails(user: User): void {
    this.router.navigate(['/user-detail', user._id]); 
  }

  blockUser(user: User): void {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (confirm(`Are you sure you want to ${action} user "${user.name}"?`)) {
      this.adminService.blockUser(user._id, !user.isBlocked).subscribe({
        next: (response) => {
          this.snackBar.open(`User "${user.name}" ${action}ed successfully.`, 'Close', { 
            duration: 3000, 
            verticalPosition: 'top', 
            horizontalPosition: 'center' 
          });
          this.loadUsers(); // Reload users
          this.loadStats(); // Update stats
        },
        error: (error) => {
          console.error(`Error ${action}ing user:`, error);
          this.snackBar.open(`Failed to ${action} user`, 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      this.adminService.deleteUser(user._id).subscribe({
        next: (response) => {
          this.snackBar.open(`User "${user.name}" deleted successfully.`, 'Close', { 
            duration: 3000, 
            verticalPosition: 'top', 
            horizontalPosition: 'center' 
          });
          this.loadUsers(); // Reload users
          this.loadStats(); // Update stats
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  filterUsers(): void {
    let filtered = [...this.users];

    // Filter by role
    if (this.selectedUserRole !== 'all') {
      filtered = filtered.filter(user => user.role === this.selectedUserRole);
    }

    // Filter by search query
    if (this.userSearchQuery) {
      const query = this.userSearchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
    this.updateDisplayedUsers();
  }

  viewDetailedLogs(): void {
    this.router.navigate(['/admin-dashboard/charts']);
  }
  
  navigateToDisputes():void{
    this.router.navigate(['/disputes']);
  }

  loadDisputes(): void {
    // Mock disputes data
    this.disputes = [
      { id: 'dispute_1', auctionTitle: 'Antique Vase Auction', reason: 'Misleading description', status: 'open' },
      { id: 'dispute_2', auctionTitle: 'Vintage Watch Auction', reason: 'Delayed shipping', status: 'resolved' },
      { id: 'dispute_3', auctionTitle: 'Car Auction', reason: 'Payment issue', status: 'open' },
    ];
    this.filterDisputes();
  }

  filterDisputes(): void {
    if (this.selectedDisputeStatus === 'all') {
      this.filteredDisputes = this.disputes;
    } else {
      this.filteredDisputes = this.disputes.filter(
        (dispute) => dispute.status === this.selectedDisputeStatus
      );
    }
  }

  searchDisputes(): void {
    this.filteredDisputes = this.disputes.filter((dispute) =>
      dispute.auctionTitle.toLowerCase().includes(this.disputeSearchQuery.toLowerCase())
    );
  }

  resolveDispute(dispute: Dispute): void {
    dispute.status = 'resolved';
    this.snackBar.open(`Dispute for "${dispute.auctionTitle}" resolved successfully!`, 'Close', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
    this.filterDisputes();
  }

  escalateDispute(dispute: Dispute): void {
    this.snackBar.open(`Dispute for "${dispute.auctionTitle}" escalated for further review.`, 'Close', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
