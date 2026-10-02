package com.fretehub.web;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> handle(ApiException ex) {
    return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
  }
}
