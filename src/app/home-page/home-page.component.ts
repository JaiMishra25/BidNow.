import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FeaturedAuction {
  id: number;
  title: string;
  currentBid: number;
  timeLeft: string;
  imageUrl: string;
  bids: number;
}

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent {
  isNavbarFixed = false;
  searchQuery: string = '';
  currentYear = new Date().getFullYear();

  featuredAuctions: FeaturedAuction[] = [
    {
      id: 1,
      title: 'Vintage Rolex Watch',
      currentBid: 15000,
      timeLeft: '2 hours',
      imageUrl: 'assets/placeholder-1.jpg',
      bids: 23
    },
    {
      id: 2,
      title: 'Modern Art Painting',
      currentBid: 8500,
      timeLeft: '4 hours',
      imageUrl: 'assets/placeholder-2.jpg',
      bids: 15
    },
    {
      id: 3,
      title: 'Classic Car Collection',
      currentBid: 45000,
      timeLeft: '1 day',
      imageUrl: 'assets/placeholder-3.jpg',
      bids: 45
    }
  ];

  categories = [
    { name: 'Watches & Jewelry', icon: '⌚', count: 156 },
    { name: 'Art & Collectibles', icon: '🎨', count: 284 },
    { name: 'Cars & Vehicles', icon: '🚗', count: 192 },
    { name: 'Electronics', icon: '📱', count: 347 }
  ];

  navLinks = [
    { path: 'auctions', label: 'Auctions', sectionId: 'featured-section' },
    { path: 'categories', label: 'Categories', sectionId: 'categories-section' },
    { path: 'how-it-works', label: 'How It Works', sectionId: 'how-it-works' },
    { path: 'about', label: 'About', sectionId: 'about-section' },
    { path: 'contact', label: 'Contact', sectionId: 'newsletter-section' }
  ];

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isNavbarFixed = window.scrollY > 100;
  }

  footerLinks = {
    about: [
      { label: 'About Us', path: '/about-us' },
      { label: 'Careers', path: '/about-us' },
      { label: 'Press', path: '/about-us' },
      { label: 'Blog', path: '/about-us' }
    ],
    support: [
      { label: 'Help Center', path: '/support' },
      { label: 'Safety Center', path: '/support' },
      { label: 'Community Guidelines', path: '/support' },
      { label: 'Contact Us', path: '/support' }
    ],
    legal: [
      { label: 'Terms of Service', path: '/legal' },
      { label: 'Privacy Policy', path: '/legal' },
      { label: 'Cookie Policy', path: '/legal' },
      { label: 'Auction Rules', path: '/legal' }
    ]
  };

  onSearch(): void {
    console.log('Searching for:', this.searchQuery);
  }
}