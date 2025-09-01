import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Dispute {
  id: string;
  auctionTitle: string;
  reason: string;
  status: 'open' | 'resolved';
}

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disputes.component.html',
  styleUrls: ['./disputes.component.css']
})
export class DisputesComponent implements OnInit {
  disputes: Dispute[] = [];
  filteredDisputes: Dispute[] = [];
  selectedDisputeStatus: 'all' | 'open' | 'resolved' = 'all';
  disputeSearchQuery: string = '';
  stats = {
    totalDisputes: 0,
    resolvedDisputes: 0
  };

  ngOnInit(): void {
    this.loadDisputes();
    this.updateStats();
    this.applyDisputeFilters();
  }

  loadDisputes(): void {
    // Enhanced mock disputes data
    this.disputes = [
      { id: 'dispute_1', auctionTitle: 'Antique Vase Auction', reason: 'Misleading description', status: 'resolved' },
      { id: 'dispute_2', auctionTitle: 'Vintage Watch Auction', reason: 'Delayed shipping', status: 'resolved' },
      { id: 'dispute_3', auctionTitle: 'Car Auction', reason: 'Payment issue', status: 'open' },
      { id: 'dispute_4', auctionTitle: 'Rare Coin Auction', reason: 'Item not received', status: 'open' },
      { id: 'dispute_5', auctionTitle: 'Painting Auction', reason: 'Quality issues', status: 'open' },
      { id: 'dispute_6', auctionTitle: 'Furniture Auction', reason: 'Wrong item delivered', status: 'resolved' },
      { id: 'dispute_7', auctionTitle: 'Jewelry Auction', reason: 'Misleading images', status: 'open' },
      { id: 'dispute_8', auctionTitle: 'Electronics Auction', reason: 'Warranty not valid', status: 'resolved' }
    ];
  }

  updateStats(): void {
    this.stats.totalDisputes = this.disputes.length;
    this.stats.resolvedDisputes = this.disputes.filter(dispute => dispute.status === 'resolved').length;
  }

  applyDisputeFilters(): void {
    this.filteredDisputes = this.disputes.filter(dispute => {
      const matchesStatus = this.selectedDisputeStatus === 'all' || dispute.status === this.selectedDisputeStatus;
      const matchesSearch = dispute.auctionTitle.toLowerCase().includes(this.disputeSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  searchDisputes(): void {
    this.applyDisputeFilters();
  }

  resolveDispute(dispute: Dispute): void {
    dispute.status = 'resolved';
    this.updateStats();
    this.applyDisputeFilters();
  }

  undoResolveDispute(dispute: Dispute): void {
    dispute.status = 'open';
    this.updateStats();
    this.applyDisputeFilters();
  }
  constructor(private router: Router) {}
  navigateToAdminDashboard() {
    // Logic to navigate to the admin dashboard
    this.router.navigate(['/admin-dashboard']); // Adjust the route as per your application
}

  escalateDispute(dispute: Dispute): void {
    alert(`Escalating dispute for auction "${dispute.auctionTitle}".`);
  }
}
