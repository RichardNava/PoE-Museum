import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BuildService } from '../services/build';
import { Build } from '../models/build.model';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  builds: Build[] = [];

  constructor(
    private buildService: BuildService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildService.getAllBuilds().subscribe(data => {
      console.log('Datos recibidos en componente:', data);
      this.builds = data;
      this.cdr.detectChanges();
    });
  }

  viewBuild(id: string): void {
    this.router.navigate(['/build', id]);
  }

  getImageUrl(imagen: string): string {
    return this.buildService.getImageUrl(imagen);
  }
}