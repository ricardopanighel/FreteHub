package com.fretehub.user;

import com.fretehub.web.Dtos.AuthResponse;
import com.fretehub.web.Dtos.LoginInput;
import com.fretehub.web.Dtos.RegisterInput;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody LoginInput input) {
    return authService.login(input);
  }

  @PostMapping("/register")
  public AuthResponse register(@RequestBody RegisterInput input) {
    return authService.register(input);
  }
}
