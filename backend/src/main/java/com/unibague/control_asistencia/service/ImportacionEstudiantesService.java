package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.ImportacionErrorDto;
import com.unibague.control_asistencia.dto.ImportacionEstudiantesResponseDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionImportacionException;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImportacionEstudiantesService {

    private static final long TAMANO_MAXIMO_BYTES = 2L * 1024 * 1024;
    private static final Pattern CORREO_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Set<String> CLAVES_CODIGO = Set.of("codigo");
    private static final Set<String> CLAVES_NOMBRE = Set.of("nombre");
    private static final Set<String> CLAVES_CORREO = Set.of("correo", "correoelectronico", "email");

    private final CursoRepository cursoRepository;
    private final EstudianteRepository estudianteRepository;

    public ImportacionEstudiantesService(CursoRepository cursoRepository, EstudianteRepository estudianteRepository) {
        this.cursoRepository = cursoRepository;
        this.estudianteRepository = estudianteRepository;
    }

    @Transactional
    public ImportacionEstudiantesResponseDto importarEstudiantes(Long cursoId, MultipartFile archivo) {
        validarArchivo(archivo);

        String nombreArchivo = archivo.getOriginalFilename() == null
                ? ""
                : archivo.getOriginalFilename().toLowerCase(Locale.ROOT);

        List<FilaCruda> filas;
        if (nombreArchivo.endsWith(".csv")) {
            filas = parsearCsv(archivo);
        } else if (nombreArchivo.endsWith(".xlsx")) {
            filas = parsearXlsx(archivo);
        } else {
            throw new ValidacionImportacionException("Formato de archivo no soportado. Usa .csv o .xlsx.");
        }

        Curso curso = cursoRepository.findById(cursoId)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con id " + cursoId));

        int creados = 0;
        int yaExistentes = 0;
        int matriculados = 0;
        List<ImportacionErrorDto> errores = new ArrayList<>();

        for (FilaCruda fila : filas) {
            String codigo = fila.codigo().trim();
            String nombre = fila.nombre().trim();
            String correo = fila.correo().trim();

            String motivoInvalido = validarFila(codigo, nombre, correo);
            if (motivoInvalido != null) {
                errores.add(new ImportacionErrorDto(fila.numeroFila(), codigo, motivoInvalido));
                continue;
            }

            Optional<Estudiante> porCodigo = estudianteRepository.findByCodigo(codigo);
            Optional<Estudiante> porCorreo = estudianteRepository.findByCorreo(correo);

            if (porCodigo.isPresent() && porCorreo.isPresent()
                    && !porCodigo.get().getId().equals(porCorreo.get().getId())) {
                errores.add(new ImportacionErrorDto(fila.numeroFila(), codigo,
                        "El código y el correo pertenecen a estudiantes distintos."));
                continue;
            }

            Estudiante estudiante = porCodigo.orElse(porCorreo.orElse(null));

            if (estudiante != null) {
                if (!estudiante.isActivo()) {
                    errores.add(new ImportacionErrorDto(fila.numeroFila(), codigo,
                            "El estudiante está inactivo; no se reactiva automáticamente."));
                    continue;
                }
                yaExistentes++;
            } else {
                estudiante = new Estudiante();
                estudiante.setCodigo(codigo);
                estudiante.setNombre(nombre);
                estudiante.setCorreo(correo);
                estudiante.setActivo(true);
                estudiante = estudianteRepository.save(estudiante);
                creados++;
            }

            Long estudianteId = estudiante.getId();
            boolean yaMatriculado = curso.getEstudiantes().stream()
                    .anyMatch(matriculado -> matriculado.getId().equals(estudianteId));
            if (!yaMatriculado) {
                curso.getEstudiantes().add(estudiante);
                matriculados++;
            }
        }

        cursoRepository.save(curso);

        return new ImportacionEstudiantesResponseDto(filas.size(), creados, yaExistentes, matriculados, errores);
    }

    private String validarFila(String codigo, String nombre, String correo) {
        if (codigo.isBlank()) {
            return "El código es obligatorio.";
        }
        if (nombre.isBlank()) {
            return "El nombre es obligatorio.";
        }
        if (correo.isBlank() || !CORREO_PATTERN.matcher(correo).matches()) {
            return "El correo no tiene un formato válido.";
        }
        return null;
    }

    private void validarArchivo(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ValidacionImportacionException("El archivo está vacío.");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new ValidacionImportacionException("El archivo supera el tamaño máximo permitido de 2 MB.");
        }
    }

    private List<FilaCruda> parsearCsv(MultipartFile archivo) {
        String contenido;
        try {
            contenido = new String(archivo.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new ValidacionImportacionException("No se pudo leer el archivo.");
        }

        if (contenido.startsWith("﻿")) {
            contenido = contenido.substring(1);
        }

        char separador = detectarSeparador(contenido);
        List<FilaCruda> filas = new ArrayList<>();

        CSVFormat formato = CSVFormat.DEFAULT.builder()
                .setDelimiter(separador)
                .setIgnoreSurroundingSpaces(true)
                .get();

        try (CSVParser parser = CSVParser.parse(contenido, formato)) {
            List<CSVRecord> registros = parser.getRecords();
            if (registros.isEmpty()) {
                throw new ValidacionImportacionException("El archivo no tiene filas.");
            }

            List<String> encabezados = new ArrayList<>();
            registros.get(0).forEach(encabezados::add);
            int[] indices = detectarIndices(encabezados);

            for (int i = 1; i < registros.size(); i++) {
                CSVRecord registro = registros.get(i);
                String codigo = obtenerCeldaCsv(registro, indices[0]);
                String nombre = obtenerCeldaCsv(registro, indices[1]);
                String correo = obtenerCeldaCsv(registro, indices[2]);
                if (codigo.isBlank() && nombre.isBlank() && correo.isBlank()) {
                    continue;
                }
                filas.add(new FilaCruda(i + 1, codigo, nombre, correo));
            }
        } catch (IOException e) {
            throw new ValidacionImportacionException("No se pudo leer el archivo CSV.");
        }

        return filas;
    }

    private String obtenerCeldaCsv(CSVRecord registro, int indice) {
        return indice < registro.size() ? registro.get(indice).trim() : "";
    }

    private char detectarSeparador(String contenido) {
        int finPrimeraLinea = contenido.indexOf('\n');
        String primeraLinea = finPrimeraLinea >= 0 ? contenido.substring(0, finPrimeraLinea) : contenido;
        long comas = primeraLinea.chars().filter(caracter -> caracter == ',').count();
        long puntosYComa = primeraLinea.chars().filter(caracter -> caracter == ';').count();
        return puntosYComa > comas ? ';' : ',';
    }

    private List<FilaCruda> parsearXlsx(MultipartFile archivo) {
        try (Workbook workbook = WorkbookFactory.create(archivo.getInputStream())) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new ValidacionImportacionException("El archivo no tiene hojas.");
            }

            Sheet hoja = workbook.getSheetAt(0);
            Iterator<Row> filasExcel = hoja.iterator();
            if (!filasExcel.hasNext()) {
                throw new ValidacionImportacionException("El archivo no tiene filas.");
            }

            DataFormatter formateador = new DataFormatter();
            Row encabezado = filasExcel.next();
            List<String> encabezados = new ArrayList<>();
            for (Cell celda : encabezado) {
                encabezados.add(formateador.formatCellValue(celda));
            }
            int[] indices = detectarIndices(encabezados);

            List<FilaCruda> filas = new ArrayList<>();
            while (filasExcel.hasNext()) {
                Row fila = filasExcel.next();
                String codigo = obtenerCeldaXlsx(fila, indices[0], formateador);
                String nombre = obtenerCeldaXlsx(fila, indices[1], formateador);
                String correo = obtenerCeldaXlsx(fila, indices[2], formateador);
                if (codigo.isBlank() && nombre.isBlank() && correo.isBlank()) {
                    continue;
                }
                filas.add(new FilaCruda(fila.getRowNum() + 1, codigo, nombre, correo));
            }
            return filas;
        } catch (IOException e) {
            throw new ValidacionImportacionException("No se pudo leer el archivo Excel.");
        }
    }

    private String obtenerCeldaXlsx(Row fila, int indice, DataFormatter formateador) {
        Cell celda = fila.getCell(indice);
        return celda == null ? "" : formateador.formatCellValue(celda).trim();
    }

    private int[] detectarIndices(List<String> encabezados) {
        int indiceCodigo = -1;
        int indiceNombre = -1;
        int indiceCorreo = -1;

        for (int i = 0; i < encabezados.size(); i++) {
            String clave = normalizar(encabezados.get(i));
            if (CLAVES_CODIGO.contains(clave)) {
                indiceCodigo = i;
            } else if (CLAVES_NOMBRE.contains(clave)) {
                indiceNombre = i;
            } else if (CLAVES_CORREO.contains(clave)) {
                indiceCorreo = i;
            }
        }

        List<String> faltantes = new ArrayList<>();
        if (indiceCodigo < 0) {
            faltantes.add("codigo");
        }
        if (indiceNombre < 0) {
            faltantes.add("nombre");
        }
        if (indiceCorreo < 0) {
            faltantes.add("correo");
        }
        if (!faltantes.isEmpty()) {
            throw new ValidacionImportacionException("Faltan las columnas: " + String.join(", ", faltantes) + ".");
        }

        return new int[] { indiceCodigo, indiceNombre, indiceCorreo };
    }

    private String normalizar(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", "");
    }

    private record FilaCruda(int numeroFila, String codigo, String nombre, String correo) {
    }
}
