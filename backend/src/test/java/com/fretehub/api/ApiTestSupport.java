package com.fretehub.api;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fretehub.freight.FreightOrder;
import com.fretehub.freight.FreightRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
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
  protected static final String DRIVER_EMAIL = "motorista@fretehub.com";
  protected static final String DRIVER_PASSWORD = "motorista123";

  @Autowired protected MockMvc mockMvc;
  @Autowired protected ObjectMapper objectMapper;
  @Autowired protected FreightRepository freights;

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

  protected Map<String, Object> freightInput(String providerId) {
    Map<String, Object> body = new HashMap<>();
    if (providerId != null) body.put("providerId", providerId);
    body.put("city", "Santos");
    body.put("origin", "Santos - Gonzaga");
    body.put("destination", "Sao Vicente - Centro");
    body.put("description", "Mudanca pequena com alguns moveis e caixas.");
    body.put("scheduledDate", LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2).toString());
    body.put("scheduledTime", "10:30");
    body.put("contactPhone", "+55 13 99999-9876");
    body.put("priceOffered", 180.50);
    return body;
  }

  protected String createFreight(String clientToken, String providerId) throws Exception {
    String response = mockMvc
        .perform(post("/api/freights")
            .header("Authorization", bearer(clientToken))
            .contentType(APPLICATION_JSON)
            .content(json(freightInput(providerId))))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(response).get("id").asText();
  }

  protected void expire(String id) {
    FreightOrder freight = freights.findById(id).orElseThrow();
    freight.setResponseDeadline(Instant.now().minusSeconds(60));
    freights.saveAndFlush(freight);
  }
}
