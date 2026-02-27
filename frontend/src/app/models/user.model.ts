export interface User {
  _id: string;
  nombre: string;
  email: string;
  password: string;
  cuenta_poe: string;
  rol: 'User' | 'Pro' | 'Admin';
  fecha_creacion: Date;
}
