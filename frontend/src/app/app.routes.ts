import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./auth/login.component').then((module) => module.LoginComponent),
	},
	{
		path: 'auth/callback',
		loadComponent: () =>
			import('./auth/callback.component').then((module) => module.CallbackComponent),
	},
	{
		path: 'panel',
		canActivate: [authGuard],
		loadComponent: () => import('./panel/panel.component').then((module) => module.PanelComponent),
	},
	{
		path: 'asistencia/confirmar',
		loadComponent: () =>
			import('./asistencia/confirmar.component').then((module) => module.ConfirmarComponent),
	},
];
