# 📋 Control de Asistencia en Laboratorios
 
Sistema web para el registro y seguimiento de asistencia a prácticas de laboratorio en la Universidad de Ibagué, pensado como reemplazo de las listas físicas y planillas de Excel que se usan actualmente.
 
---
 
## 🧭 Descripción del proyecto
 
Actualmente, el control de asistencia a las prácticas de laboratorio se hace de forma manual: listas físicas o archivos de Excel que dificultan el seguimiento, la generación de reportes y la trazabilidad de los registros. Este proyecto busca digitalizar ese proceso mediante una aplicación web donde:
 
- El **docente** toma asistencia escaneando el carné estudiantil (QR) desde su propia vista, sin depender de la API oficial de la universidad.
- El **estudiante** puede consultar su historial de asistencia y justificar inasistencias.
- El **administrador del sistema** configura laboratorios, gestiona usuarios y recibe alertas automáticas.
## ✨ Funcionalidades principales
 
- 🔐 Autenticación de usuarios por rol (estudiante, docente, administrador)
- 📷 Registro ágil de asistencia mediante escaneo de código QR del carné estudiantil
- 📊 Historial de asistencia por estudiante
- 📝 Generación de reportes de asistencia
- ⚠️ Alertas automáticas por baja asistencia
- ✅ Justificación de inasistencias
- 🛠️ Corrección de registros por parte del docente
- ⚙️ Configuración de laboratorios y sesiones
- 🔔 Notificaciones automáticas para coordinación académica
- 🧾 Trazabilidad completa: toda edición queda auditada (usuario, fecha, valor anterior y nuevo)
## 🏗️ Stack tecnológico
 
![Stack](https://skillicons.dev/icons?i=java,spring,angular,ts,mysql,git,github&theme=dark)
 
| Componente | Tecnología |
|---|---|
| Backend | Java · Spring Boot |
| Frontend | Angular (TypeScript) |
| Base de datos | MySQL (alojada en Aiven) |
| Control de versiones | Git / GitHub |
| Diseño / prototipado | Figma / draw.io |
 
## 📐 Requerimientos no funcionales
 
El proyecto sigue los lineamientos de calidad de software definidos en la norma **ISO/IEC 25010**, cubriendo aspectos como:
 
- **Fiabilidad** — respaldo periódico de datos ante fallos
- **Seguridad** — solo usuarios autenticados pueden registrar asistencia
- **Trazabilidad** — auditoría completa de cada edición realizada
## 👥 Roles del sistema
 
- **Estudiante** — consulta su historial y justifica inasistencias
- **Docente** — toma asistencia, corrige registros
- **Administrador del sistema** — configura laboratorios y gestiona el sistema en general
## 📌 Estado del proyecto
 
🚧 En desarrollo — Avance 1 completado (contexto, historias de usuario, requerimientos no funcionales, diseño de mock-ups y modelo de datos).
 
## 📂 Documentación
 
Consulta la [Wiki del repositorio](../../wiki) para ver el detalle completo del Avance 1, las historias de usuario y los diagramas del proyecto.
 
## 👥 Equipo
 
- **Jhon Edwin Olivera Duarte**
- **Sebastian Rodriguez Martinez**
- **Juan Andres Bejarano Garzon**
Estudiantes de Ingeniería de Sistemas — Universidad de Ibagué
 
---
 
<p align="center">Proyecto académico — Universidad de Ibagué</p>
 
