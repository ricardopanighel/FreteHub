package com.fretehub.api;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

class FreightFlowApiTest extends ApiTestSupport {

  private void action(String path, String token, int expected) throws Exception {
    mockMvc.perform(post(path).header(AUTHORIZATION, bearer(token)))
        .andExpect(status().is(expected));
  }

  @Test
  void motoristaAceitaIniciaEConclui() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");

    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ACEITO"))
        .andExpect(jsonPath("$.agreedPrice").value(180.5));
    mockMvc.perform(post("/api/driver/freights/" + id + "/start")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"));
    mockMvc.perform(post("/api/driver/freights/" + id + "/complete")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CONCLUIDO"));
  }

  @Test
  void motoristaRecusaPedidoDireto() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/driver/freights/" + id + "/reject")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("RECUSADO"));
    action("/api/driver/freights/" + id + "/accept", driver, 409);
  }

  @Test
  void clienteAceitaContrapropostaUmaVez() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/driver/freights/" + id + "/counter-offer")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("price", 220.00))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CONTRAPROPOSTA"));
    mockMvc.perform(post("/api/driver/freights/" + id + "/counter-offer")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("price", 230))))
        .andExpect(status().isConflict());
    mockMvc.perform(post("/api/freights/" + id + "/counter-offer/accept")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.agreedPrice").value(220.0));
  }

  @Test
  void clienteRecusaContraproposta() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/driver/freights/" + id + "/counter-offer")
        .header(AUTHORIZATION, bearer(driver))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("price", 210))))
        .andExpect(status().isOk());
    mockMvc.perform(post("/api/freights/" + id + "/counter-offer/reject")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("RECUSADO"));
  }

  @Test
  void motoristaInativoNaoRespondePedidoRecebido() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(patch("/api/admin/providers/p-001")
        .header(AUTHORIZATION, bearer(admin))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("status", "INATIVO"))))
        .andExpect(status().isOk());
    action("/api/driver/freights/" + id + "/accept", driver, 409);
  }

  @Test
  void apenasDonoEMotoristaAlvoAtuam() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String id = createFreight(client, "p-001");
    String ana = login("ana@fretehub.com", DRIVER_PASSWORD);
    action("/api/driver/freights/" + id + "/accept", ana, 403);
    mockMvc.perform(post("/api/auth/register")
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("name", "Outro Cliente", "email", "outro@example.com",
            "password", "segredo123"))))
        .andExpect(status().isOk());
    action("/api/freights/" + id + "/cancel", login("outro@example.com", "segredo123"), 403);
  }

  @Test
  void criacaoValidaOfertaTelefoneDataEAlvo() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    Map<String, Object> input = freightInput("p-001");
    input.put("priceOffered", 0);
    createInvalid(client, input);
    input.put("priceOffered", 180);
    input.put("contactPhone", "");
    createInvalid(client, input);
    input.put("contactPhone", "+55 13 99999-9876");
    input.put("scheduledDate", LocalDate.now(ZoneId.of("America/Sao_Paulo")).minusDays(1).toString());
    createInvalid(client, input);
    input.put("scheduledDate", LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2).toString());
    input.put("providerId", "p-003");
    createInvalid(client, input);
    input.put("providerId", "p-002");
    createInvalid(client, input);
  }

  @Test
  void criacaoExigeCidadeAtendidaPorMotoristaDoApp() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    Map<String, Object> input = freightInput(null);
    input.put("city", " ");
    createInvalid(client, input)
        .andExpect(jsonPath("$.message").value("Informe a cidade."));
    // Guaruja so tem motorista de contato direto no seed.
    input.put("city", "Guaruja");
    createInvalid(client, input)
        .andExpect(jsonPath("$.message").value("Nao ha motoristas nesta cidade."));
  }

  @Test
  void motoristaNaoCriaPedido() throws Exception {
    mockMvc.perform(post("/api/freights")
        .header(AUTHORIZATION, bearer(login(DRIVER_EMAIL, DRIVER_PASSWORD)))
        .contentType(APPLICATION_JSON)
        .content(json(freightInput("p-001"))))
        .andExpect(status().isForbidden());
  }

  private ResultActions createInvalid(String client, Map<String, Object> input) throws Exception {
    return mockMvc.perform(post("/api/freights")
        .header(AUTHORIZATION, bearer(client))
        .contentType(APPLICATION_JSON)
        .content(json(input)))
        .andExpect(status().isBadRequest());
  }
}
