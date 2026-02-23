import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { BuildService } from '../../services/build';
import { Build } from '../../models/build.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-build',
  standalone: false,
  templateUrl: './create-build.html',
  styleUrl: './create-build.css',
})
export class CreateBuild implements OnInit {
  build: Partial<Build> = {
    nombre: '',
    clase: '',
    ascendencia: '',
    autor: '',
    descripcion: '',
    ventajas: '',
    desventajas: '',
    imagen: '',
    imagen_mime: '',
    valoraciones: {
      boss_dmg: 0,
      comfort: 0,
      difficulty: 0,
      fun: 0,
      map_speed_clear: 0,
      survivality: 0
    }
  };

  versiones: { name: string; pobb: string }[] = [];
  nuevaVersion = { name: '', pobb: '' };
  imagePreview: string | null = null;
  imageError: string | null = null;
  isLoading = false;
  selectedFile: File | null = null;

  clases = [
    'Marauder', 'Ranger', 'Witch', 'Shadow', 'Duelist', 'Templar', 'Scion', 'Ascendant'
  ];

  opcionesValoracion = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  constructor(
    private router: Router,
    private location: Location,
    private buildService: BuildService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { build?: Build };
    
    if (state?.build) {
      this.build = { ...state.build };
      if (this.build.imagen) {
        this.imagePreview = this.buildService.getImageUrl(this.build.imagen);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.processImage(file);
    }
  }

  onUrlSubmit(): void {
    const urlInput = (document.getElementById('imageUrl') as HTMLInputElement).value;
    if (!urlInput) return;

    this.isLoading = true;
    fetch(urlInput)
      .then(response => {
        if (!response.ok) throw new Error('No se pudo obtener la imagen');
        return response.blob();
      })
      .then(blob => {
        const extension = blob.type.split('/')[1];
        const fileName = `url-image-${Date.now()}.${extension}`;
        const file = new File([blob], fileName, { type: blob.type });
        this.processImage(file);
        this.isLoading = false;
      })
      .catch(error => {
        this.imageError = 'Error al cargar la imagen: ' + error.message;
        this.isLoading = false;
      });
  }

  private processImage(file: File): void {
    const allowedTypes = ['image/webp', 'image/png', 'image/jpeg'];
    
    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Formato no permitido. Usa: WebP, PNG o JPEG';
      return;
    }

    this.imageError = null;
    this.selectedFile = file;
    this.build.imagen_mime = file.type;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  addVersion(): void {
    if (this.nuevaVersion.name && this.nuevaVersion.pobb) {
      this.versiones.push({ name: this.nuevaVersion.name, pobb: this.nuevaVersion.pobb });
      this.nuevaVersion = { name: '', pobb: '' };
    }
  }

  removeVersion(index: number): void {
    this.versiones.splice(index, 1);
  }

  private uploadImage(): Promise<string | null> {
    if (!this.selectedFile) {
      return Promise.resolve(this.build.imagen || null);
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    return new Promise((resolve, reject) => {
      this.http.post<{ filename: string }>('http://localhost:3000/upload', formData)
        .subscribe({
          next: (response) => {
            resolve(response.filename);
          },
          error: (error) => {
            reject(error);
          }
        });
    });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    
    this.uploadImage()
      .then(filename => {
        this.build.imagen = filename || '';
        
        const buildData = {
          nombre: this.build.nombre,
          clase: this.build.clase,
          ascendencia: this.build.ascendencia,
          autor: this.build.autor,
          descripcion: this.build.descripcion,
          ventajas: this.build.ventajas,
          desventajas: this.build.desventajas,
          imagen: this.build.imagen,
          imagen_mime: this.build.imagen_mime,
          versiones: this.versiones,
          valoraciones: {
            boss_dmg: Number(this.build.valoraciones?.boss_dmg) || 0,
            comfort: Number(this.build.valoraciones?.comfort) || 0,
            difficulty: Number(this.build.valoraciones?.difficulty) || 0,
            fun: Number(this.build.valoraciones?.fun) || 0,
            map_speed_clear: Number(this.build.valoraciones?.map_speed_clear) || 0,
            survivality: Number(this.build.valoraciones?.survivality) || 0
          }
        };

        this.buildService.createBuild(buildData as Build).subscribe({
          next: (created) => {
            this.isLoading = false;
            alert('Build creada correctamente');
            this.router.navigate(['/build', created._id]);
          },
          error: (error) => {
            this.isLoading = false;
            alert('Error al crear la build: ' + error.message);
          }
        });
      })
      .catch(error => {
        this.isLoading = false;
        alert('Error al subir la imagen: ' + error.message);
      });
  }

  private validateForm(): boolean {
    if (!this.build.nombre?.trim()) {
      alert('El nombre es obligatorio');
      return false;
    }
    if (!this.build.clase?.trim()) {
      alert('La clase es obligatoria');
      return false;
    }
    if (!this.build.ascendencia?.trim()) {
      alert('La ascendencia es obligatoria');
      return false;
    }
    if (!this.build.autor?.trim()) {
      alert('El autor es obligatorio');
      return false;
    }
    return true;
  }

  loadFromJson(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          this.build = {
            ...this.build,
            ...json,
            imagen: '',
            imagen_mime: ''
          };
          this.imagePreview = null;
          this.selectedFile = null;
          alert('Build cargada desde JSON');
        } catch (error) {
          alert('Error al parsear el JSON');
        }
      };
      
      reader.readAsText(file);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
