package com.fretehub.security;

import com.fretehub.domain.Enums.UserRole;
import com.fretehub.web.ApiException;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {
  private CurrentUser() {}

  public static AuthUser get() {
    return find()
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessao invalida ou expirada."));
  }

  // Para rotas publicas, onde o login e opcional.
  public static Optional<AuthUser> find() {
    var authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof AuthUser user)) {
      return Optional.empty();
    }
    return Optional.of(user);
  }

  public static boolean isAdmin() {
    return find().map(user -> user.role() == UserRole.ADMIN).orElse(false);
  }
}
