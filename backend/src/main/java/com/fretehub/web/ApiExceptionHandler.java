package com.fretehub.web;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> handle(ApiException ex) {
    return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
  public ResponseEntity<Map<String, String>> handleBadInput(Exception ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("message", "Dados invalidos na solicitacao."));
  }

  // So o pedido de frete tem @Version: outra pessoa respondeu antes.
  @ExceptionHandler(OptimisticLockingFailureException.class)
  public ResponseEntity<Map<String, String>> handleStaleFreight(Exception ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(Map.of("message", "O pedido foi alterado. Atualize a pagina e tente novamente."));
  }

  // Corrida entre a checagem e a gravacao (ex.: mesmo e-mail em dois cadastros).
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> handleIntegrity(Exception ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(Map.of("message", "Nao foi possivel salvar os dados. Atualize a pagina e tente novamente."));
  }
}
