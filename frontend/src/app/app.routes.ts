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
		loadComponent: () =>
			import('./layout/panel-layout.component').then((module) => module.PanelLayoutComponent),
		children: [
			{
				path: '',
				loadComponent: () =>
					import('./panel/inicio.component').then((module) => module.InicioComponent),
			},
			{
				path: 'sesiones',
				loadComponent: () =>
					import('./sesiones/sesiones-lista.component').then(
						(module) => module.SesionesListaComponent,
					),
			},
			{
				path: 'sesiones/nueva',
				loadComponent: () =>
					import('./sesiones/sesion-form.component').then(
						(module) => module.SesionFormComponent,
					),
			},
			{
				path: 'sesiones/:id',
				loadComponent: () =>
					import('./sesiones/sesion-detalle.component').then(
						(module) => module.SesionDetalleComponent,
					),
			},
			{
				path: 'laboratorios',
				loadComponent: () =>
					import('./layout/en-construccion.component').then(
						(module) => module.EnConstruccionComponent,
					),
			},
			{
				path: 'estudiantes',
				loadComponent: () =>
					import('./layout/en-construccion.component').then(
						(module) => module.EnConstruccionComponent,
					),
			},
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./layout/en-construccion.component').then(
						(module) => module.EnConstruccionComponent,
					),
			},
		],
	},
	{
		path: 'asistencia/confirmar',
		loadComponent: () =>
			import('./asistencia/confirmar.component').then((module) => module.ConfirmarComponent),
	},
];
