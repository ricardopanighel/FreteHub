package com.fretehub.api;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.Test;

class AuthApiTest extends ApiTestSupport {

  @Test
  void registraClienteEDevolveToken() throws Exception {
    mockMvc
        .perform(post("/api/auth/register")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of(
                "name", "Novo Cliente",
                "email", "novo.cliente@example.com",
                "password", "segredo123"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token", notNullValue()))
        .andExpect(jsonPath("$.user.role").value("CLIENTE"))
        .andExpect(jsonPath("$.user.email").value("novo.cliente@example.com"));
  }

  @Test
  void naoRegistraEmailDuplicado() throws Exception {
    mockMvc
        .perform(post("/api/auth/register")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of(
                "name", "Outro",
                "email", CLIENT_EMAIL,
                "password", "segredo123"))))
        .andExpect(status().isConflict());
  }

  @Test
  void rejeitaSenhaCurta() throws Exception {
    mockMvc
        .perform(post("/api/auth/register")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of(
                "name", "Curto",
                "email", "curto@example.com",
                "password", "123"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void loginValidoDevolveToken() throws Exception {
    mockMvc
        .perform(post("/api/auth/login")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token", notNullValue()))
        .andExpect(jsonPath("$.user.role").value("ADMIN"));
  }

  @Test
  void loginComSenhaErradaRetorna401() throws Exception {
    mockMvc
        .perform(post("/api/auth/login")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("email", CLIENT_EMAIL, "password", "errada"))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void loginDeEmailInexistenteRetorna401() throws Exception {
    mockMvc
        .perform(post("/api/auth/login")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("email", "ninguem@example.com", "password", "qualquer1"))))
        .andExpect(status().isUnauthorized());
  }
}
