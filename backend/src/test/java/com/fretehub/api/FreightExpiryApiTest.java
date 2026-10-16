package com.fretehub.api;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FreightExpiryApiTest extends ApiTestSupport {

  @Test
  void pedidoVencidoApareceExpiradoENaoPodeSerAceito() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    expire(id);
    mockMvc.perform(get("/api/freights/mine").header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("EXPIRADO"));
    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isConflict());
  }

  @Test
  void contrapropostaVencidaNaoPodeSerAceita() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/driver/freights/" + id + "/counter-offer")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("price", 220))))
        .andExpect(status().isOk());
    expire(id);
    mockMvc.perform(post("/api/freights/" + id + "/counter-offer/accept")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isConflict());
  }

  @Test
  void pedidoVencidoSaiDaFila() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, null);
    expire(id);
    String body = mockMvc.perform(get("/api/driver/freights")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    for (JsonNode freight : objectMapper.readTree(body)) {
      assertNotEquals(id, freight.path("id").asText());
    }
  }

  @Test
  void pedidoAceitoNaoExpira() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk());
    expire(id);
    mockMvc.perform(get("/api/freights/mine").header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("ACEITO"));
  }
}
