# Sistema de Control de Asistencia en Laboratorios

Proyecto de Ingeniería de Software — Universidad de Ibagué.

Aplicación web para registrar la asistencia a las sesiones de laboratorio. El foco del sistema es el **laboratorio**, no el docente: la sesión pertenece a un laboratorio y la abre su encargado. El administrador abre la sesión, el sistema envía un enlace único por correo a cada estudiante del curso y el estudiante confirma su asistencia con un solo clic, **sin iniciar sesión**.

## Producto desplegado

- **Frontend:** https://control-asistencia-labs.vercel.app
- **Backend (API):** https://control-asistencia-api-e8u5.onrender.com
- **Wiki** (historias de usuario, diagramas, gestión de riesgos y de la configuración): https://github.com/JhonOlivera/Control-asistencia-Labs/wiki

El acceso es **solo con Google** y **solo para correos previamente registrados** como Administrador o Docente en la base de datos; no hay registro automático (ver [Autenticación](#autenticación)).

> **Arranque en frío:** el backend corre en el plan gratuito de Render y se duerme tras un rato sin uso. La primera petición después de dormirse puede tardar hasta ~90 segundos en responder.

## Funcionalidades implementadas

| HU | Historia de usuario |
|----|----------------------|
| HU01 | El estudiante registra su asistencia desde el enlace que recibe por correo, sin iniciar sesión (se marca como *presente* o *tarde* según la tolerancia configurada). |
| HU02 | Consultar el historial de asistencia: por estudiante y por participantes de una sesión. |
| HU03 | Registrar, listar (con filtro por curso, orden y paginación), cerrar y eliminar sesiones de laboratorio. |
| HU04 | Generar reportes y estadísticas de asistencia, con exportación a CSV. |
| HU05 | Gestionar estudiantes (alta, edición, activar/inactivar). |
| HU09 | Configurar laboratorios: CRUD, horario disponible y capacidad, validados al crear una sesión. |
| HU11 | Importar estudiantes de un curso desde un archivo CSV o Excel. |
| HU12 | Configurar un horario recurrente por curso, con selección de varios días. |
| HU14 | Consultar estudiantes activos e inactivos por pestañas separadas. |
| HU15 | Gestionar grupos (cursos) desde la interfaz. |

### Mejoras futuras

- **HU06** — Alertas por riesgo de baja asistencia.
- **HU07** — Justificar una inasistencia.
- **HU08** — Corregir un registro de asistencia con auditoría.

El detalle de cada historia y sus criterios de aceptación están en la [Wiki](https://github.com/JhonOlivera/Control-asistencia-Labs/wiki).

## Alcance

Para la entrega final se ajustó el alcance a las funcionalidades esenciales; HU10 (duplicaba HU06) y HU13 (automatización fuera del alcance) se retiraron.

## Arquitectura

Angular (desplegado en Vercel) consume la API REST de Spring Boot (desplegada en Render), que persiste en MySQL (Aiven). El login es con Google OAuth2; una vez autenticado, el backend emite un JWT propio que el frontend guarda y envía en cada petición. El envío de los enlaces de asistencia se hace con la API de Brevo, con un respaldo por SMTP (Gmail) si Brevo no está configurado.

```
Angular (Vercel) → Spring Boot (Render) → MySQL (Aiven)
                         ↓
               Google OAuth2 + JWT propio
                         ↓
          Brevo (con respaldo SMTP) → correo del estudiante
```

*(Diagrama de arquitectura: ver Wiki)*

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Backend | Java 25, Spring Boot 4.1.1, Spring Security (OAuth2 Client + Resource Server), Spring Data JPA/Hibernate, Spring Mail, Lombok, Apache POI (Excel), Apache Commons CSV |
| Frontend | Angular 22 (componentes standalone, signals), TypeScript, Vitest |
| Base de datos | MySQL (Aiven en producción) |
| Correo | Brevo (API), con respaldo SMTP de Gmail |
| Despliegue | Render (backend, vía Docker), Vercel (frontend), Aiven (base de datos) |

## Guía de instalación local

### Prerrequisitos

- **JDK 25** (la imagen de Docker usa `eclipse-temurin:25`; el `pom.xml` fija `java.version=25`).
- **Node.js 24.21.0** y **npm 11.19.0** (versiones con las que se probó el proyecto).
- Un servidor **MySQL 8.x** accesible (8.0 en local, 8.4 en producción).
- Una cuenta de Google Cloud con credenciales OAuth 2.0 (ver más abajo).
- Una cuenta de correo de Gmail con contraseña de aplicación (para el respaldo SMTP) y, opcionalmente, una cuenta de Brevo con API key.

No se necesita instalar Maven ni Angular CLI de forma global: el backend incluye el *Maven wrapper* (`mvnw` / `mvnw.cmd`) y el frontend trae `@angular/cli` como dependencia de desarrollo.

### 1. Clonar el repositorio

```bash
git clone https://github.com/JhonOlivera/Control-asistencia-Labs.git
cd Control-asistencia-Labs
```

### 2. Base de datos MySQL local

Crea una base de datos vacía en tu servidor MySQL local (por ejemplo, `control_asistencia`). El esquema lo crea Hibernate automáticamente al arrancar el backend (`spring.jpa.hibernate.ddl-auto=update`); no hay scripts de migración que ejecutar.

### 3. Variables de entorno del backend

El backend no tiene valores por defecto para estas variables (salvo las que se indican); defínelas en el entorno antes de arrancar, o en la configuración de ejecución de tu IDE. **Nunca subas sus valores reales al repositorio.**

| Variable | Para qué sirve | Ejemplo (sin valores reales) |
|----------|-----------------|-------------------------------|
| `DB_HOST` | Host del servidor MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_NAME` | Nombre de la base de datos | `control_asistencia` |
| `DB_USER` | Usuario de la base de datos | `mi_usuario` |
| `DB_PASSWORD` | Contraseña de la base de datos | `********` |
| `MAIL_USERNAME` | Cuenta de Gmail que envía los enlaces (respaldo SMTP) | `cuenta@gmail.com` |
| `MAIL_PASSWORD` | Contraseña de aplicación de esa cuenta de Gmail | `****************` |
| `GOOGLE_CLIENT_ID` | ID del cliente OAuth2 de Google Cloud Console | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente OAuth2 de Google Cloud Console | `********` |
| `JWT_SECRET` | Clave para firmar los JWT propios (mínimo 32 caracteres; si es más corto el backend no arranca) | `una-clave-larga-y-aleatoria-de-32+` |
| `FRONTEND_URL` | URL del frontend, usada en CORS y en las redirecciones del login (por defecto `http://localhost:4200`) | `http://localhost:4200` |
| `BREVO_API_KEY` | API key de Brevo para el envío de correos (opcional; sin ella se usa el respaldo SMTP) | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | Correo remitente configurado en Brevo (opcional) | `no-responder@dominio.com` |
| `BREVO_SENDER_NAME` | Nombre remitente mostrado en el correo (opcional) | `Laboratorios Unibagué` |
| `PORT` | Puerto en el que escucha el backend (por defecto `8080`) | `8080` |
| `TZ` | Zona horaria del sistema/JVM (opcional); afecta `LocalDateTime.now()`, usado al validar sesiones, calcular la tolerancia de asistencia y la expiración de tokens | `America/Bogota` |

### 4. Credenciales de Google OAuth2

1. En [Google Cloud Console](https://console.cloud.google.com/), crea (o usa) un proyecto y configura la pantalla de consentimiento OAuth.
2. Crea un **ID de cliente OAuth 2.0** de tipo "Aplicación web".
3. Agrega como **URI de redirección autorizada**: `http://localhost:8080/login/oauth2/code/google`.
4. Copia el *Client ID* y el *Client secret* en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
5. Para que un correo pueda iniciar sesión, debe existir previamente como `Administrador` o `Docente` en la base de datos (`DataSeeder` crea algunos de prueba al arrancar; no hay registro automático desde la interfaz).

### 5. Levantar el backend

Desde `backend/`:

```bash
./mvnw spring-boot:run
```

En Windows usa `mvnw.cmd` en lugar de `./mvnw`. El backend queda disponible en `http://localhost:8080` y, al arrancar, crea las tablas y los datos de prueba (`DataSeeder`).

### 6. Levantar el frontend

Desde `frontend/`:

```bash
npm install
npm start
```

La aplicación queda en `http://localhost:4200`. Las URLs del backend están fijas en `frontend/src/app/core/environment.ts`: cuando el *hostname* es `localhost` usa `http://localhost:8080`; en cualquier otro caso usa el backend de Render.

### 7. Ejecutar las pruebas

Backend, desde `backend/`:

```bash
./mvnw test                              # todas las pruebas
./mvnw test -Dtest=NombreClase#metodo    # una sola prueba
```

La mayoría son pruebas de la capa de servicio y no necesitan base de datos. La excepción es `ControlAsistenciaApplicationTests`, un `@SpringBootTest` que levanta todo el contexto de Spring, por lo que además necesita una base de datos accesible y todas las variables de entorno del paso 3.

Frontend, desde `frontend/`:

```bash
npm test                                         # todas las pruebas (Vitest vía ng test)
npx ng test --include src/app/app.spec.ts        # un solo archivo
```

## Despliegue

| Componente | Dónde | Notas |
|------------|-------|-------|
| Backend | Render (contenedor Docker, `backend/Dockerfile`) | Necesita las mismas variables de entorno del paso 3, configuradas en el panel de Render. Plan gratuito: se duerme sin uso y tarda en despertar (~90 s). |
| Frontend | Vercel | `frontend/vercel.json` redirige todas las rutas a `index.html` (routing de Angular). Las URLs del backend están fijas en el código (`core/environment.ts`), no en variables de entorno de Vercel. |
| Base de datos | Aiven (MySQL) | Se conecta con `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `sslMode=REQUIRED`. |

`FRONTEND_URL` en Render debe apuntar a la URL real del frontend en Vercel (se usa para CORS y para las redirecciones del login de Google).

## Flujo de trabajo del equipo

- **GitHub Flow:** `main` protegida y siempre estable; cada tarea en su propia rama `feature/...` (o `fix/...`, `docs/...`).
- **Nunca** se hacen commits directos a `main`; todo entra por Pull Request con revisión de otro integrante.
- **Conventional Commits** en español, referenciando la historia de usuario cuando aplica: `feat(estudiantes): agregar API de gestión de estudiantes (HU05)`.
- Se prueba localmente antes de subir cambios.

## Limitaciones conocidas

- Los correos a cuentas `@estudiantesunibague.edu.co` pueden no llegar por filtrado de la propia universidad.
- `Administrador` y `Docente` no tienen hoy una diferencia real de permisos: cualquiera de los dos accede a las mismas pantallas y endpoints.
- El inicio de sesión con correo y contraseña está marcado como "Próximamente" en la pantalla de login; por ahora el único acceso es con Google.

## Equipo

- Jhon Edwin Olivera Duarte
- Juan Andrés Bejarano Garzón
- Sebastián Rodríguez
