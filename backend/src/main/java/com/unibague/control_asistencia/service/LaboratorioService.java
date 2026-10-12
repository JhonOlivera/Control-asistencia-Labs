package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.LaboratorioRequestDto;
import com.unibague.control_asistencia.dto.LaboratorioResponseDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionLaboratorioException;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LaboratorioService {

    private static final Pattern HORARIO_PATTERN =
            Pattern.compile("^([A-Z]{3})-([A-Z]{3})\\s+(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$");

    private final LaboratorioRepository laboratorioRepository;

    public LaboratorioService(LaboratorioRepository laboratorioRepository) {
        this.laboratorioRepository = laboratorioRepository;
    }

    @Transactional(readOnly = true)
    public List<LaboratorioResponseDto> listarLaboratorios() {
        return laboratorioRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LaboratorioResponseDto obtenerLaboratorio(Long id) {
        return mapToResponse(buscarLaboratorio(id));
    }

    @Transactional
    public LaboratorioResponseDto crearLaboratorio(LaboratorioRequestDto request) {
        validarNombreUnico(request.getNombre(), null);
        validarHorario(request.getHorarioDisponible());

        Laboratorio laboratorio = new Laboratorio();
        actualizarDatos(laboratorio, request);
        laboratorio.setEstado(EstadoLaboratorio.ACTIVO);

        return mapToResponse(laboratorioRepository.save(laboratorio));
    }

    @Transactional
    public LaboratorioResponseDto actualizarLaboratorio(Long id, LaboratorioRequestDto request) {
        Laboratorio laboratorio = buscarLaboratorio(id);
        validarNombreUnico(request.getNombre(), id);
        validarHorario(request.getHorarioDisponible());
        actualizarDatos(laboratorio, request);

        return mapToResponse(laboratorioRepository.save(laboratorio));
    }

    @Transactional
    public LaboratorioResponseDto ponerEnMantenimiento(Long id) {
        Laboratorio laboratorio = buscarLaboratorio(id);
        laboratorio.setEstado(EstadoLaboratorio.EN_MANTENIMIENTO);

        return mapToResponse(laboratorioRepository.save(laboratorio));
    }

    @Transactional
    public LaboratorioResponseDto activarLaboratorio(Long id) {
        Laboratorio laboratorio = buscarLaboratorio(id);
        laboratorio.setEstado(EstadoLaboratorio.ACTIVO);

        return mapToResponse(laboratorioRepository.save(laboratorio));
    }

    private Laboratorio buscarLaboratorio(Long id) {
        return laboratorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Laboratorio no encontrado con id " + id
                ));
    }

    private void validarNombreUnico(String nombre, Long idExcluido) {
        laboratorioRepository.findByNombre(nombre)
                .filter(laboratorio -> !laboratorio.getId().equals(idExcluido))
                .ifPresent(laboratorio -> {
                    throw new ValidacionLaboratorioException(
                            "Ya existe un laboratorio con el nombre " + nombre + "."
                    );
                });
    }

    private void validarHorario(String horarioDisponible) {
        if (horarioDisponible == null || horarioDisponible.isBlank()
                || !HORARIO_PATTERN.matcher(horarioDisponible).matches()) {
            throw new ValidacionLaboratorioException(
                    "El formato del horario debe ser, por ejemplo, LUN-VIE 07:00-18:00."
            );
        }
    }

    private void actualizarDatos(Laboratorio laboratorio, LaboratorioRequestDto request) {
        laboratorio.setNombre(request.getNombre());
        laboratorio.setUbicacion(request.getUbicacion());
        laboratorio.setCapacidad(request.getCapacidad());
        laboratorio.setHorarioDisponible(request.getHorarioDisponible());
    }

    private LaboratorioResponseDto mapToResponse(Laboratorio laboratorio) {
        return new LaboratorioResponseDto(
                laboratorio.getId(),
                laboratorio.getNombre(),
                laboratorio.getUbicacion(),
                laboratorio.getCapacidad(),
                laboratorio.getHorarioDisponible(),
                laboratorio.getEstado().name()
        );
    }
}
