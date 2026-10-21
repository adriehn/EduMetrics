import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { Carreras } from './pages/carreras/carreras';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  { path: 'carreras', component: Carreras, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];