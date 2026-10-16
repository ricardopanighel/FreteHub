package com.fretehub.api;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fretehub.freight.FreightOrder;
import com.fretehub.provider.ProviderRepository;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class FreightStatusApiTest extends ApiTestSupport {
  @Autowired ProviderRepository providers;

  private void patchStatus(String id, String token, String next, int expected) throws Exception {
    mockMvc.perform(patch("/api/admin/freights/" + id)
        .header(AUTHORIZATION, bearer(token))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("status", next))))
        .andExpect(status().is(expected));
  }

  @Test
  void adminCancelaPedidoPendente() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(patch("/api/admin/freights/" + id)
        .header(AUTHORIZATION, bearer(admin))
        .contentType(APPLICATION_JSON)
        .content(json(Map.of("status", "CANCELADO"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CANCELADO"));
  }

  @Test
  void adminAvancaPedidoAntigoAceito() throws Exception {
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    FreightOrder legacy = freights.findById("f-001").orElseThrow();
    legacy.setProvider(providers.findById("p-003").orElseThrow());
    freights.saveAndFlush(legacy);
    patchStatus("f-001", admin, "EM_ANDAMENTO", 200);
    patchStatus("f-001", admin, "CONCLUIDO", 200);
  }

  @Test
  void adminNaoPulaEtapa() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    String id = createFreight(client, "p-001");
    patchStatus(id, admin, "CONCLUIDO", 400);
  }

  @Test
  void clienteNaoMudaStatusPorRotaDeAdmin() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String id = createFreight(client, "p-001");
    patchStatus(id, client, "CANCELADO", 403);
  }

  @Test
  void clienteCancelaAntesDoAceite() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/freights/" + id + "/cancel")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CANCELADO"));
  }

  @Test
  void clienteNaoCancelaFreteEmAndamento() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    String driver = login(DRIVER_EMAIL, DRIVER_PASSWORD);
    String id = createFreight(client, "p-001");
    mockMvc.perform(post("/api/driver/freights/" + id + "/accept")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk());
    mockMvc.perform(post("/api/driver/freights/" + id + "/start")
        .header(AUTHORIZATION, bearer(driver)))
        .andExpect(status().isOk());
    mockMvc.perform(post("/api/freights/" + id + "/cancel")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value("Este pedido nao pode mais ser cancelado."));
  }

  @Test
  void clienteNaoCancelaDepoisDeConcluido() throws Exception {
    String client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
    mockMvc.perform(post("/api/freights/f-002/cancel")
        .header(AUTHORIZATION, bearer(client)))
        .andExpect(status().isConflict());
  }
}
