package com.fretehub.user;

import com.fretehub.domain.Enums.UserRole;
import com.fretehub.security.Ids;
import com.fretehub.security.JwtService;
import com.fretehub.web.ApiException;
import com.fretehub.web.Dtos.AuthResponse;
import com.fretehub.web.Dtos.LoginInput;
import com.fretehub.web.Dtos.RegisterInput;
import com.fretehub.web.Dtos.UserView;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginInput input) {
    if (input.password() == null || input.password().isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha invalidos.");
    }
    String email = normalizeEmail(input.email());
    UserAccount user = users.findByEmailIgnoreCase(email)
        .filter(found -> passwordEncoder.matches(input.password(), found.getPasswordHash()))
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha invalidos."));
    return response(user);
  }

  @Transactional
  public AuthResponse register(RegisterInput input) {
    String name = required(input.name(), "Informe o nome.");
    String email = normalizeEmail(input.email());
    if (input.password() == null || input.password().length() < 6) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "A senha deve ter ao menos 6 caracteres.");
    }
    if (users.existsByEmailIgnoreCase(email)) {
      throw new ApiException(HttpStatus.CONFLICT, "Ja existe uma conta com este e-mail.");
    }
    UserAccount user = new UserAccount(
        Ids.next("u"),
        name,
        email,
        passwordEncoder.encode(input.password()),
        UserRole.CLIENTE);
    users.save(user);
    return response(user);
  }

  private AuthResponse response(UserAccount user) {
    return new AuthResponse(
        new UserView(user.getId(), user.getName(), user.getEmail(), user.getRole()),
        jwtService.createToken(user));
  }

  private static String normalizeEmail(String email) {
    if (email == null || email.isBlank() || !email.contains("@")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe um e-mail valido.");
    }
    return email.trim().toLowerCase();
  }

  private static String required(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, message);
    }
    return value.trim();
  }
}
