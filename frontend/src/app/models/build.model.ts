export interface Valoraciones {
  boss_dmg: number;
  comfort: number;
  difficulty: number;
  fun: number;
  map_speed_clear: number;
  survivality: number;
}

export interface Version {
  name: string;
  pobb: string;
}

export interface ItemMandatory {
  description: string;
  img: string;
}

export interface Build {
  _id: string;
  ascendencia: string;
  autor: string;
  clase: string;
  descripcion: string;
  desventajas: string;
  fecha_creacion: Date;
  imagen: string;
  imagen_mime: string;
  nombre: string;
  valoraciones: Valoraciones;
  ventajas: string;
  versiones: Version[];
  items_mandatory?: ItemMandatory[];
  usuario_id?: string;
}