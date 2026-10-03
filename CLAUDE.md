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
- Autenticación obligatoria: se usará **login con Google** (todavía no implementado; `LoginComponent` es solo interfaz).
- Base de datos en la nube: **MySQL en Aiven**.
- El proyecto debe quedar **desplegado** al final.
- **Todos los integrantes** deben participar en el repositorio.

### Reglas del equipo
- Cada tarea va en su propia rama `feature/...`.
- **Nunca** hacer commits directos a `main`; todo entra por Pull Request.
- Probar antes de subir cambios.
- **Nunca** escribir credenciales reales (contraseñas, hosts, usuarios, tokens) en ningún archivo del repositorio; usar variables de entorno.
- Los commits siguen Conventional Commits en español (`feat: ...`, `fix: ...`, `chore: ...`) y suelen referenciar la historia de usuario (`HU01`).

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

La única prueba existente del backend es un `@SpringBootTest` que levanta todo el contexto, así que también necesita una base de datos accesible.

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
- **Jerarquía de usuarios**: `Usuario` es la base (herencia `JOINED`) de `Administrador`, `Estudiante` y `Coordinador`.
- **Manejo de errores**: los servicios lanzan `ResourceNotFoundException` (→ 404) o excepciones de validación de dominio `ValidacionSesionException` / `ValidacionAsistenciaException` (→ 400); `GlobalExceptionHandler` las convierte en `ErrorResponse { message }`. Las nuevas reglas de negocio deben seguir este patrón en lugar de armar respuestas de error en los controladores.
- **`DataSeeder`** (`CommandLineRunner`) crea de forma idempotente un estudiante, laboratorio, curso y administrador de prueba en cada arranque y registra sus IDs en el log; usar esos IDs para probar la API a mano.
- Parámetros en `application.properties`: `app.frontend-url`, `app.token.expiracion-minutos`, `app.asistencia.minutos-tolerancia`.
- CORS (`config/CorsConfig`) solo permite `http://localhost:4200` y los métodos GET/POST/PATCH/OPTIONS sobre `/api/**`; hay que actualizarlo al agregar endpoints PUT/DELETE o al desplegar.

### Flujo principal de asistencia (backend + frontend)
1. `POST /api/sesiones`: `SesionService.crearSesion` valida que el laboratorio esté `ACTIVO`, que la fecha/hora encaje en su `horarioDisponible` (formato `"LUN-VIE 07:00-18:00"`, leído con una expresión regular) y que no haya otra sesión `ABIERTA` duplicada; la sesión se crea `ABIERTA`.
2. `POST /api/sesiones/{id}/enviar-enlaces`: `NotificacionService` crea un `TokenAsistencia` (UUID) por cada estudiante activo del curso y le envía por correo el enlace `{app.frontend-url}/asistencia/confirmar?token=...`. Los fallos de envío se registran en el log, no se propagan.
3. El estudiante abre el enlace → `ConfirmarComponent` (Angular) llama a `GET /api/asistencia/marcar?token=...`.
4. `AsistenciaService.marcarAsistencia` verifica que el token no esté usado ni vencido, que la sesión esté `ABIERTA` y que no exista ya la asistencia; registra `PRESENTE` o `TARDE` (pasada la tolerancia) y marca el token como usado.
5. `PATCH /api/sesiones/{id}/cerrar` cierra la sesión.

### Frontend
- Componentes standalone con plantillas y estilos en línea; las rutas se cargan de forma diferida con `loadComponent` en `app.routes.ts`. Las funcionalidades se agrupan por carpeta (`auth/`, `asistencia/`).
- La URL base de la API está fija en `src/app/core/environment.ts` (`http://localhost:8080/api`); no hay archivos de environments de Angular, lo que habrá que resolver para el despliegue.
