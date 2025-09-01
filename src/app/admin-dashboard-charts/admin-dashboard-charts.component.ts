import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard-charts',
  standalone: true,
  templateUrl: './admin-dashboard-charts.component.html',
  styleUrls: ['./admin-dashboard-charts.component.css'],
})
export class AdminDashboardChartsComponent implements OnInit, OnDestroy {
  private updateInterval: any;
  private charts: Chart[] = [];

  constructor(private router: Router) { Chart.register(...registerables); }

  ngOnInit(): void {
    this.createUserGrowthChart();
    this.createAuctionStatusChart();
    this.createRevenueTrendsChart();
    this.createBidActivityChart();
    this.createCategoryDistributionChart();
    this.createRevenueByRegionChart();
    this.simulateDataUpdates();
  }

  ngOnDestroy(): void { 
    this.charts.forEach(chart => chart.destroy());
    clearInterval(this.updateInterval);
  }

  createUserGrowthChart(): void {
    const ctx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'User Growth',
          data: [10, 30, 45, 90, 100, 160],
          borderColor: 'var(--admin-success-color)',
          backgroundColor: 'rgba(42, 157, 143, 0.3)',
          tension: 0.4, // Smooth curve
          fill: true,
          pointHoverRadius: 10,
          pointHoverBackgroundColor: 'var(--admin-accent-color)',
        }, {
          // Adding a target growth line
          label: 'Target Growth',
          data: [20, 40, 60, 80, 100, 120],
          borderColor: 'red',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          tooltip: { 
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.7)',
            titleColor: 'white',
            bodyColor: 'lightblue'
          },
          legend: { 
            position: 'top', 
            labels: { color: 'var(--admin-text-color)' } 
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { 
            beginAtZero: true, 
            grid: { color: 'var(--admin-accent-color)' },
            ticks: { callback: (value) => `${value}k` }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  createAuctionStatusChart(): void {
    const ctx = document.getElementById('auctionStatusChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Rejected', 'Pending'],
        datasets: [{
          label: 'Auction Status',
          data: [25, 10, 15],
          backgroundColor: ['#66bb6a', '#ef5350', '#ffa726'],
          hoverOffset: 20,
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        cutout: '50%', // Makes the donut more pronounced
        plugins: {
          tooltip: { 
            callbacks: {
              label: (context) => ` ${context.label}: ${context.formattedValue}%`
            }
          },
          legend: { 
            position: 'right',
            labels: { 
              usePointStyle: true,
              pointStyleWidth: 15
            } 
          }
        }
      }
    });
    this.charts.push(chart);
  }

  createRevenueTrendsChart(): void {
    const ctx = document.getElementById('revenueTrendsChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Revenue',
          data: [5000, 7000, 6000, 8000],
          backgroundColor: ['#42a5f5', '#5c6bc0', '#26a69a', '#ffa726'],
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.2)',
          hoverBackgroundColor: ['#2196f3', '#3f51b5', '#009688', '#ff9800']
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: { 
            beginAtZero: true, 
            grid: { color: '#e0e0e0' },
            ticks: { 
              callback: (value) => `$${Number(value)/1000}K`,
              color: 'var(--admin-text-color)'
            }
          }
        },
        plugins: {
          tooltip: { 
            callbacks: {
              label: (context) => `Revenue: $${context.formattedValue}`
            }
          },
          legend: { display: false }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });
    this.charts.push(chart);
  }

  createBidActivityChart(): void {
    const ctx = document.getElementById('bidActivityChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Bid Activity',
          data: [30, 40, 50, 20, 60, 70, 90],
          borderColor: '#ff5722',
          backgroundColor: 'rgba(255, 87, 34, 0.3)',
          fill: true,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: 'var(--admin-accent-color)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: { 
            beginAtZero: true, 
            grid: { color: '#e0e0e0' },
            pointLabels: { 
              font: { size: 10 },
              color: 'var(--admin-text-color)'
            }
          }
        },
        plugins: {
          tooltip: { intersect: true },
          legend: { position: 'top' }
        }
      }
    });
    this.charts.push(chart);
  }

  createCategoryDistributionChart(): void {
    const ctx = document.getElementById('categoryDistributionChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Electronics', 'Furniture', 'Fashion', 'Books', 'Toys'],
        datasets: [{
          label: 'Category Distribution',
          data: [20, 15, 30, 10, 25],
          backgroundColor: ['#ff6700', '#2a9d8f', '#ffc085', '#42a5f5', '#e63946'],
          hoverOffset: 15,
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { 
            callbacks: {
              label: (context) => ` ${context.label}: ${context.formattedValue}%`
            }
          },
          legend: { 
            position: 'bottom',
            labels: { 
              usePointStyle: true,
              pointStyleWidth: 15
            } 
          }
        },
        animation: {
          animateRotate: true,
          duration: 1200
        }
      }
    });
    this.charts.push(chart);
  }

  createRevenueByRegionChart(): void {
    const ctx = document.getElementById('revenueByRegionChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['North', 'South', 'East', 'West', 'Central'],
        datasets: [{
          label: 'Revenue by Region',
          data: [500, 800, 600, 700, 400],
          backgroundColor: 'rgba(255, 103, 0, 0.5)',
          borderColor: 'var(--admin-accent-color)',
          borderWidth: 2,
          hoverBackgroundColor: 'rgba(255, 103, 0, 0.8)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            grid: { color: '#e0e0e0' },
            ticks: {
              font: { size: 12, family: "'Roboto', sans-serif", weight: 'bold' },
              color: 'var(--admin-text-color)'
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#e0e0e0' },
            ticks: {
              callback: (value) => `$${Number(value)}K`,
              font: { size: 12, family: "'Roboto', sans-serif", weight: 'bold' },
              color: 'var(--admin-text-color)'
            }
          }
        },
        plugins: {
          tooltip: { 
            callbacks: {
              label: (context) => `Revenue: $${context.formattedValue}K`
            }
          },
          legend: { display: false }
        }
      }
    });
    this.charts.push(chart);
  }

  simulateDataUpdates(): void {
    this.updateInterval = setInterval(() => {
      // Simulate dynamic data updates
      const randomChartIndex = Math.floor(Math.random() * this.charts.length);
      const chart = this.charts[randomChartIndex];
      
      chart.data.datasets[0].data = chart.data.datasets[0].data.map(() => 
        Math.floor(Math.random() * 100)
      );
      chart.update();
    }, 100000);
  }
  logout(): void {
    clearInterval(this.updateInterval);
    this.router.navigate(['/admin-login']); // Redirect to the login page after logout
  }
  
  navigateBack(): void { this.router.navigate(['/admin-dashboard']); }
}