package com.fretehub.api;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base dos testes de API: sobe o contexto completo com MockMvc sobre o perfil
 * de teste (H2). Cada metodo roda em transacao revertida ao final, entao os
 * dados de seed (admin, cliente, prestadores) persistem e as mutacoes nao.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
abstract class ApiTestSupport {

  protected static final String ADMIN_EMAIL = "admin@fretehub.com";
  protected static final String ADMIN_PASSWORD = "admin123";
  protected static final String CLIENT_EMAIL = "cliente@fretehub.com";
  protected static final String CLIENT_PASSWORD = "cliente123";

  @Autowired protected MockMvc mockMvc;
  @Autowired protected ObjectMapper objectMapper;

  protected String json(Object value) throws Exception {
    return objectMapper.writeValueAsString(value);
  }

  protected String login(String email, String password) throws Exception {
    String response = mockMvc
        .perform(post("/api/auth/login")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("email", email, "password", password))))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(response).get("token").asText();
  }

  protected String bearer(String token) {
    return "Bearer " + token;
  }
}
