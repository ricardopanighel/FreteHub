package com.fretehub.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class CorsApiTest extends ApiTestSupport {

  @Test
  void liberaOFrontConfigurado() throws Exception {
    mockMvc
        .perform(options("/api/auth/login")
            .header("Origin", "http://localhost:5173")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "content-type"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
  }

  @Test
  void recusaOutraOrigem() throws Exception {
    mockMvc
        .perform(options("/api/auth/login")
            .header("Origin", "https://outro-site.example.com")
            .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden());
  }
}
