package com.fretehub.api;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FreightStatusApiTest extends ApiTestSupport {

  private String createFreight(String clientToken) throws Exception {
    Map<String, Object> body = new HashMap<>();
    body.put("origin", "Santos - Centro");
    body.put("destination", "Sao Vicente - Centro");
    body.put("description", "Mudanca pequena com alguns moveis e caixas.");
    body.put("scheduledDate", "2030-01-01");
    String response = mockMvc
        .perform(post("/api/freights")
            .header(AUTHORIZATION, bearer(clientToken))
            .contentType(APPLICATION_JSON)
            .content(json(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ABERTA"))
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(response).get("id").asText();
  }

  private void patchStatus(String id, String token, String status, int expected) throws Exception {
    mockMvc
        .perform(patch("/api/admin/freights/" + id)
            .header(AUTHORIZATION, bearer(token))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("status", status))))
        .andExpect(status().is(expected));
  }

  @Test
  void adminAvancaUmPasso() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    String id = createFreight(client);

    mockMvc
        .perform(patch("/api/admin/freights/" + id)
            .header(AUTHORIZATION, bearer(admin))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("status", "EM_NEGOCIACAO"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("EM_NEGOCIACAO"));
  }

  @Test
  void transicaoInvalidaEhRejeitada() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    String id = createFreight(client);

    // ABERTA -> CONFIRMADA pula uma etapa.
    patchStatus(id, admin, "CONFIRMADA", 400);
  }

  @Test
  void clienteNaoMudaStatusPorRotaDeAdmin() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String id = createFreight(client);
    patchStatus(id, client, "EM_NEGOCIACAO", 403);
  }

  @Test
  void clienteCancelaAntesDaConfirmacao() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String id = createFreight(client);

    mockMvc
        .perform(post("/api/freights/" + id + "/cancel").header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CANCELADA"));
  }

  @Test
  void naoCancelaDepoisDeConfirmada() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    String id = createFreight(client);

    patchStatus(id, admin, "EM_NEGOCIACAO", 200);
    patchStatus(id, admin, "CONFIRMADA", 200);

    mockMvc
        .perform(post("/api/freights/" + id + "/cancel").header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void naoDonoNaoCancela() throws Exception {
    String owner = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String id = createFreight(owner);

    mockMvc
        .perform(post("/api/auth/register")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of(
                "name", "Outro Cliente",
                "email", "outro.cliente@example.com",
                "password", "segredo123"))))
        .andExpect(status().isOk());
    String intruder = login("outro.cliente@example.com", "segredo123");

    mockMvc
        .perform(post("/api/freights/" + id + "/cancel").header(AUTHORIZATION, bearer(intruder)))
        .andExpect(status().isForbidden());
  }
}
