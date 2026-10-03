# Instrucciones para GitHub Copilot

Sistema de control de asistencia a laboratorios de la Universidad de Ibagué (curso de Ingeniería de Software). El foco es el **laboratorio, no el docente**. La guía completa está en `CLAUDE.md`; este archivo es un resumen.

## Roles
- **Administrador** (encargado del laboratorio): abre y cierra sesiones, gestiona estudiantes y laboratorios.
- **Docente**: consulta reportes. **Coordinador**: reportes y alertas.
- **Estudiante**: **no inicia sesión**; marca asistencia con el enlace con token que recibe por correo.

## Stack
- `backend/`: Spring Boot 4.1, Java 25, Maven (`mvnw`), Spring Data JPA, Spring Security (OAuth2 Client + Resource Server), Lombok, MySQL en Aiven.
- `frontend/`: Angular 22 con componentes standalone, signals y Vitest. Prettier: 100 columnas, comillas simples.

## Estructura
- Backend, paquete `com.unibague.control_asistencia`:
  - `controller/`: endpoints REST bajo `/api/...`.
  - `service/`: lógica de negocio y validaciones.
  - `repository/`: interfaces de Spring Data JPA.
  - `model/`: entidades JPA; `model/enums/`: estados.
  - `dto/`: objetos de entrada y salida de la API.
  - `exception/`: excepciones de dominio y `GlobalExceptionHandler`.
  - `security/`: JWT y manejo del login con Google.
  - `config/`: `SecurityConfig` y `CorsConfig`.
- Frontend, `frontend/src/app`:
  - `core/`: URLs del backend, servicio de autenticación, interceptor y guard.
  - Una carpeta por funcionalidad (`auth/`, `asistencia/`, `panel/`), con rutas de carga diferida en `app.routes.ts`.

## Convenciones
- **Todo en español**: clases, métodos, variables, mensajes de error, textos de la interfaz y commits (`feat: ...`, `fix: ...`, `chore: ...`).
- Arquitectura por capas `controller → service → repository → model`, con inyección por constructor.
- Los controladores reciben y devuelven **DTOs**, nunca entidades. Los DTOs de respuesta son `record` (p. ej. `AsistenciaResponseDto`) y los de entrada se validan con `jakarta.validation` y `@Valid`.
- **Errores**: los servicios no arman respuestas HTTP. Lanzan una excepción y `GlobalExceptionHandler` la convierte en `ErrorResponse { message }`:
  - `ResourceNotFoundException` → 404.
  - `ValidacionSesionException` / `ValidacionAsistenciaException` → 400. Para un dominio nuevo, crear una excepción `Validacion<Algo>Exception` y su handler.
- Las entidades usan Lombok (`@Getter`, `@Setter`, `@NoArgsConstructor`). Los usuarios heredan de `Usuario` (herencia `JOINED`): `Administrador`, `Docente`, `Estudiante`, `Coordinador`.
- Hibernate crea y actualiza el esquema (`ddl-auto=update`) sobre la base **compartida** del equipo; no hay migraciones.
- Frontend: componentes standalone con plantilla y estilos en línea, `inject()` en lugar de constructores y `signal` para el estado.

## Seguridad (JWT)
1. El login lleva a `/oauth2/authorization/google`.
2. Tras autenticarse en Google, `GoogleLoginSuccessHandler` busca el correo como Administrador o Docente:
   - Si no está registrado, redirige a `/login?error=no_autorizado`.
   - Si está registrado, genera un JWT con `JwtService` (HS256; `sub` = correo, claims `nombre` y `rol`; dura 8 h) y redirige a `/auth/callback?token=...`.
3. El frontend guarda el token. `auth.interceptor.ts` envía `Authorization: Bearer <token>` al backend, y `auth.guard.ts` protege las rutas privadas.
4. Rutas del backend:
   - Públicas: `/api/asistencia/marcar`, `/oauth2/**`, `/login/**`.
   - Todo lo demás exige el JWT y responde 401 si falta.
   - Los roles llegan como `ROLE_ADMINISTRADOR` / `ROLE_DOCENTE`.
5. `/api/asistencia/marcar` y la ruta `/asistencia/confirmar` del frontend deben seguir siendo **públicas**.

## No modificar sin avisar al equipo
Estos archivos afectan a todos. Cualquier cambio se discute antes y se explica en el Pull Request:
- `backend/src/main/java/.../config/SecurityConfig.java`
- `backend/src/main/java/.../config/CorsConfig.java`
- `backend/src/main/resources/application.properties`
- `backend/pom.xml`
- `backend/src/main/java/.../service/DataSeeder.java`
- **Las entidades** en `model/`: renombrar, borrar o cambiar el tipo de un campo, y también **agregar campos nuevos**. Hibernate (`ddl-auto=update`) altera la base compartida de Aiven en cuanto alguien arranca el backend.

## Reglas
- **Nunca** escribir credenciales, contraseñas, secretos ni hosts reales en el código. Todo sale de variables de entorno: `DB_*`, `MAIL_*`, `GOOGLE_CLIENT_*`, `JWT_SECRET`.
- Cada tarea va en una rama `feature/...`. Nunca se hacen commits directos a `main`; todo entra por Pull Request y se prueba antes de subir.
