package com.fretehub.api;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DriverAccountApiTest extends ApiTestSupport {

  private Map<String, Object> signup(Map<String, Object> contacts, String email) {
    return Map.of(
        "email", email,
        "password", "segredo123",
        "provider", Map.of(
            "name", "Motorista Novo",
            "headline", "Fretes em Santos",
            "bio", "Atendimento local.",
            "vehicleType", "VAN",
            "vehicleDescription", "Van com bau",
            "regions", List.of("Santos - Gonzaga"),
            "services", List.of("FRETE_PEQUENO"),
            "contacts", contacts));
  }

  @Test
  void cadastroCriaContaEPerfilPendente() throws Exception {
    mockMvc.perform(post("/api/auth/register-driver")
        .contentType(APPLICATION_JSON)
        .content(json(signup(Map.of("phone", "+55 13 99999-1000"), "novo.motorista@example.com"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isString())
        .andExpect(jsonPath("$.user.role").value("MOTORISTA"));

    mockMvc.perform(get("/api/providers").param("search", "Motorista Novo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(0));
  }

  @Test
  void cadastroRecusaEmailDuplicadoETelefoneAusente() throws Exception {
    mockMvc.perform(post("/api/auth/register-driver")
        .contentType(APPLICATION_JSON)
        .content(json(signup(Map.of("phone", "+55 13 99999-1000"), CLIENT_EMAIL))))
        .andExpect(status().isConflict());
    mockMvc.perform(post("/api/auth/register-driver")
        .contentType(APPLICATION_JSON)
        .content(json(signup(Map.of("email", "contato@example.com"), "novo.motorista@example.com"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void motoristaAprovadoLigaDisponibilidade() throws Exception {
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    mockMvc.perform(patch("/api/driver/me/availability")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("available", false))))
        .andExpect(status().isOk());
    mockMvc.perform(patch("/api/driver/me/availability")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("available", true))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.available").value(true));
  }

  @Test
  void motoristaPendenteNaoFicaDisponivel() throws Exception {
    String driver = login("pedro@fretehub.com", DRIVER_PASSWORD);
    mockMvc.perform(patch("/api/driver/me/availability")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("available", true))))
        .andExpect(status().isConflict());
  }

  @Test
  void sairDaAprovacaoDesligaDisponibilidade() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    mockMvc.perform(patch("/api/admin/providers/p-001")
        .header(AUTHORIZATION, bearer(admin))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("status", "INATIVO"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.available").value(false));
  }

  @Test
  void apenasMotoristaAcessaPainel() throws Exception {
    mockMvc.perform(get("/api/driver/me")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/api/driver/me")
        .header(AUTHORIZATION, bearer(login(CLIENT_EMAIL, CLIENT_PASSWORD))))
        .andExpect(status().isForbidden());
  }
}
