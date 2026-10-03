# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Proyecto

Sistema de control de asistencia a laboratorios de la Universidad de Ibagué, desarrollado para el curso de Ingeniería de Software. El profesor del curso es nuestro cliente y pidió que **el foco sea el laboratorio, no el docente**: la sesión pertenece a un laboratorio y la abre su encargado.

El dominio, los identificadores del código, los mensajes de commit y los textos visibles al usuario están en **español**; el código nuevo debe seguir esa convención (p. ej. `Sesion`, `Asistencia`, `crearSesion`, `ValidacionSesionException`). Las historias de usuario y los diagramas están en la Wiki de GitHub, no en el repositorio.

### Roles
- **Administrador** (encargado del laboratorio): abre y cierra sesiones, gestiona estudiantes y laboratorios, corrige registros.
- **Docente**: consulta reportes de sus cursos.
- **Coordinador**: consulta reportes consolidados y recibe alertas automáticas.
- **Estudiante**: **no inicia sesión**. Marca su asistencia con un clic en el enlace con token que le llega al correo.

### Restricciones del curso (incumplir cualquiera = nota 0)
- Autenticación obligatoria: **login con Google** (ver «Autenticación» más abajo).
- Base de datos en la nube: **MySQL en Aiven**.
- El proyecto debe quedar **desplegado** al final.
- **Todos los integrantes** deben participar en el repositorio.

### Reglas del equipo
- Cada tarea va en su propia rama `feature/...`.
- **Nunca** hacer commits directos a `main`; todo entra por Pull Request.
- Probar antes de subir cambios.
- **Nunca** escribir credenciales reales (contraseñas, hosts, usuarios, tokens) en ningún archivo del repositorio; usar variables de entorno.
- Los commits siguen Conventional Commits en español (`feat: ...`, `fix: ...`, `chore: ...`) y suelen referenciar la historia de usuario (`HU01`).

### No modificar sin avisar al equipo
Estos archivos afectan a todos. Cualquier cambio se discute antes y se explica en el Pull Request:
- `backend/src/main/java/.../config/SecurityConfig.java`
- `backend/src/main/java/.../config/CorsConfig.java`
- `backend/src/main/resources/application.properties`
- `backend/pom.xml`
- `backend/src/main/java/.../service/DataSeeder.java`
- **Las entidades** en `model/`: renombrar, borrar o cambiar el tipo de un campo, y también **agregar campos nuevos**. Hibernate (`ddl-auto=update`) altera la base compartida de Aiven en cuanto alguien arranca el backend.

`.github/copilot-instructions.md` resume este archivo para GitHub Copilot; si cambian estas reglas, actualizar ambos.

Es un monorepo con dos aplicaciones independientes:
- `backend/`: Spring Boot 4.1 (Java 25, Maven wrapper, Lombok), MySQL en Aiven.
- `frontend/`: Angular 22 (componentes standalone, signals, Vitest).

## Comandos

Backend (desde `backend/`; en Windows usar `mvnw.cmd`):
```
./mvnw spring-boot:run                     # API en http://localhost:8080
./mvnw test                                # todas las pruebas
./mvnw test -Dtest=NombreClase#metodo      # una sola prueba
./mvnw package
```

Variables de entorno requeridas (no tienen valores por defecto):
- Base de datos: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Correo (SMTP de Gmail): `MAIL_USERNAME`, `MAIL_PASSWORD` (contraseña de aplicación)
- Login con Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (credenciales OAuth de Google Cloud Console; URI de redirección autorizada: `http://localhost:8080/login/oauth2/code/google`)
- JWT: `JWT_SECRET` (mínimo 32 caracteres; si es más corto el backend no arranca)

La única prueba existente del backend es un `@SpringBootTest` que levanta todo el contexto, así que también necesita una base de datos accesible y todas las variables anteriores.

Frontend (desde `frontend/`):
```
npm start                                  # ng serve en http://localhost:4200
npm run build
npm test                                   # Vitest mediante ng test
npx ng test --include src/app/app.spec.ts  # un solo archivo de pruebas
```
Prettier: 100 columnas, comillas simples.

## Arquitectura

### Backend (`com.unibague.control_asistencia`)
Por capas: `controller` → `service` → `repository` (Spring Data JPA) → `model`. Los controladores usan inyección por constructor y devuelven DTOs de `dto/`, nunca entidades.

- **El esquema lo administra Hibernate** (`ddl-auto=update`): no hay migraciones, y cambiar una entidad altera directamente la base de datos compartida en Aiven.
- **Jerarquía de usuarios**: `Usuario` es la base (herencia `JOINED`) de `Administrador`, `Docente`, `Estudiante` y `Coordinador`. El correo es único en toda la tabla `usuarios`.
- **Manejo de errores**: los servicios lanzan `ResourceNotFoundException` (→ 404) o excepciones de validación de dominio `ValidacionSesionException` / `ValidacionAsistenciaException` (→ 400); `GlobalExceptionHandler` las convierte en `ErrorResponse { message }`. Las nuevas reglas de negocio deben seguir este patrón en lugar de armar respuestas de error en los controladores.
- **`DataSeeder`** (`CommandLineRunner`) crea de forma idempotente un estudiante, laboratorio, curso y administrador de prueba, y los administradores del equipo que entran con Google (lista `ADMINISTRADORES_GOOGLE`), en cada arranque; registra sus IDs en el log.
- Parámetros en `application.properties`: `app.frontend-url`, `app.token.expiracion-minutos`, `app.asistencia.minutos-tolerancia`, `app.jwt.expiracion-horas`.
- CORS (`config/CorsConfig`) es un bean `CorsConfigurationSource` que aplica Spring Security; solo permite `http://localhost:4200` sobre `/api/**`, así que hay que actualizarlo al desplegar.

### Autenticación (Administrador y Docente)
- `config/SecurityConfig`: sin sesiones (stateless), CSRF desactivado. Públicos: `/api/asistencia/marcar`, `/oauth2/**`, `/login/**`, `/error`. Todo lo demás exige `Authorization: Bearer <JWT>`; sin token válido responde 401 (no redirige).
- Flujo: el frontend envía al usuario a `/oauth2/authorization/google` → Google → `security/GoogleLoginSuccessHandler` busca el correo (verificado) como `Administrador` y luego como `Docente`. Si no existe, redirige a `{app.frontend-url}/login?error=no_autorizado`; si existe, genera el JWT con `JwtService` y redirige a `{app.frontend-url}/auth/callback?token=...`. Los fallos de Google redirigen a `/login?error=fallo_google`.
- El JWT es HS256 firmado con `JWT_SECRET` (`sub` = correo, claims `nombre` y `rol`, 8 h). Lo valida el resource server de Spring Security; el claim `rol` se convierte en la autoridad `ROLE_ADMINISTRADOR` / `ROLE_DOCENTE` (útil para `@PreAuthorize` o `hasRole`). `GET /api/auth/me` devuelve correo, nombre y rol a partir del token.
- Para dar acceso a alguien hay que registrarlo como `Administrador` o `Docente` en la base de datos; no existe registro automático.

### Flujo principal de asistencia (backend + frontend)
1. `POST /api/sesiones`: `SesionService.crearSesion` valida que el laboratorio esté `ACTIVO`, que la fecha/hora encaje en su `horarioDisponible` (formato `"LUN-VIE 07:00-18:00"`, leído con una expresión regular) y que no haya otra sesión `ABIERTA` duplicada; la sesión se crea `ABIERTA`.
2. `POST /api/sesiones/{id}/enviar-enlaces`: `NotificacionService` crea un `TokenAsistencia` (UUID) por cada estudiante activo del curso y le envía por correo el enlace `{app.frontend-url}/asistencia/confirmar?token=...`. Los fallos de envío se registran en el log, no se propagan.
3. El estudiante abre el enlace → `ConfirmarComponent` (Angular) llama a `GET /api/asistencia/marcar?token=...`.
4. `AsistenciaService.marcarAsistencia` verifica que el token no esté usado ni vencido, que la sesión esté `ABIERTA` y que no exista ya la asistencia; registra `PRESENTE` o `TARDE` (pasada la tolerancia) y marca el token como usado.
5. `PATCH /api/sesiones/{id}/cerrar` cierra la sesión.

### Frontend
- Componentes standalone con plantillas y estilos en línea; las rutas se cargan de forma diferida con `loadComponent` en `app.routes.ts`. Las funcionalidades se agrupan por carpeta (`auth/`, `asistencia/`).
- Las URLs del backend están fijas en `src/app/core/environment.ts` (`backendUrl`, `apiUrl`, `googleLoginUrl`); no hay archivos de environments de Angular, lo que habrá que resolver para el despliegue.
- Sesión: `core/auth.service.ts` guarda el JWT en `localStorage` y revisa su `exp`; `core/auth.interceptor.ts` agrega el header `Authorization` a las peticiones a `apiUrl` (excepto `/asistencia/marcar`, que debe seguir funcionando aunque haya un token vencido) y ante un 401 borra el token y envía a `/login`; `core/auth.guard.ts` protege las rutas privadas (hoy `/panel`). Las rutas nuevas que requieran login deben llevar `canActivate: [authGuard]`.
- `/auth/callback` guarda el token recibido y redirige a `/panel` reemplazando la URL, para que el token no quede en el historial. Cerrar sesión solo borra el token local (el JWT sigue siendo válido hasta que expira).
