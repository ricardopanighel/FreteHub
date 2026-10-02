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

class ProviderCurationApiTest extends ApiTestSupport {

  // O seed traz 4 prestadores APROVADO e 2 PENDENTE.
  private static final int SEED_APPROVED = 4;
  private static final int SEED_TOTAL = 6;
  private static final String PENDING_PROVIDER = "p-005";
  private static final String APPROVED_WITH_NOTE = "p-001";

  @Test
  void catalogoPublicoListaApenasAprovados() throws Exception {
    mockMvc
        .perform(get("/api/providers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(SEED_APPROVED));
  }

  @Test
  void perfilPublicoDePendenteRetorna404() throws Exception {
    mockMvc
        .perform(get("/api/providers/" + PENDING_PROVIDER))
        .andExpect(status().isNotFound());
  }

  @Test
  void clienteLogadoTambemNaoVePendente() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    mockMvc
        .perform(get("/api/providers/" + PENDING_PROVIDER).header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isNotFound());
  }

  @Test
  void perfilPublicoNaoExpoeNotaInterna() throws Exception {
    // p-001 e aprovado e tem documentNote no seed.
    mockMvc
        .perform(get("/api/providers/" + APPROVED_WITH_NOTE))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.documentNote").doesNotExist());
  }

  @Test
  void catalogoNaoExpoeNotaInterna() throws Exception {
    mockMvc
        .perform(get("/api/providers").param("search", "Carlos"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].id").value(APPROVED_WITH_NOTE))
        .andExpect(jsonPath("$.items[0].documentNote").doesNotExist());
  }

  @Test
  void adminVePerfilPendenteComNota() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    mockMvc
        .perform(get("/api/providers/" + PENDING_PROVIDER).header(AUTHORIZATION, bearer(admin)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("PENDENTE"))
        .andExpect(jsonPath("$.documentNote").value("Aguardando envio do CRLV."));
  }

  @Test
  void naoAvaliaPrestadorPendente() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    mockMvc
        .perform(post("/api/providers/" + PENDING_PROVIDER + "/reviews")
            .header(AUTHORIZATION, bearer(client))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("rating", 5, "comment", "Tentando avaliar pendente."))))
        .andExpect(status().isNotFound());
  }

  @Test
  void adminEnxergaTodosOsPrestadores() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    mockMvc
        .perform(get("/api/admin/providers").header(AUTHORIZATION, bearer(admin)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(SEED_TOTAL));
  }

  @Test
  void aprovarPendentePublicaNoCatalogo() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    mockMvc
        .perform(patch("/api/admin/providers/" + PENDING_PROVIDER)
            .header(AUTHORIZATION, bearer(admin))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("status", "APROVADO"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("APROVADO"));

    mockMvc
        .perform(get("/api/providers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(SEED_APPROVED + 1));
  }

  @Test
  void clienteNaoPodeCurar() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    mockMvc
        .perform(patch("/api/admin/providers/" + PENDING_PROVIDER)
            .header(AUTHORIZATION, bearer(client))
            .contentType(APPLICATION_JSON)
            .content(json(Map.of("status", "APROVADO"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void cadastroPublicoEntraComoPendente() throws Exception {
    mockMvc
        .perform(post("/api/providers")
            .contentType(APPLICATION_JSON)
            .content(json(Map.ofEntries(
                Map.entry("name", "Transportes Teste"),
                Map.entry("headline", "Fretes de teste na Baixada"),
                Map.entry("bio", ""),
                Map.entry("vehicleType", "VAN"),
                Map.entry("vehicleDescription", "Van de teste"),
                Map.entry("regions", List.of("Santos")),
                Map.entry("services", List.of("FRETE_PEQUENO")),
                Map.entry("contacts", Map.of("whatsapp", "+55 13 90000-0000"))))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("PENDENTE"));

    // Nao aparece no catalogo publico ate ser aprovado.
    mockMvc
        .perform(get("/api/providers"))
        .andExpect(jsonPath("$.total").value(SEED_APPROVED));
  }

  @Test
  void cadastroSemContatoEhRejeitado() throws Exception {
    mockMvc
        .perform(post("/api/providers")
            .contentType(APPLICATION_JSON)
            .content(json(Map.ofEntries(
                Map.entry("name", "Sem Contato"),
                Map.entry("headline", "Sem canal"),
                Map.entry("bio", ""),
                Map.entry("vehicleType", "MOTO"),
                Map.entry("vehicleDescription", ""),
                Map.entry("regions", List.of("Santos")),
                Map.entry("services", List.of("FRETE_PEQUENO")),
                Map.entry("contacts", Map.of())))))
        .andExpect(status().isBadRequest());
  }
}
