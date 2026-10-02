package com.fretehub.api;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ReviewApiTest extends ApiTestSupport {

  // Prestador aprovado e sem avaliacoes no seed.
  private static final String PROVIDER = "p-003";

  private void review(String token, int rating, String comment, int expected) throws Exception {
    mockMvc
        .perform(post("/api/providers/" + PROVIDER + "/reviews")
            .header(AUTHORIZATION, bearer(token))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("rating", rating, "comment", comment))))
        .andExpect(status().is(expected));
  }

  @Test
  void clienteAvaliaUmaVez() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    mockMvc
        .perform(post("/api/providers/" + PROVIDER + "/reviews")
            .header(AUTHORIZATION, bearer(client))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("rating", 5, "comment", "Servico excelente, recomendo."))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.reviews.length()").value(1));
  }

  @Test
  void mesmoClienteNaoAvaliaDuasVezes() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    review(client, 5, "Primeira avaliacao do cliente.", 200);
    review(client, 4, "Tentativa de segunda avaliacao.", 409);
  }

  @Test
  void clientesDiferentesPodemAvaliar() throws Exception {
    String first = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    review(first, 5, "Avaliacao do primeiro cliente.", 200);

    mockMvc
        .perform(post("/api/auth/register")
            .contentType(APPLICATION_JSON)
            .content(json(Map.of(
                "name", "Segundo Cliente",
                "email", "segundo.cliente@example.com",
                "password", "segredo123"))))
        .andExpect(status().isOk());
    String second = login("segundo.cliente@example.com", "segredo123");
    review(second, 4, "Avaliacao do segundo cliente.", 200);
  }

  @Test
  void notaForaDoIntervaloEhRejeitada() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    review(client, 6, "Nota invalida.", 400);
  }
}
