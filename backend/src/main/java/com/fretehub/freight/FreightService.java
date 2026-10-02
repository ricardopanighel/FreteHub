package com.fretehub.freight;

import com.fretehub.domain.Enums.FreightStatus;
import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.VehicleType;
import com.fretehub.provider.ProviderProfile;
import com.fretehub.provider.ProviderRepository;
import com.fretehub.security.AuthUser;
import com.fretehub.security.CurrentUser;
import com.fretehub.security.Ids;
import com.fretehub.user.UserAccount;
import com.fretehub.user.UserRepository;
import com.fretehub.web.ApiException;
import com.fretehub.web.Dtos.FreightInput;
import com.fretehub.web.Dtos.FreightStatusInput;
import com.fretehub.web.Dtos.FreightView;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FreightService {

  private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
  private static final Map<FreightStatus, Set<FreightStatus>> TRANSITIONS = Map.of(
      FreightStatus.ABERTA, EnumSet.of(FreightStatus.EM_NEGOCIACAO, FreightStatus.CANCELADA),
      FreightStatus.EM_NEGOCIACAO, EnumSet.of(FreightStatus.CONFIRMADA, FreightStatus.CANCELADA),
      FreightStatus.CONFIRMADA, EnumSet.of(FreightStatus.CONCLUIDA, FreightStatus.CANCELADA),
      FreightStatus.CONCLUIDA, Set.of(),
      FreightStatus.CANCELADA, Set.of());

  private final FreightRepository freights;
  private final ProviderRepository providers;
  private final UserRepository users;

  public FreightService(
      FreightRepository freights, ProviderRepository providers, UserRepository users) {
    this.freights = freights;
    this.providers = providers;
    this.users = users;
  }

  @Transactional
  public FreightView create(FreightInput input) {
    AuthUser current = CurrentUser.get();
    String origin = required(input.origin(), "Informe a origem.");
    String destination = required(input.destination(), "Informe o destino.");
    String description = required(input.description(), "Descreva a carga.");
    if (description.length() < 10) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Descreva a carga com um pouco mais de detalhe.");
    }
    if (input.scheduledDate() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe a data desejada.");
    }
    if (input.scheduledDate().isBefore(LocalDate.now(ZONE))) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "A data nao pode estar no passado.");
    }

    ProviderProfile provider = null;
    if (input.providerId() != null && !input.providerId().isBlank()) {
      provider = providers.findById(input.providerId())
          .filter(found -> found.getStatus() == ProviderStatus.APROVADO)
          .orElseThrow(() -> new ApiException(
              HttpStatus.BAD_REQUEST, "Prestador indisponivel para novas solicitacoes."));
    }

    UserAccount client = users.findById(current.id())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessao invalida ou expirada."));

    Instant now = Instant.now();
    FreightOrder freight = new FreightOrder();
    freight.setId(Ids.next("f"));
    freight.setClient(client);
    freight.setProvider(provider);
    freight.setProviderName(provider == null ? null : provider.getName());
    freight.setOrigin(origin);
    freight.setDestination(destination);
    freight.setDescription(description);
    freight.setScheduledDate(input.scheduledDate());
    freight.setVehicleType(parseEnum(input.vehicleType(), VehicleType.class));
    freight.setService(parseEnum(input.service(), ServiceTag.class));
    freight.setStatus(FreightStatus.ABERTA);
    freight.setCreatedAt(now);
    freight.setUpdatedAt(now);
    return toView(freights.save(freight));
  }

  @Transactional(readOnly = true)
  public List<FreightView> listMine() {
    return freights.findByClient_IdOrderByCreatedAtDesc(CurrentUser.get().id()).stream()
        .map(this::toView)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<FreightView> listAll() {
    return freights.findAllByOrderByCreatedAtDesc().stream().map(this::toView).toList();
  }

  @Transactional
  public FreightView updateStatus(String id, FreightStatusInput input) {
    if (input.status() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o status.");
    }
    FreightOrder freight = find(id);
    if (!TRANSITIONS.get(freight.getStatus()).contains(input.status())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Esta mudanca de status nao e permitida.");
    }
    freight.setStatus(input.status());
    freight.setUpdatedAt(Instant.now());
    return toView(freight);
  }

  @Transactional
  public FreightView cancel(String id) {
    AuthUser current = CurrentUser.get();
    FreightOrder freight = find(id);
    if (!freight.getClient().getId().equals(current.id())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Voce nao pode cancelar este pedido.");
    }
    if (freight.getStatus() != FreightStatus.ABERTA
        && freight.getStatus() != FreightStatus.EM_NEGOCIACAO) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Este pedido nao pode mais ser cancelado.");
    }
    freight.setStatus(FreightStatus.CANCELADA);
    freight.setUpdatedAt(Instant.now());
    return toView(freight);
  }

  private FreightOrder find(String id) {
    return freights.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Solicitacao nao encontrada."));
  }

  private FreightView toView(FreightOrder freight) {
    return new FreightView(
        freight.getId(),
        freight.getClient().getId(),
        freight.getClient().getName(),
        freight.getProvider() == null ? null : freight.getProvider().getId(),
        freight.getProviderName(),
        freight.getOrigin(),
        freight.getDestination(),
        freight.getDescription(),
        freight.getScheduledDate(),
        freight.getVehicleType(),
        freight.getService(),
        freight.getStatus(),
        freight.getCreatedAt(),
        freight.getUpdatedAt());
  }

  private static String required(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, message);
    }
    return value.trim();
  }

  private static <E extends Enum<E>> E parseEnum(String raw, Class<E> type) {
    if (raw == null || raw.isBlank()) return null;
    try {
      return Enum.valueOf(type, raw);
    } catch (IllegalArgumentException ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Valor invalido: " + raw);
    }
  }
}
