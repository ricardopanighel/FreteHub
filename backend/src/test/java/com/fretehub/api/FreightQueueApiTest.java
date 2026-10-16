package com.fretehub.api;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FreightQueueApiTest extends ApiTestSupport {

  private boolean inboxContains(String token, String id) throws Exception {
    String body = mockMvc.perform(get("/api/driver/freights")
        .header(AUTHORIZATION, bearer(token)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    for (JsonNode freight : objectMapper.readTree(body)) {
      if (id.equals(freight.path("id").asText())) return true;
    }
    return false;
  }

  @Test
  void filaComparaCidadeSemAcentoEMaiusculas() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String carlos = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    Map<String, Object> input = freightInput(null);
    input.put("city", "SÁNTOS");
    String id = createQueue(client, input);
    assertTrue(inboxContains(carlos, id));

    input.put("city", "Praia Grande");
    input.put("origin", "Praia Grande - Centro");
    String otherId = createQueue(client, input);
    assertFalse(inboxContains(carlos, otherId));
  }

  @Test
  void filaNaoMostraContatoAntesDoAceite() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String carlos = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, null);
    String body = mockMvc.perform(get("/api/driver/freights")
        .header(AUTHORIZATION, bearer(carlos)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    for (JsonNode freight : objectMapper.readTree(body)) {
      if (id.equals(freight.path("id").asText())) {
        assertTrue(freight.path("clientContact").isNull());
        return;
      }
    }
    fail("Pedido nao apareceu na fila.");
  }

  @Test
  void primeiroMotoristaFicaComPedidoDaFila() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String carlos = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String ana = login("ana@fretehub.com", DRIVER_PASSWORD);
    String id = createFreight(client, null);
    mockMvc.perform(patch("/api/driver/me/availability")
        .header(AUTHORIZATION, bearer(ana))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("available", true))))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(carlos)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.providerId").value("p-001"));
    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(ana)))
        .andExpect(status().isConflict());
  }

  @Test
  void motoristaIndisponivelNaoVeFila() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String ana = login("ana@fretehub.com", DRIVER_PASSWORD);
    String id = createFreight(client, null);
    assertFalse(inboxContains(ana, id));
  }

  private String createQueue(String client, Map<String, Object> input) throws Exception {
    String response = mockMvc.perform(post("/api/freights")
        .header(AUTHORIZATION, bearer(client))
        .contentType(APPLICATION_JSON)
        .content(json(input)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    return objectMapper.readTree(response).path("id").asText();
  }
}
