package com.smartqueue.controller;

import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException exception) {
    String message = exception.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(error -> error.getField() + " " + error.getDefaultMessage())
        .orElse("Invalid request");
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  ResponseEntity<Map<String, String>> validation(ConstraintViolationException exception) {
    return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
  }

  @ExceptionHandler(RuntimeException.class)
  ResponseEntity<Map<String, String>> runtime(RuntimeException exception) {
    ResponseStatus status = AnnotationUtils.findAnnotation(exception.getClass(), ResponseStatus.class);
    if (status == null) {
      throw exception;
    }
    String message = exception.getMessage() == null ? status.reason() : exception.getMessage();
    return ResponseEntity.status(status.code()).body(Map.of("message", message));
  }
}
