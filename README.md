# Sistema de Control de Asistencia en los Laboratorios

Proyecto de Ingeniería de Software — Universidad de Ibagué.

Aplicación web para registrar la asistencia a las sesiones de laboratorio. El foco del sistema es el **laboratorio**: el encargado abre una sesión, el sistema envía un enlace único por correo a los estudiantes del curso y cada estudiante confirma su asistencia con un solo clic, **sin iniciar sesión**.

- **Wiki (documentación, diagramas y gestión de riesgos y de la configuración):** https://github.com/JhonOlivera/Control-asistencia-Labs/wiki
- **Frontend desplegado:** https://control-asistencia-labs.vercel.app
- **Backend desplegado:** https://control-asistencia-api-e8u5.onrender.com

> **Nota sobre el arranque en frío:** el backend está en el plan gratuito de Render y se duerme tras unos 15 minutos sin uso. La primera petición puede tardar hasta ~90 segundos. Conviene abrir la URL del backend unos minutos antes de una demostración.

## Cómo funciona

1. El **administrador** (encargado del laboratorio) inicia sesión con Google y abre una sesión de laboratorio (curso, laboratorio, fecha y hora).
2. El sistema valida el horario del laboratorio, su capacidad y que no exista otra sesión abierta en el mismo horario.
3. El sistema envía por correo un **enlace único** a cada estudiante activo matriculado en el curso.
4. El **estudiante** hace clic en su enlace y el sistema registra su asistencia como *presente* o *tarde*. No necesita cuenta ni contraseña.
5. El administrador cierra la sesión y consulta quién asistió.

## Estado del proyecto (Avance 2)

Funcionalidad estimada: **≈ 50 %** de las historias de usuario (3 completas, 4 parciales, 3 pendientes).

| HU | Historia | Estado |
|----|----------|--------|
| HU01 | Registrar asistencia (por enlace de correo) | Parcial |
| HU02 | Consultar historial de asistencia | Parcial |
| HU03 | Registrar una nueva sesión de laboratorio | Cumple |
| HU04 | Generar reporte de asistencia | Parcial |
| HU05 | Gestionar estudiantes | Cumple |
| HU06 | Alerta de riesgo por baja asistencia | Parcial |
| HU07 | Justificar una inasistencia | Pendiente |
| HU08 | Corregir un registro con auditoría | Pendiente |
| HU09 | Configurar laboratorios y horarios | Cumple |
| HU10 | Alertas automáticas a coordinación | Pendiente |

**Limitaciones conocidas**

- La matrícula de estudiantes en cursos se carga con datos iniciales; todavía no hay una pantalla para matricularlos.
- No hay diferenciación de permisos por rol: cualquier usuario autenticado (administrador o docente) accede a las mismas pantallas.
- No hay envío automático de alertas por bajo porcentaje de asistencia.
- En el servidor gratuito de producción el correo saliente (SMTP) puede estar restringido; el envío de correos funciona en el entorno local.

El detalle de cada historia, los criterios de aceptación y los diagramas están en la [Wiki](https://github.com/JhonOlivera/Control-asistencia-Labs/wiki).

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Java 25, Spring Boot 4.1, Spring Security (Google OAuth2 + JWT), JPA/Hibernate, Spring Mail, Lombok |
| Frontend | Angular 22 (componentes standalone), TypeScript, SCSS |
| Base de datos | MySQL (Aiven en producción) |
| Despliegue | Render (backend, Docker), Vercel (frontend), Aiven (base de datos) |

## Estructura del repositorio

```
backend/    API REST con Spring Boot (Dockerfile incluido)
frontend/   Aplicación Angular (vercel.json para el despliegue)
docs/       Documentación técnica y mock-up navegable
```

## Ejecución en local

### Requisitos

- JDK 25
- Node.js y npm
- Una base de datos MySQL accesible (local o en la nube)
- Credenciales de Google OAuth2 y de una cuenta de correo con contraseña de aplicación

### Backend

1. Define las variables de entorno de la tabla de abajo (por ejemplo, en la configuración de ejecución de tu IDE).
2. Desde la carpeta `backend/`:

```bash
./mvnw spring-boot:run
```

El backend queda en `http://localhost:8080`. Al arrancar crea las tablas y carga los datos iniciales.

### Frontend

Desde la carpeta `frontend/`:

```bash
npm install
npm start
```

La aplicación queda en `http://localhost:4200` y, al estar en `localhost`, usa el backend local.

## Variables de entorno

El proyecto no guarda ninguna credencial en el repositorio: todo lo sensible se lee de variables de entorno. **Nunca subas sus valores.**

| Variable | Para qué sirve |
|----------|----------------|
| `DB_HOST` | Servidor de la base de datos |
| `DB_PORT` | Puerto de la base de datos |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `MAIL_USERNAME` | Cuenta de correo que envía los enlaces de asistencia |
| `MAIL_PASSWORD` | Contraseña de aplicación de esa cuenta de correo |
| `GOOGLE_CLIENT_ID` | Identificador del cliente de Google OAuth2 |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente de Google OAuth2 |
| `JWT_SECRET` | Clave con la que se firman los tokens de sesión |
| `FRONTEND_URL` | URL del frontend permitida en CORS y usada en la redirección tras el login (por defecto `http://localhost:4200`) |

En producción estas variables se configuran en Render (backend) y la URL del frontend en Vercel.

## Pruebas

Desde `backend/`:

```bash
./mvnw test
```

Las pruebas de la capa de servicio (por ejemplo, sesiones y estudiantes) se ejecutan sin base de datos. La prueba de arranque completo de la aplicación necesita las variables de entorno y una base de datos disponibles.

## Flujo de trabajo del equipo

- **GitHub Flow:** `main` siempre estable; cada tarea en una rama propia (`feature/...`, `fix/...`, `docs/...`).
- Los cambios llegan a `main` **solo por Pull Request**, con al menos una aprobación de otro integrante, y se fusionan con *merge commit*.
- **Conventional Commits** en español: `feat(estudiantes): agregar API de gestión de estudiantes (HU05)`.
- Cada integrante hace sus commits con su propia cuenta de GitHub.

Más detalle en la página *Gestión de la Configuración* de la Wiki.

## Equipo

- Jhon Edwin Olivera Duarte
- Juan Andrés Bejarano Garzón
- Sebastián Rodríguez
