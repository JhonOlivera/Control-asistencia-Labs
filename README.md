# 📋 Control de Asistencia en Laboratorios

Sistema web para el registro y seguimiento de asistencia a prácticas de laboratorio en la Universidad de Ibagué, pensado como reemplazo de las listas físicas y planillas de Excel que se usan actualmente.

---

## 🧭 Descripción del proyecto

Actualmente, el control de asistencia a las prácticas de laboratorio se hace de forma manual: listas físicas o archivos de Excel que dificultan el seguimiento, la generación de reportes y la trazabilidad de los registros. Este proyecto busca digitalizar ese proceso mediante una aplicación web centrada en el **laboratorio**, no en el docente, donde:

- El **estudiante** recibe un correo con un enlace único al abrirse la sesión, y con un solo clic marca su propia asistencia — sin iniciar sesión ni llenar ningún formulario.
- El **administrador del sistema** (encargado del laboratorio) abre y cierra las sesiones, gestiona estudiantes y laboratorios, y corrige registros cuando sea necesario.
- El **docente** puede iniciar sesión para consultar reportes de sus cursos.
- La **coordinación académica** recibe alertas automáticas y reportes consolidados, sin operar el día a día del sistema.

## ✨ Funcionalidades principales

- 🔐 Autenticación por rol, solo para Administrador y Docente (el estudiante no requiere cuenta)
- ✉️ Registro de asistencia mediante enlace único enviado por correo (un clic, sin formularios)
- 📊 Historial de asistencia por estudiante, con porcentaje acumulado
- 📝 Generación de reportes de asistencia filtrables por curso, docente y fecha
- ⚠️ Alertas automáticas por baja asistencia, tanto para el estudiante como para coordinación
- ✅ Justificación de inasistencias con soporte adjunto y aprobación del administrador
- 🛠️ Corrección de registros de asistencia dentro de una ventana de tiempo definida
- ⚙️ Configuración de laboratorios, capacidad y horarios disponibles
- 🧾 Trazabilidad completa: toda edición queda auditada (usuario, fecha, valor anterior y nuevo)

## 🏗️ Stack tecnológico

| Componente           | Tecnología               |
| --------------------- | ------------------------ |
| Backend               | Java · Spring Boot       |
| Frontend              | Angular (TypeScript)     |
| Base de datos         | MySQL (alojada en Aiven) |
| Control de versiones  | Git / GitHub             |
| Diseño / prototipado  | Figma / draw.io          |

## 📐 Requerimientos no funcionales

El proyecto sigue los lineamientos de calidad de software definidos en la norma **ISO/IEC 25010**, cubriendo aspectos como:

- **Fiabilidad** — respaldo periódico de datos ante fallos
- **Seguridad** — solo usuarios autenticados (Administrador, Docente) pueden acceder al panel de gestión
- **Trazabilidad** — auditoría completa de cada edición realizada sobre un registro de asistencia

## 👥 Roles del sistema

- **Estudiante** — marca su asistencia con un clic desde el correo, consulta su historial y justifica inasistencias (sin necesidad de iniciar sesión)
- **Administrador del sistema (encargado de laboratorio)** — abre/cierra sesiones, gestiona estudiantes y laboratorios, corrige registros
- **Docente** — inicia sesión para consultar reportes de sus cursos
- **Coordinación académica** — consulta reportes consolidados y recibe alertas automáticas

## 📌 Estado del proyecto

🚧 En desarrollo — Avance 1 corregido tras retroalimentación del profesor (enfoque reorientado al laboratorio). Backend: modelo de datos y repositorios listos, servicios en construcción. Frontend: setup inicial en curso.

## 📂 Documentación

Consulta la [Wiki del repositorio](https://github.com/JhonOlivera/Control-asistencia-Labs/wiki) para ver el detalle completo del avance, las historias de usuario y los diagramas del proyecto.

## 👥 Equipo

- **Jhon Edwin Olivera Duarte**
- **Sebastian Rodriguez Martinez**
- **Juan Andres Bejarano Garzon**

Estudiantes de Ingeniería de Sistemas — Universidad de Ibagué

---

Proyecto académico — Universidad de Ibagué
