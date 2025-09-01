import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardChartsComponent } from './admin-dashboard-charts.component';

describe('AdminDashboardChartsComponent', () => {
  let component: AdminDashboardChartsComponent;
  let fixture: ComponentFixture<AdminDashboardChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardChartsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
