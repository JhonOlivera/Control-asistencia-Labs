package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.model.Administrador;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.repository.AdministradorRepository;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import org.springframework.boot.CommandLineRunner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    private static final String CORREO_ADMINISTRADOR_GOOGLE = "jhonedwinolivera2018@gmail.com";

    private final AdministradorRepository administradorRepository;
    private final EstudianteRepository estudianteRepository;
    private final CursoRepository cursoRepository;
    private final LaboratorioRepository laboratorioRepository;

    public DataSeeder(
            AdministradorRepository administradorRepository,
            EstudianteRepository estudianteRepository,
            CursoRepository cursoRepository,
            LaboratorioRepository laboratorioRepository
    ) {
        this.administradorRepository = administradorRepository;
        this.estudianteRepository = estudianteRepository;
        this.cursoRepository = cursoRepository;
        this.laboratorioRepository = laboratorioRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Estudiante estudiante = estudianteRepository.findByCorreo("asistencia.laboratorios.unibague@gmail.com")
                .orElseGet(this::crearEstudiante);

        Laboratorio laboratorio = laboratorioRepository.findByNombre("Laboratorio de Sistemas")
                .orElseGet(this::crearLaboratorio);

        Curso curso = cursoRepository.findByNombreAndGrupo("Curso de prueba", "A")
                .orElseGet(this::crearCurso);

        Administrador administrador = administradorRepository.findByCorreo("admin.laboratorios.unibague@gmail.com")
                .or(() -> administradorRepository.findByNombre("Administrador de prueba"))
                .orElseGet(this::crearAdministrador);

        Administrador administradorGoogle = administradorRepository.findByCorreo(CORREO_ADMINISTRADOR_GOOGLE)
                .orElseGet(this::crearAdministradorGoogle);

        if (curso.getEstudiantes().add(estudiante)) {
            cursoRepository.save(curso);
        }

        logger.info("Datos de prueba disponibles: cursoId={}, laboratorioId={}, administradorId={}, estudianteId={}",
                curso.getId(), laboratorio.getId(), administrador.getId(), estudiante.getId());
        logger.info("Administrador con acceso por Google: {} (id={})",
                administradorGoogle.getCorreo(), administradorGoogle.getId());
    }

    private Administrador crearAdministradorGoogle() {
        Administrador administrador = new Administrador();
        administrador.setNombre("Jhon Edwin Olivera Duarte");
        administrador.setCorreo(CORREO_ADMINISTRADOR_GOOGLE);
        return administradorRepository.save(administrador);
    }

    private Estudiante crearEstudiante() {
        Estudiante estudiante = new Estudiante();
        estudiante.setNombre("Estudiante de prueba");
        estudiante.setCorreo("asistencia.laboratorios.unibague@gmail.com");
        String codigo = "EST-PRUEBA-001";
        int sufijo = 2;
        while (estudianteRepository.findByCodigo(codigo).isPresent()) {
            codigo = "EST-PRUEBA-" + String.format("%03d", sufijo++);
        }
        estudiante.setCodigo(codigo);
        estudiante.setActivo(true);
        return estudianteRepository.save(estudiante);
    }

    private Laboratorio crearLaboratorio() {
        Laboratorio laboratorio = new Laboratorio();
        laboratorio.setNombre("Laboratorio de Sistemas");
        laboratorio.setUbicacion("Bloque de Ingeniería");
        laboratorio.setCapacidad(30);
        laboratorio.setHorarioDisponible("LUN-DOM 00:00-23:59");
        laboratorio.setEstado(EstadoLaboratorio.ACTIVO);
        return laboratorioRepository.save(laboratorio);
    }

    private Curso crearCurso() {
        Curso curso = new Curso();
        curso.setNombre("Curso de prueba");
        curso.setGrupo("A");
        return cursoRepository.save(curso);
    }

    private Administrador crearAdministrador() {
        Administrador administrador = new Administrador();
        administrador.setNombre("Administrador de prueba");
        administrador.setCorreo("admin.laboratorios.unibague@gmail.com");
        return administradorRepository.save(administrador);
    }
}
