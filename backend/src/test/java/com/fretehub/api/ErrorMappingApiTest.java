package com.fretehub.api;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class ErrorMappingApiTest extends ApiTestSupport {

  @Test
  void jsonMalformadoRetorna400ComMensagem() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    mockMvc.perform(post("/api/freights")
        .header(AUTHORIZATION, bearer(client))
        .contentType(APPLICATION_JSON)
        .content("{invalid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").isString());
  }

  @Test
  void enumInvalidoRetorna400ComMensagem() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    mockMvc.perform(patch("/api/admin/providers/p-001")
        .header(AUTHORIZATION, bearer(admin))
        .contentType(APPLICATION_JSON)
        .content("{\"status\":\"DESCONHECIDO\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").isString());
  }

  @Test
  void parametroInvalidoRetorna400ComMensagem() throws Exception {
    mockMvc.perform(get("/api/providers").param("page", "invalid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").isString());
  }
}
