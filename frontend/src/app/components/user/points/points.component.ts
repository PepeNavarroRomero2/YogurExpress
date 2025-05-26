import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PointsService } from '../../../services/points.service';

@Component({
  selector: 'app-points',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points.component.html',
  styleUrls: ['./points.component.scss']
})
export class PointsComponent implements OnInit {
  currentPoints = 0;

  constructor(
    private ptsSvc: PointsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentPoints = this.ptsSvc.getPoints();
  }

  goBack() {
    this.router.navigate(['/user/menu']);
  }
}
