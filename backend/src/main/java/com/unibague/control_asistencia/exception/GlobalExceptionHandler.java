package com.unibague.control_asistencia.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ValidacionSesionException.class)
    public ResponseEntity<ErrorResponse> handleValidacionSesion(ValidacionSesionException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ValidacionLaboratorioException.class)
    public ResponseEntity<ErrorResponse> handleValidacionLaboratorio(ValidacionLaboratorioException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ValidacionAsistenciaException.class)
    public ResponseEntity<ErrorResponse> handleValidacionAsistencia(ValidacionAsistenciaException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ValidacionHorarioGrupoException.class)
    public ResponseEntity<ErrorResponse> handleValidacionHorarioGrupo(ValidacionHorarioGrupoException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ConflictoHorarioGrupoException.class)
    public ResponseEntity<ErrorResponse> handleConflictoHorarioGrupo(ConflictoHorarioGrupoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ConflictoEstudianteException.class)
    public ResponseEntity<ErrorResponse> handleConflictoEstudiante(ConflictoEstudianteException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ConflictoSesionException.class)
    public ResponseEntity<ErrorResponse> handleConflictoSesion(ConflictoSesionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ConflictoCursoException.class)
    public ResponseEntity<ErrorResponse> handleConflictoCurso(ConflictoCursoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ValidacionImportacionException.class)
    public ResponseEntity<ErrorResponse> handleValidacionImportacion(ValidacionImportacionException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("El archivo supera el tamaño máximo permitido de 2 MB."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Validación fallida");

        return ResponseEntity.badRequest().body(new ErrorResponse(message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        logger.error("Violación de integridad de datos.", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("No se pudo completar la operación porque hay datos relacionados."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleExceptionGenerica(Exception ex) throws Exception {
        // AccessDeniedException y AuthenticationException deben seguir siendo resueltas por
        // Spring Security (401/403), no convertidas aquí en un 500 genérico.
        if (ex instanceof AccessDeniedException || ex instanceof AuthenticationException) {
            throw ex;
        }

        // Excepciones del framework que ya traen su propio código HTTP correcto
        // (NoResourceFoundException, HttpRequestMethodNotSupportedException,
        // MissingServletRequestParameterException, ResponseStatusException, etc.):
        // se respeta ese código, pero con el formato ErrorResponse del proyecto.
        if (ex instanceof org.springframework.web.ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();
            logger.warn("Excepción del framework con código {}: {}", status.value(), ex.getClass().getSimpleName());
            return ResponseEntity.status(status).body(new ErrorResponse(mensajeParaEstadoHttp(status)));
        }

        logger.error("Ocurrió un error inesperado.", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Ocurrió un error inesperado"));
    }

    private String mensajeParaEstadoHttp(HttpStatusCode status) {
        if (status.value() == HttpStatus.NOT_FOUND.value()) {
            return "El recurso solicitado no existe.";
        }
        if (status.value() == HttpStatus.METHOD_NOT_ALLOWED.value()) {
            return "El método HTTP utilizado no está permitido para este recurso.";
        }
        if (status.value() == HttpStatus.BAD_REQUEST.value()) {
            return "La solicitud no es válida.";
        }
        if (status.is4xxClientError()) {
            return "La solicitud no se pudo procesar.";
        }
        return "No se pudo procesar la solicitud.";
    }
}
