import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Include the status property in the Auction interface here
interface Auction {
  id: string;
  title: string;
  info: string;
  imageUrl?: string;
  timeLeft: string;
  startTime?: Date;
  endTime?: Date;
  currentBid?: number;
  minimumBid?: number;
  seller?: string;
  status: 'ongoing' | 'upcoming' | 'past'; // Add status here
}

@Injectable({
  providedIn: 'root',
})
export class AuctionService {
  
  private upcomingAuctionsSubject = new BehaviorSubject<Auction[]>([]);
  private currentAuctionsSubject = new BehaviorSubject<Auction[]>([]);

  upcomingAuctions$ = this.upcomingAuctionsSubject.asObservable();
  currentAuctions$ = this.currentAuctionsSubject.asObservable();

  constructor() {
    // Initially load some auction data
    this.generateDynamicAuctions();
  }

  private generateDynamicAuctions(): void {
    const now = new Date();

    const upcomingAuctions: Auction[] = [
      {
        id: '1',
        title: 'Rare Painting',
        info: 'Starting at $100',
        imageUrl: 'images/painting.jpg',
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '2',
        title: 'Antique Vases',
        info: 'Starting at $500',
        imageUrl: 'images/antique.jpg',
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        timeLeft: '',
        status: 'upcoming',
      }, 
      {
        id: '3',
        title: 'Luxury Watch',
        info: 'Starting at $1000',
        imageUrl: 'images/luxury-watch.jpg',
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Starts in 2 days
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '4',
        title: 'Vintage Clock',
        info: 'Starting at $800',
        imageUrl: 'images/clock.jpg',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Starts in 3 days
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '5',
        title: 'Digital Art',
        info: 'Starting at $300',
        imageUrl: 'images/digital-art.jpg',
        startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Starts in 1 day
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '6',
        title: 'Modern Appliances',
        info: 'Starting at $600',
        imageUrl: 'images/appliance.jpg',
        startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // Starts in 4 days
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '7',
        title: 'Book Collections',
        info: 'Starting at $150',
        imageUrl: 'images/book.jpg',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Starts in 3 days
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '8',
        title: 'Gaming Console',
        info: 'Starting at $400',
        imageUrl: 'images/gaming-console.jpg',
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Starts in 2 days
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '9', 
        title: 'Vintage Guitar',
        info: 'Starting at $1200',
        imageUrl: 'images/vintage-guitar.jpg',
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Starts in 5 days
        timeLeft: '',
        status: 'upcoming',
      },
      {
        id: '10',
        title: 'Designer Handbag',
        info: 'Starting at $800',
        imageUrl: 'images/designer-handbag.jpg',
        startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // Starts in 4 days
        timeLeft: '',
        status: 'upcoming',
      },
    ];

    const currentAuctions: Auction[] = [
      {
        id: '11',
        title: 'Luxury Car',
        info: 'Luxury cars on auction',
        currentBid: 15000,
        imageUrl: 'images/car.jpg',
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '12',
        title: 'Exquisite Jewelry',
        info: 'Exquisite jewelry pieces',
        currentBid: 5000,
        imageUrl: 'images/jewelry.jpg',
        endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '13',
        title: 'Tech Gadget',
        info: 'Starting at $200',
        currentBid: 200,
        imageUrl: 'images/tech.jpg',
        endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // Ends in 6 days
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '14',
        title: 'Rare Coin',
        info: 'Starting at $250',
        currentBid: 250,
        imageUrl: 'images/rare-coin.jpg',
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '15',
        title: 'Sports Memorabilia',
        info: 'Starting at $400',
        currentBid: 400,
        imageUrl: 'images/sports-memorabilia.jpg',
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '16',
        title: 'Photography Equipment',
        info: 'Starting at $700',
        currentBid: 700,
        imageUrl: 'images/photography.jpg',
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Ends in 5 days
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '17',
        title: 'Artwork Sculpture',
        info: 'Unique sculptures available',
        currentBid: 4500,
        imageUrl: 'images/sculpture.jpg',
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '18',
        title: 'Luxury Yacht',
        info: 'Premium yachts on sale',
        currentBid: 250000,
        imageUrl: 'images/yacht.jpg',
        endTime: new Date(now.getTime() + 10 * 60 * 60 * 1000), // Ends in 10 hours
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '19',
        title: 'Smart Home Devices',
        info: 'Bid on smart home gadgets',
        currentBid: 600,
        imageUrl: 'images/smart-home.jpg',
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
        timeLeft: '',
        status: 'ongoing',
      },
      {
        id: '20',
        title: 'Collectible Toy',
        info: 'Exclusive collectible toys',
        currentBid: 350,
        imageUrl: 'images/collectible-toy.jpg',
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Ends in 1 day
        timeLeft: '',
        status: 'ongoing',
      },
    ];

    // Set the data to the subjects (this will notify subscribers)
    this.upcomingAuctionsSubject.next(upcomingAuctions);
    this.currentAuctionsSubject.next(currentAuctions);
  }

  // Add a new auction
  addAuction(newAuction: Auction): void {
    const currentAuctions = this.currentAuctionsSubject.getValue();
    newAuction.id = `auction_${Date.now()}`;
    newAuction.timeLeft = '7d 0h 0m 0s';
    newAuction.status = 'ongoing'; // Set the status to ongoing when adding

    this.currentAuctionsSubject.next([...currentAuctions, newAuction]);
  }

  // Delete an auction
  deleteAuction(auctionId: string): void {
    let currentAuctions = this.currentAuctionsSubject.getValue();
    currentAuctions = currentAuctions.filter((auction) => auction.id !== auctionId);
    this.currentAuctionsSubject.next(currentAuctions);

    let upcomingAuctions = this.upcomingAuctionsSubject.getValue();
    upcomingAuctions = upcomingAuctions.filter((auction) => auction.id !== auctionId);
    this.upcomingAuctionsSubject.next(upcomingAuctions);
  }
}
