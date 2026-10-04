package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.EstudianteEnRiesgoDto;
import com.unibague.control_asistencia.dto.HistorialEstudianteDto;
import com.unibague.control_asistencia.dto.PorcentajeCursoDto;
import com.unibague.control_asistencia.dto.ResumenReporteDto;
import com.unibague.control_asistencia.dto.SesionHistorialDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.model.Asistencia;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReporteService {

    // Estados que cuentan como asistencia para el porcentaje.
    private static final Set<EstadoAsistencia> ESTADOS_ASISTIDOS =
            EnumSet.of(EstadoAsistencia.PRESENTE, EstadoAsistencia.TARDE, EstadoAsistencia.JUSTIFICADO);
    private static final double UMBRAL_RIESGO = 80.0;

    private final SesionRepository sesionRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final CursoRepository cursoRepository;
    private final EstudianteRepository estudianteRepository;

    public ReporteService(SesionRepository sesionRepository,
                          AsistenciaRepository asistenciaRepository,
                          CursoRepository cursoRepository,
                          EstudianteRepository estudianteRepository) {
        this.sesionRepository = sesionRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.cursoRepository = cursoRepository;
        this.estudianteRepository = estudianteRepository;
    }

    @Transactional(readOnly = true)
    public ResumenReporteDto obtenerResumen() {
        Map<Long, Long> cerradasPorCurso = sesionRepository.contarPorCursoYEstado(EstadoSesion.CERRADA)
                .stream()
                .collect(Collectors.toMap(SesionRepository.ConteoPorCurso::getCursoId,
                        SesionRepository.ConteoPorCurso::getTotal));

        Map<ClaveMatricula, Long> asistidasPorMatricula = asistenciaRepository
                .contarPorEstudianteYCurso(EstadoSesion.CERRADA, ESTADOS_ASISTIDOS)
                .stream()
                .collect(Collectors.toMap(
                        conteo -> new ClaveMatricula(conteo.getEstudianteId(), conteo.getCursoId()),
                        AsistenciaRepository.ConteoPorEstudianteYCurso::getTotal));

        List<EstudianteEnRiesgoDto> enRiesgo = new ArrayList<>();
        double sumaPorcentajes = 0;
        int matriculasConSesiones = 0;

        for (CursoRepository.Matricula matricula : cursoRepository.findMatriculasDeEstudiantesActivos()) {
            long sesionesTotales = cerradasPorCurso.getOrDefault(matricula.getCursoId(), 0L);
            if (sesionesTotales == 0) {
                continue; // Sin sesiones cerradas no hay porcentaje que calcular.
            }
            long sesionesAsistidas = asistidasPorMatricula.getOrDefault(
                    new ClaveMatricula(matricula.getEstudianteId(), matricula.getCursoId()), 0L);
            double porcentaje = 100.0 * sesionesAsistidas / sesionesTotales;

            sumaPorcentajes += porcentaje;
            matriculasConSesiones++;

            if (porcentaje < UMBRAL_RIESGO) {
                enRiesgo.add(new EstudianteEnRiesgoDto(
                        matricula.getEstudianteId(),
                        matricula.getEstudianteNombre(),
                        matricula.getEstudianteCodigo(),
                        nombreCurso(matricula.getCursoNombre(), matricula.getCursoGrupo()),
                        redondear(porcentaje),
                        sesionesAsistidas,
                        sesionesTotales));
            }
        }

        enRiesgo.sort(Comparator.comparingDouble(EstudianteEnRiesgoDto::porcentaje)
                .thenComparing(EstudianteEnRiesgoDto::nombre));

        double asistenciaPromedio = matriculasConSesiones == 0 ? 0.0 : redondear(sumaPorcentajes / matriculasConSesiones);

        return new ResumenReporteDto(
                sesionRepository.count(),
                asistenciaPromedio,
                estudianteRepository.countByActivoTrue(),
                enRiesgo);
    }

    @Transactional(readOnly = true)
    public HistorialEstudianteDto obtenerHistorial(Long estudianteId) {
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new ResourceNotFoundException("Estudiante no encontrado con id " + estudianteId));

        Map<Long, Asistencia> asistenciaPorSesion = new HashMap<>();
        for (Asistencia asistencia : asistenciaRepository.findByEstudianteIdConSesion(estudianteId)) {
            asistenciaPorSesion.put(asistencia.getSesion().getId(), asistencia);
        }

        // Sesiones del historial: las cerradas de sus cursos (sin registro = AUSENTE)
        // y cualquier otra donde ya tenga un registro, p. ej. una sesión aún abierta.
        Map<Long, Sesion> sesiones = new LinkedHashMap<>();
        List<Sesion> cerradasDeSusCursos =
                sesionRepository.findByEstadoEnCursosDelEstudiante(EstadoSesion.CERRADA, estudianteId);
        cerradasDeSusCursos.forEach(sesion -> sesiones.put(sesion.getId(), sesion));
        asistenciaPorSesion.values().forEach(asistencia -> sesiones.putIfAbsent(asistencia.getSesion().getId(), asistencia.getSesion()));

        List<SesionHistorialDto> historial = sesiones.values().stream()
                .sorted(Comparator.comparing(Sesion::getFecha).thenComparing(Sesion::getHora).reversed())
                .map(sesion -> {
                    Asistencia asistencia = asistenciaPorSesion.get(sesion.getId());
                    return new SesionHistorialDto(
                            sesion.getId(),
                            sesion.getFecha(),
                            sesion.getHora(),
                            nombreCurso(sesion.getCurso()),
                            sesion.getLaboratorio().getNombre(),
                            asistencia != null ? asistencia.getEstado() : EstadoAsistencia.AUSENTE);
                })
                .toList();

        List<PorcentajeCursoDto> porcentajes = estudiante.getCursos().stream()
                .sorted(Comparator.comparing(Curso::getNombre).thenComparing(Curso::getGrupo))
                .map(curso -> {
                    List<Sesion> cerradasDelCurso = cerradasDeSusCursos.stream()
                            .filter(sesion -> sesion.getCurso().getId().equals(curso.getId()))
                            .toList();
                    long sesionesTotales = cerradasDelCurso.size();
                    long sesionesAsistidas = cerradasDelCurso.stream()
                            .map(sesion -> asistenciaPorSesion.get(sesion.getId()))
                            .filter(asistencia -> asistencia != null && ESTADOS_ASISTIDOS.contains(asistencia.getEstado()))
                            .count();
                    Double porcentaje = sesionesTotales == 0 ? null : redondear(100.0 * sesionesAsistidas / sesionesTotales);
                    return new PorcentajeCursoDto(curso.getId(), nombreCurso(curso), porcentaje, sesionesAsistidas, sesionesTotales);
                })
                .toList();

        return new HistorialEstudianteDto(estudiante.getId(), estudiante.getNombre(), estudiante.getCodigo(),
                historial, porcentajes);
    }

    private static String nombreCurso(Curso curso) {
        return nombreCurso(curso.getNombre(), curso.getGrupo());
    }

    private static String nombreCurso(String nombre, String grupo) {
        return nombre + " - " + grupo;
    }

    private static double redondear(double valor) {
        return Math.round(valor * 10) / 10.0;
    }

    private record ClaveMatricula(Long estudianteId, Long cursoId) {
    }
}
