import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { BuildService } from '../../services/build';
import { AuthService } from '../../services/auth';
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
  items_mandatory: string[] = [];
  imagePreview: string | null = null;
  imageError: string | null = null;
  isLoading = false;
  selectedFile: File | null = null;
  isEditing = false;
  buildId: string | null = null;
  isItemModalOpen = false;
  maxItems = 8;
  canUploadLocalImage = false;

  clases = [
    'Marauder', 'Ranger', 'Witch', 'Shadow', 'Duelist', 'Templar', 'Scion'
  ];

  ascendenciasPorClase: { [key: string]: string[] } = {
    'Marauder': ['Chieftain', 'Berserker', 'Juggernaut'],
    'Ranger': ['Pathfinder', 'Deadeye', 'Warden'],
    'Witch': ['Elementalist', 'Necromancer', 'Occultist'],
    'Shadow': ['Assassin', 'Trickster', 'Saboteur'],
    'Duelist': ['Slayer', 'Gladiator', 'Champion'],
    'Templar': ['Hierophant', 'Guardian', 'Inquisitor'],
    'Scion': ['Ascendant']
  };

  ascendenciasDisponibles: string[] = [];

  opcionesValoracion = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  onClaseChange(): void {
    const claseSeleccionada = this.build.clase;
    if (claseSeleccionada && this.ascendenciasPorClase[claseSeleccionada]) {
      this.ascendenciasDisponibles = this.ascendenciasPorClase[claseSeleccionada];
      this.build.ascendencia = '';
    } else {
      this.ascendenciasDisponibles = [];
    }
  }

  constructor(
    private router: Router,
    private location: Location,
    private buildService: BuildService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      this.canUploadLocalImage = currentUser.rol === 'Admin' || currentUser.rol === 'Pro';
    }
    
    const buildToEdit = this.buildService.getBuildToEdit();
    
    if (buildToEdit) {
      console.log('Build recibida para edición:', buildToEdit);
      this.isEditing = true;
      this.buildId = buildToEdit._id || null;
      this.build = { ...buildToEdit };
      this.versiones = buildToEdit.versiones || [];
      this.items_mandatory = buildToEdit.items_mandatory || [];
      if (this.build.imagen) {
        this.imagePreview = this.buildService.getImageUrl(this.build.imagen, this.build.imagen_mime);
      }
      this.buildService.clearBuildToEdit();
    } else if (currentUser) {
      this.build.autor = currentUser.nombre;
      this.build.usuario_id = currentUser._id;
    }
  }

  openItemModal(): void {
    this.isItemModalOpen = true;
  }

  closeItemModal(): void {
    this.isItemModalOpen = false;
  }

  addItem(itemText: string): void {
    if (this.items_mandatory.length < this.maxItems) {
      this.items_mandatory.push(itemText);
    }
    this.closeItemModal();
  }

  removeItem(index: number): void {
    this.items_mandatory.splice(index, 1);
  }

  get canAddMoreItems(): boolean {
    return this.items_mandatory.length < this.maxItems;
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

    // Validate URL format
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      this.imageError = 'URL inválida. Debe comenzar con http:// o https://';
      return;
    }

    // Store the URL directly
    this.build.imagen = urlInput;
    this.build.imagen_mime = 'image/uri';
    this.imagePreview = urlInput;
    this.imageError = null;
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
        if (filename) {
          this.build.imagen = filename;
        }
        
        const buildData = {
          nombre: this.build.nombre,
          clase: this.build.clase,
          ascendencia: this.build.ascendencia,
          autor: this.build.autor,
          usuario_id: this.build.usuario_id,
          descripcion: this.build.descripcion,
          ventajas: this.build.ventajas,
          desventajas: this.build.desventajas,
          imagen: this.build.imagen,
          imagen_mime: this.build.imagen_mime,
          versiones: this.versiones,
          items_mandatory: this.items_mandatory,
          valoraciones: {
            boss_dmg: Number(this.build.valoraciones?.boss_dmg) || 0,
            comfort: Number(this.build.valoraciones?.comfort) || 0,
            difficulty: Number(this.build.valoraciones?.difficulty) || 0,
            fun: Number(this.build.valoraciones?.fun) || 0,
            map_speed_clear: Number(this.build.valoraciones?.map_speed_clear) || 0,
            survivality: Number(this.build.valoraciones?.survivality) || 0
          }
        };

        if (this.isEditing && this.buildId) {
          this.buildService.updateBuild(this.buildId, buildData as Build).subscribe({
            next: (updated) => {
              this.isLoading = false;
              alert('Build actualizada correctamente');
              this.router.navigate(['/build', updated._id]);
            },
            error: (error) => {
              this.isLoading = false;
              alert('Error al actualizar la build: ' + error.message);
            }
          });
        } else {
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
        }
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
