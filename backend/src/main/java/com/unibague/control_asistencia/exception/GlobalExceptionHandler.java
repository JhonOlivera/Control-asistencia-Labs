package com.unibague.control_asistencia.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
}
