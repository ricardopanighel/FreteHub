package com.fretehub.provider;

import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ProviderType;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.user.UserAccount;
import com.fretehub.security.CurrentUser;
import com.fretehub.security.Ids;
import com.fretehub.web.ApiException;
import com.fretehub.web.Dtos.ContactInput;
import com.fretehub.web.Dtos.ContactView;
import com.fretehub.web.Dtos.ProviderInput;
import com.fretehub.web.Dtos.ProviderPage;
import com.fretehub.web.Dtos.ProviderStatusInput;
import com.fretehub.web.Dtos.ProviderView;
import com.fretehub.web.Dtos.ReviewInput;
import com.fretehub.web.Dtos.ReviewView;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProviderService {

  private static final String DEFAULT_PHOTO =
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=70";

  private final ProviderRepository providers;

  public ProviderService(ProviderRepository providers) {
    this.providers = providers;
  }

  @Transactional(readOnly = true)
  public ProviderPage listPublic(
      String search, String vehicleType, String region, String service,
      ProviderType type, Boolean available, String city, int page, int pageSize) {
    int safePage = Math.max(page, 1);
    int safeSize = pageSize <= 0 ? 9 : Math.min(pageSize, 50);
    String term = CityNames.normalize(search);
    String regionTerm = CityNames.normalize(region);

    List<ProviderView> filtered = providers.findByStatus(ProviderStatus.APROVADO).stream()
        .filter(provider -> vehicleType == null || vehicleType.isBlank()
            || provider.getVehicleType().name().equals(vehicleType))
        .filter(provider -> service == null || service.isBlank()
            || provider.getServices().stream().anyMatch(tag -> tag.name().equals(service)))
        .filter(provider -> regionTerm.isBlank()
            || provider.getRegions().stream().anyMatch(item -> CityNames.normalize(item).contains(regionTerm)))
        .filter(provider -> type == null || provider.getType() == type)
        .filter(provider -> available == null || provider.isAvailable() == available)
        .filter(provider -> city == null || city.isBlank() || provider.getRegions().stream()
            .anyMatch(item -> CityNames.matches(item, city)))
        .filter(provider -> term.isBlank() || CityNames.normalize(haystack(provider)).contains(term))
        .sorted(Comparator.comparing(ProviderProfile::getName, String.CASE_INSENSITIVE_ORDER))
        .map(this::toPublicView)
        .toList();

    int from = Math.min((safePage - 1) * safeSize, filtered.size());
    int to = Math.min(from + safeSize, filtered.size());
    return new ProviderPage(filtered.subList(from, to), filtered.size(), safePage, safeSize);
  }

  // Perfil publico: so motoristas aprovados, sem a nota interna. A equipe
  // (ADMIN logado) ve qualquer status e a nota, para revisar cadastros.
  @Transactional(readOnly = true)
  public ProviderView get(String id) {
    if (CurrentUser.isAdmin()) {
      return toAdminView(find(id));
    }
    ProviderProfile provider = findApproved(id);
    boolean ownProfile = CurrentUser.find()
        .map(user -> provider.getUser() != null && provider.getUser().getId().equals(user.id()))
        .orElse(false);
    return ownProfile ? toOwnView(provider) : toPublicView(provider);
  }

  @Transactional(readOnly = true)
  public List<String> listRegions() {
    return providers.findByStatus(ProviderStatus.APROVADO).stream()
        .flatMap(provider -> provider.getRegions().stream())
        .distinct()
        .sorted(Comparator.comparing(CityNames::normalize))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<String> listCities() {
    return providers.findByStatus(ProviderStatus.APROVADO).stream()
        .filter(provider -> provider.getType() == ProviderType.INTERNO)
        .flatMap(provider -> provider.getRegions().stream())
        .map(CityNames::city)
        .filter(city -> !city.isBlank())
        .collect(java.util.stream.Collectors.toMap(
            CityNames::normalize, city -> city, (first, second) -> first))
        .values().stream()
        .sorted(Comparator.comparing(CityNames::normalize))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ProviderView> listAll() {
    return providers.findAllByOrderByCreatedAtDesc().stream().map(this::toAdminView).toList();
  }

  @Transactional
  public ProviderView create(ProviderInput input) {
    return toPublicView(createProfile(input, null, ProviderType.EXTERNO));
  }

  @Transactional
  public ProviderView createInternal(ProviderInput input, UserAccount user) {
    return toAdminView(createProfile(input, user, ProviderType.INTERNO));
  }

  private ProviderProfile createProfile(ProviderInput input, UserAccount user, ProviderType type) {
    if (input == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe os dados do motorista.");
    }
    if (input.name() == null || input.name().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o nome.");
    }
    if (input.headline() == null || input.headline().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe uma chamada curta.");
    }
    if (input.vehicleType() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Selecione o tipo de veiculo.");
    }
    List<String> regions = input.regions() == null
        ? List.of()
        : input.regions().stream().map(String::trim).filter(region -> !region.isBlank()).toList();
    if (regions.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe ao menos uma regiao.");
    }
    List<ServiceTag> services = input.services() == null ? List.of() : input.services();
    if (services.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Selecione ao menos um servico.");
    }
    ContactInput contacts = input.contacts();
    ContactInfo contactInfo = new ContactInfo(
        contacts == null ? null : contacts.phone(),
        contacts == null ? null : contacts.whatsapp(),
        contacts == null ? null : contacts.email());
    if (!contactInfo.hasAny()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe ao menos um canal de contato.");
    }
    if (type == ProviderType.INTERNO
        && contactInfo.getPhone() == null && contactInfo.getWhatsapp() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe um telefone ou WhatsApp.");
    }

    ProviderProfile provider = new ProviderProfile();
    provider.setId(Ids.next("p"));
    provider.setName(input.name().trim());
    provider.setHeadline(input.headline().trim());
    provider.setBio(input.bio() == null ? "" : input.bio().trim());
    provider.setPhotoUrl(input.photoUrl() == null || input.photoUrl().isBlank()
        ? DEFAULT_PHOTO
        : input.photoUrl().trim());
    provider.setVehicleType(input.vehicleType());
    provider.setVehicleDescription(
        input.vehicleDescription() == null ? "" : input.vehicleDescription().trim());
    provider.setRegions(new ArrayList<>(regions));
    provider.setServices(new ArrayList<>(services));
    provider.setContacts(contactInfo);
    provider.setStatus(ProviderStatus.PENDENTE);
    provider.setType(type);
    provider.setUser(user);
    provider.setAvailable(false);
    provider.setDocumentsVerified(false);
    provider.setCreatedAt(Instant.now());
    return providers.save(provider);
  }

  @Transactional(readOnly = true)
  public ProviderView getMine() {
    return toOwnView(findMine());
  }

  @Transactional
  public ProviderView setAvailability(boolean available) {
    ProviderProfile provider = findMine();
    if (available && (provider.getStatus() != ProviderStatus.APROVADO
        || !provider.isDocumentsVerified())) {
      throw new ApiException(HttpStatus.CONFLICT, "O cadastro precisa estar aprovado para receber pedidos.");
    }
    provider.setAvailable(available);
    return toOwnView(provider);
  }

  public ProviderProfile findMine() {
    return providers.findByUser_Id(CurrentUser.get().id())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Motorista nao encontrado."));
  }

  @Transactional
  public ProviderView updateStatus(String id, ProviderStatusInput input) {
    if (input == null || input.status() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o status.");
    }
    ProviderProfile provider = find(id);
    provider.setStatus(input.status());
    if (input.status() == ProviderStatus.APROVADO) {
      provider.setDocumentsVerified(true);
    } else {
      provider.setAvailable(false);
    }
    if (input.documentNote() != null) {
      provider.setDocumentNote(input.documentNote().isBlank() ? null : input.documentNote().trim());
    }
    return toAdminView(provider);
  }

  @Transactional
  public ProviderView addReview(String providerId, ReviewInput input) {
    if (input == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe uma avaliacao.");
    }
    if (input.rating() < 1 || input.rating() > 5) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "A nota deve ser de 1 a 5.");
    }
    if (input.comment() == null || input.comment().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Escreva um comentario.");
    }
    ProviderProfile provider = findApproved(providerId);
    String authorId = CurrentUser.get().id();
    boolean alreadyReviewed = provider.getReviews().stream()
        .anyMatch(existing -> authorId.equals(existing.getAuthorId()));
    if (alreadyReviewed) {
      throw new ApiException(HttpStatus.CONFLICT, "Voce ja avaliou este motorista.");
    }
    Review review = new Review(
        Ids.next("r"),
        provider,
        authorId,
        CurrentUser.get().name(),
        input.rating(),
        input.comment().trim(),
        Instant.now());
    provider.addReview(review);
    return toPublicView(provider);
  }

  private ProviderProfile find(String id) {
    return providers.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Motorista nao encontrado."));
  }

  // Fora do catalogo, o motorista "nao existe" para o publico: mesma resposta
  // 404 de um id inexistente, para nao revelar cadastros pendentes ou rejeitados.
  private ProviderProfile findApproved(String id) {
    return providers.findById(id)
        .filter(provider -> provider.getStatus() == ProviderStatus.APROVADO)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Motorista nao encontrado."));
  }

  private ProviderView toPublicView(ProviderProfile provider) {
    return toView(provider, false, false);
  }

  private ProviderView toAdminView(ProviderProfile provider) {
    return toView(provider, true, true);
  }

  private ProviderView toOwnView(ProviderProfile provider) {
    return toView(provider, true, false);
  }

  private ProviderView toView(
      ProviderProfile provider, boolean includeContacts, boolean includeInternal) {
    ContactInfo contacts = provider.getContacts();
    boolean showContacts = provider.getType() == ProviderType.EXTERNO || includeContacts;
    return new ProviderView(
        provider.getId(),
        provider.getName(),
        provider.getHeadline(),
        provider.getBio(),
        provider.getPhotoUrl(),
        provider.getVehicleType(),
        provider.getVehicleDescription(),
        List.copyOf(provider.getRegions()),
        List.copyOf(provider.getServices()),
        showContacts ? new ContactView(contacts.getPhone(), contacts.getWhatsapp(), contacts.getEmail()) : null,
        provider.getType(),
        provider.isAvailable(),
        provider.isDocumentsVerified(),
        provider.getStatus(),
        includeInternal ? provider.getDocumentNote() : null,
        provider.getCreatedAt(),
        provider.getReviews().stream().map(ProviderService::toReview).toList());
  }

  private static ReviewView toReview(Review review) {
    return new ReviewView(
        review.getId(),
        review.getAuthorName(),
        review.getRating(),
        review.getComment(),
        review.getCreatedAt());
  }

  private static String haystack(ProviderProfile provider) {
    return provider.getName() + " " + provider.getHeadline() + " " + provider.getBio() + " "
        + String.join(" ", provider.getRegions());
  }

}
