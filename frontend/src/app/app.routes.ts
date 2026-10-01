import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./auth/login.component').then((module) => module.LoginComponent),
	},
	{
		path: 'asistencia/confirmar',
		loadComponent: () =>
			import('./asistencia/confirmar.component').then((module) => module.ConfirmarComponent),
	},
];
