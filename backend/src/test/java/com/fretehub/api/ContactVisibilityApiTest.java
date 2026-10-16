package com.fretehub.api;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

class ContactVisibilityApiTest extends ApiTestSupport {

  @Test
  void catalogoEscondeContatoInternoEMostraExterno() throws Exception {
    mockMvc.perform(get("/api/providers/p-001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.type").value("INTERNO"))
        .andExpect(jsonPath("$.contacts").value(nullValue()));
    mockMvc.perform(get("/api/providers/p-003"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.type").value("EXTERNO"))
        .andExpect(jsonPath("$.contacts.phone").isString());
  }

  @Test
  void contatoApareceApenasDepoisDoAceite() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    JsonNode before = findMine(client, id);
    assertTrue(before.path("providerContacts").isNull());
    String driverBefore = mockMvc.perform(get("/api/driver/freights")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    for (JsonNode item : objectMapper.readTree(driverBefore)) {
      if (id.equals(item.path("id").asText())) {
        assertTrue(item.path("clientContact").isNull());
      }
    }

    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk());
    assertFalse(findMine(client, id).path("providerContacts").isNull());
    String driverAfter = mockMvc.perform(get("/api/driver/freights")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    for (JsonNode item : objectMapper.readTree(driverAfter)) {
      if (id.equals(item.path("id").asText())) {
        assertFalse(item.path("clientContact").isNull());
        return;
      }
    }
    fail("Pedido aceito nao apareceu para motorista.");
  }

  @Test
  void adminVeContatosDoMotorista() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    mockMvc.perform(get("/api/providers/p-001").header(AUTHORIZATION, bearer(admin)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contacts.whatsapp").isString());
  }

  private JsonNode findMine(String client, String id) throws Exception {
    String body = mockMvc.perform(get("/api/freights/mine")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    for (JsonNode freight : objectMapper.readTree(body)) {
      if (id.equals(freight.path("id").asText())) return freight;
    }
    throw new AssertionError("Pedido nao apareceu para cliente.");
  }
}
