package com.fretehub.provider;

import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ServiceTag;
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
import java.text.Normalizer;
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
      String search, String vehicleType, String region, String service, int page, int pageSize) {
    int safePage = Math.max(page, 1);
    int safeSize = pageSize <= 0 ? 9 : Math.min(pageSize, 50);
    String term = normalize(search);
    String regionTerm = normalize(region);

    List<ProviderView> filtered = providers.findByStatus(ProviderStatus.APROVADO).stream()
        .filter(provider -> vehicleType == null || vehicleType.isBlank()
            || provider.getVehicleType().name().equals(vehicleType))
        .filter(provider -> service == null || service.isBlank()
            || provider.getServices().stream().anyMatch(tag -> tag.name().equals(service)))
        .filter(provider -> regionTerm.isBlank()
            || provider.getRegions().stream().anyMatch(item -> normalize(item).contains(regionTerm)))
        .filter(provider -> term.isBlank() || normalize(haystack(provider)).contains(term))
        .sorted(Comparator.comparing(ProviderProfile::getName, String.CASE_INSENSITIVE_ORDER))
        .map(this::toPublicView)
        .toList();

    int from = Math.min((safePage - 1) * safeSize, filtered.size());
    int to = Math.min(from + safeSize, filtered.size());
    return new ProviderPage(filtered.subList(from, to), filtered.size(), safePage, safeSize);
  }

  // Perfil publico: so prestadores aprovados, sem a nota interna. A equipe
  // (ADMIN logado) ve qualquer status e a nota, para revisar cadastros.
  @Transactional(readOnly = true)
  public ProviderView get(String id) {
    if (CurrentUser.isAdmin()) {
      return toAdminView(find(id));
    }
    return toPublicView(findApproved(id));
  }

  @Transactional(readOnly = true)
  public List<String> listRegions() {
    return providers.findByStatus(ProviderStatus.APROVADO).stream()
        .flatMap(provider -> provider.getRegions().stream())
        .distinct()
        .sorted(Comparator.comparing(ProviderService::normalize))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ProviderView> listAll() {
    return providers.findAllByOrderByCreatedAtDesc().stream().map(this::toAdminView).toList();
  }

  @Transactional
  public ProviderView create(ProviderInput input) {
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
    provider.setCreatedAt(Instant.now());
    return toPublicView(providers.save(provider));
  }

  @Transactional
  public ProviderView updateStatus(String id, ProviderStatusInput input) {
    if (input.status() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o status.");
    }
    ProviderProfile provider = find(id);
    provider.setStatus(input.status());
    if (input.documentNote() != null) {
      provider.setDocumentNote(input.documentNote().isBlank() ? null : input.documentNote().trim());
    }
    return toAdminView(provider);
  }

  @Transactional
  public ProviderView addReview(String providerId, ReviewInput input) {
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
      throw new ApiException(HttpStatus.CONFLICT, "Voce ja avaliou este prestador.");
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
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Prestador nao encontrado."));
  }

  // Fora do catalogo, o prestador "nao existe" para o publico: mesma resposta
  // 404 de um id inexistente, para nao revelar cadastros pendentes ou rejeitados.
  private ProviderProfile findApproved(String id) {
    return providers.findById(id)
        .filter(provider -> provider.getStatus() == ProviderStatus.APROVADO)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Prestador nao encontrado."));
  }

  private ProviderView toPublicView(ProviderProfile provider) {
    return toView(provider, false);
  }

  private ProviderView toAdminView(ProviderProfile provider) {
    return toView(provider, true);
  }

  private ProviderView toView(ProviderProfile provider, boolean includeInternal) {
    ContactInfo contacts = provider.getContacts();
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
        new ContactView(contacts.getPhone(), contacts.getWhatsapp(), contacts.getEmail()),
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

  private static String normalize(String text) {
    if (text == null) return "";
    return Normalizer.normalize(text, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase()
        .trim();
  }
}
