package com.fretehub.freight;

import com.fretehub.config.FreightProperties;
import com.fretehub.domain.Enums.FreightStatus;
import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ProviderType;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.VehicleType;
import com.fretehub.provider.CityNames;
import com.fretehub.provider.ContactInfo;
import com.fretehub.provider.ProviderProfile;
import com.fretehub.provider.ProviderRepository;
import com.fretehub.security.AuthUser;
import com.fretehub.security.CurrentUser;
import com.fretehub.security.Ids;
import com.fretehub.user.UserAccount;
import com.fretehub.user.UserRepository;
import com.fretehub.web.ApiException;
import com.fretehub.web.Dtos.ContactView;
import com.fretehub.web.Dtos.FreightInput;
import com.fretehub.web.Dtos.FreightStatusInput;
import com.fretehub.web.Dtos.FreightView;
import com.fretehub.web.Dtos.PriceInput;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FreightService {
  private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
  private static final BigDecimal MAX_PRICE = new BigDecimal("100000.00");

  private final FreightRepository freights;
  private final ProviderRepository providers;
  private final UserRepository users;
  private final FreightProperties properties;

  public FreightService(
      FreightRepository freights, ProviderRepository providers, UserRepository users,
      FreightProperties properties) {
    this.freights = freights;
    this.providers = providers;
    this.users = users;
    this.properties = properties;
  }

  @Transactional
  public FreightView create(FreightInput input) {
    if (input == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe os dados do pedido.");
    }
    AuthUser current = CurrentUser.get();
    String origin = required(input.origin(), "Informe a origem.");
    String destination = required(input.destination(), "Informe o destino.");
    String description = required(input.description(), "Descreva a carga.");
    String city = CityNames.city(required(input.city(), "Informe a cidade."));
    String phone = required(input.contactPhone(), "Informe seu telefone.");
    BigDecimal price = validPrice(input.priceOffered());
    if (description.length() < 10) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Descreva a carga com um pouco mais de detalhe.");
    }
    if (input.scheduledDate() == null || input.scheduledTime() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe a data e o horario.");
    }
    Instant scheduledAt = input.scheduledDate().atTime(input.scheduledTime())
        .atZone(ZONE).toInstant();
    Instant now = Instant.now();
    if (!scheduledAt.isAfter(now)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "A data e o horario devem estar no futuro.");
    }

    ProviderProfile provider = null;
    if (input.providerId() != null && !input.providerId().isBlank()) {
      provider = providers.findById(input.providerId())
          .filter(this::canReceiveNewFreight)
          .filter(found -> servesCity(found, city))
          .orElseThrow(() -> new ApiException(
              HttpStatus.BAD_REQUEST, "Motorista indisponivel para novas solicitacoes."));
    } else if (providers.findByStatus(ProviderStatus.APROVADO).stream()
        .noneMatch(found -> found.getType() == ProviderType.INTERNO
            && servesCity(found, city))) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Nao ha motoristas nesta cidade.");
    }

    UserAccount client = users.findById(current.id())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessao invalida ou expirada."));
    FreightOrder freight = new FreightOrder();
    freight.setId(Ids.next("f"));
    freight.setClient(client);
    freight.setProvider(provider);
    freight.setProviderName(provider == null ? null : provider.getName());
    freight.setOrigin(origin);
    freight.setDestination(destination);
    freight.setDescription(description);
    freight.setCity(city);
    freight.setScheduledAt(scheduledAt);
    freight.setContactPhone(phone);
    freight.setPriceOffered(price);
    freight.setVehicleType(parseEnum(input.vehicleType(), VehicleType.class));
    freight.setService(parseEnum(input.service(), ServiceTag.class));
    freight.setStatus(FreightStatus.PENDENTE);
    freight.setResponseDeadline(deadline(now));
    freight.setCreatedAt(now);
    freight.setUpdatedAt(now);
    return toView(freights.save(freight), false);
  }

  @Transactional
  public List<FreightView> listMine() {
    List<FreightOrder> orders = freights.findByClient_IdOrderByCreatedAtDesc(CurrentUser.get().id());
    return orders.stream().map(order -> {
      expireIfDue(order);
      return toView(order, false);
    }).toList();
  }

  @Transactional
  public List<FreightView> listAll() {
    return freights.findAllByOrderByCreatedAtDesc().stream().map(order -> {
      expireIfDue(order);
      return toView(order, true);
    }).toList();
  }

  @Transactional
  public List<FreightView> listDriverFreights() {
    ProviderProfile driver = findDriver();
    List<FreightOrder> visible = new ArrayList<>(
        freights.findByProvider_IdOrderByCreatedAtDesc(driver.getId()));
    visible.forEach(this::expireIfDue);
    if (canReceiveNewFreight(driver)) {
      for (FreightOrder order : freights.findByProviderIsNullAndStatusOrderByCreatedAtDesc(
          FreightStatus.PENDENTE)) {
        expireIfDue(order);
        if (order.getStatus() == FreightStatus.PENDENTE
            && servesCity(driver, order.getCity())) {
          visible.add(order);
        }
      }
    }
    visible.sort(Comparator.comparing(FreightOrder::getCreatedAt).reversed());
    return visible.stream().map(order -> toView(order, false)).toList();
  }

  // Uma rejeicao por prazo vencido precisa gravar EXPIRADO antes de devolver 409.
  @Transactional(noRollbackFor = ApiException.class)
  public FreightView accept(String id) {
    ProviderProfile driver = findDriver();
    FreightOrder freight = find(id);
    requirePending(freight);
    if (freight.getProvider() == null) {
      if (!canReceiveNewFreight(driver) || !servesCity(driver, freight.getCity())) {
        throw new ApiException(HttpStatus.FORBIDDEN, "Este pedido nao esta disponivel para voce.");
      }
      freight.setProvider(driver);
      freight.setProviderName(driver.getName());
    } else {
      requireAssignedDriver(freight, driver);
      requireApproved(driver);
    }
    freight.setStatus(FreightStatus.ACEITO);
    freight.setAgreedPrice(freight.getPriceOffered());
    freight.setResponseDeadline(null);
    freight.setUpdatedAt(Instant.now());
    freights.flush();
    return toView(freight, false);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public FreightView reject(String id) {
    ProviderProfile driver = findDriver();
    FreightOrder freight = find(id);
    requireAssignedDriver(freight, driver);
    requirePending(freight);
    requireApproved(driver);
    freight.setStatus(FreightStatus.RECUSADO);
    freight.setResponseDeadline(null);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, false);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public FreightView counterOffer(String id, PriceInput input) {
    ProviderProfile driver = findDriver();
    FreightOrder freight = find(id);
    requireAssignedDriver(freight, driver);
    requirePending(freight);
    requireApproved(driver);
    BigDecimal price = validPrice(input == null ? null : input.price());
    if (freight.getPriceOffered() != null
        && price.compareTo(freight.getPriceOffered()) == 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "A contraproposta deve ter outro valor.");
    }
    freight.setCounterPrice(price);
    freight.setStatus(FreightStatus.CONTRAPROPOSTA);
    Instant now = Instant.now();
    freight.setResponseDeadline(deadline(now));
    freight.setUpdatedAt(now);
    return toView(freight, false);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public FreightView acceptCounterOffer(String id) {
    FreightOrder freight = findOwned(id);
    expireIfDue(freight);
    requireStatus(freight, FreightStatus.CONTRAPROPOSTA);
    requireApproved(freight.getProvider());
    freight.setStatus(FreightStatus.ACEITO);
    freight.setAgreedPrice(freight.getCounterPrice());
    freight.setResponseDeadline(null);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, false);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public FreightView rejectCounterOffer(String id) {
    FreightOrder freight = findOwned(id);
    expireIfDue(freight);
    requireStatus(freight, FreightStatus.CONTRAPROPOSTA);
    freight.setStatus(FreightStatus.RECUSADO);
    freight.setResponseDeadline(null);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, false);
  }

  @Transactional
  public FreightView start(String id) {
    FreightOrder freight = find(id);
    requireAssignedDriver(freight, findDriver());
    requireStatus(freight, FreightStatus.ACEITO);
    freight.setStatus(FreightStatus.EM_ANDAMENTO);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, false);
  }

  @Transactional
  public FreightView complete(String id) {
    FreightOrder freight = find(id);
    requireAssignedDriver(freight, findDriver());
    requireStatus(freight, FreightStatus.EM_ANDAMENTO);
    freight.setStatus(FreightStatus.CONCLUIDO);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, false);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public FreightView cancel(String id) {
    FreightOrder freight = findOwned(id);
    expireIfDue(freight);
    if (freight.getStatus() != FreightStatus.PENDENTE
        && freight.getStatus() != FreightStatus.CONTRAPROPOSTA
        && freight.getStatus() != FreightStatus.ACEITO) {
      throw conflict("Este pedido nao pode mais ser cancelado.");
    }
    freight.setStatus(FreightStatus.CANCELADO);
    freight.setResponseDeadline(null);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, false);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public FreightView updateStatus(String id, FreightStatusInput input) {
    if (input == null || input.status() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o status.");
    }
    FreightOrder freight = find(id);
    expireIfDue(freight);
    FreightStatus requested = input.status();
    boolean cancellable = freight.getStatus() == FreightStatus.PENDENTE
        || freight.getStatus() == FreightStatus.CONTRAPROPOSTA
        || freight.getStatus() == FreightStatus.ACEITO
        || freight.getStatus() == FreightStatus.EM_ANDAMENTO;
    boolean externalSupport = freight.getProvider() != null
        && freight.getProvider().getType() == ProviderType.EXTERNO;
    boolean supportProgress = externalSupport
        && ((freight.getStatus() == FreightStatus.ACEITO
                && requested == FreightStatus.EM_ANDAMENTO)
            || (freight.getStatus() == FreightStatus.EM_ANDAMENTO
                && requested == FreightStatus.CONCLUIDO));
    if (!(requested == FreightStatus.CANCELADO && cancellable) && !supportProgress) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Esta mudanca de status nao e permitida.");
    }
    freight.setStatus(requested);
    freight.setResponseDeadline(null);
    freight.setUpdatedAt(Instant.now());
    return toView(freight, true);
  }

  private FreightOrder find(String id) {
    return freights.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Solicitacao nao encontrada."));
  }

  private FreightOrder findOwned(String id) {
    FreightOrder freight = find(id);
    if (!freight.getClient().getId().equals(CurrentUser.get().id())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Voce nao pode alterar este pedido.");
    }
    return freight;
  }

  private ProviderProfile findDriver() {
    return providers.findByUser_Id(CurrentUser.get().id())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Motorista nao encontrado."));
  }

  private boolean canReceiveNewFreight(ProviderProfile driver) {
    return driver.getType() == ProviderType.INTERNO
        && driver.getStatus() == ProviderStatus.APROVADO
        && driver.isDocumentsVerified()
        && driver.isAvailable();
  }

  private static boolean servesCity(ProviderProfile driver, String city) {
    return driver.getRegions().stream().anyMatch(region -> CityNames.matches(region, city));
  }

  private void requireAssignedDriver(FreightOrder freight, ProviderProfile driver) {
    if (freight.getProvider() == null) {
      throw conflict("Esta acao nao esta disponivel para pedidos da fila.");
    }
    if (!freight.getProvider().getId().equals(driver.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Este pedido nao pertence a voce.");
    }
  }

  private static void requireApproved(ProviderProfile driver) {
    if (driver == null || driver.getStatus() != ProviderStatus.APROVADO
        || !driver.isDocumentsVerified()) {
      throw conflict("O motorista nao esta aprovado para responder ao pedido.");
    }
  }

  private void requirePending(FreightOrder freight) {
    expireIfDue(freight);
    requireStatus(freight, FreightStatus.PENDENTE);
  }

  private static void requireStatus(FreightOrder freight, FreightStatus expected) {
    if (freight.getStatus() != expected) {
      throw conflict("Este pedido nao esta mais aguardando esta acao.");
    }
  }

  private void expireIfDue(FreightOrder freight) {
    if ((freight.getStatus() == FreightStatus.PENDENTE
        || freight.getStatus() == FreightStatus.CONTRAPROPOSTA)
        && freight.getResponseDeadline() != null
        && !Instant.now().isBefore(freight.getResponseDeadline())) {
      freight.setStatus(FreightStatus.EXPIRADO);
      freight.setResponseDeadline(null);
      freight.setUpdatedAt(Instant.now());
    }
  }

  private Instant deadline(Instant now) {
    return now.plusSeconds(Math.max(properties.responseMinutes(), 1) * 60);
  }

  private FreightView toView(FreightOrder freight, boolean admin) {
    boolean accepted = freight.getAgreedPrice() != null
        || freight.getStatus() == FreightStatus.ACEITO
        || freight.getStatus() == FreightStatus.EM_ANDAMENTO
        || freight.getStatus() == FreightStatus.CONCLUIDO;
    ContactView providerContacts = null;
    ContactView clientContact = null;
    if (accepted || admin) {
      if (freight.getProvider() != null) {
        ContactInfo contacts = freight.getProvider().getContacts();
        providerContacts = new ContactView(
            contacts.getPhone(), contacts.getWhatsapp(), admin ? contacts.getEmail() : null);
      }
      clientContact = new ContactView(
          freight.getContactPhone(), null, freight.getClient().getEmail());
    }
    return new FreightView(
        freight.getId(),
        freight.getClient().getId(),
        freight.getClient().getName(),
        freight.getProvider() == null ? null : freight.getProvider().getId(),
        freight.getProviderName(),
        freight.getOrigin(),
        freight.getDestination(),
        freight.getDescription(),
        freight.getCity(),
        freight.getScheduledAt(),
        admin || CurrentUser.find().map(user -> user.id().equals(freight.getClient().getId()))
            .orElse(false) ? freight.getContactPhone() : null,
        freight.getVehicleType(),
        freight.getService(),
        freight.getStatus(),
        freight.getPriceOffered(),
        freight.getCounterPrice(),
        freight.getAgreedPrice(),
        freight.getResponseDeadline(),
        providerContacts,
        clientContact,
        freight.getCreatedAt(),
        freight.getUpdatedAt());
  }

  private static BigDecimal validPrice(BigDecimal price) {
    if (price == null || price.compareTo(BigDecimal.ZERO) <= 0
        || price.compareTo(MAX_PRICE) > 0
        || price.stripTrailingZeros().scale() > 2) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe um valor valido de ate R$ 100.000,00.");
    }
    return price.setScale(2);
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

  private static ApiException conflict(String message) {
    return new ApiException(HttpStatus.CONFLICT, message);
  }
}
