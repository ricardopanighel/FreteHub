package com.fretehub.seed;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fretehub.domain.Enums.FreightStatus;
import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.UserRole;
import com.fretehub.domain.Enums.VehicleType;
import com.fretehub.freight.FreightOrder;
import com.fretehub.freight.FreightRepository;
import com.fretehub.provider.ContactInfo;
import com.fretehub.provider.ProviderProfile;
import com.fretehub.provider.ProviderRepository;
import com.fretehub.provider.Review;
import com.fretehub.user.UserAccount;
import com.fretehub.user.UserRepository;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(0)
public class DemoDataLoader implements ApplicationRunner {

  private final ObjectMapper objectMapper;
  private final PasswordEncoder passwordEncoder;
  private final UserRepository users;
  private final ProviderRepository providers;
  private final FreightRepository freights;

  public DemoDataLoader(
      ObjectMapper objectMapper,
      PasswordEncoder passwordEncoder,
      UserRepository users,
      ProviderRepository providers,
      FreightRepository freights) {
    this.objectMapper = objectMapper;
    this.passwordEncoder = passwordEncoder;
    this.users = users;
    this.providers = providers;
    this.freights = freights;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) throws Exception {
    if (users.count() > 0) return;

    SeedFile seed;
    try (InputStream input = getClass().getResourceAsStream("/seed/demo.json")) {
      seed = objectMapper.readValue(input, SeedFile.class);
    }

    for (SeedUser user : seed.users()) {
      users.save(new UserAccount(
          user.id(),
          user.name(),
          user.email().toLowerCase(),
          passwordEncoder.encode(user.password()),
          UserRole.valueOf(user.role())));
    }

    for (SeedProvider item : seed.providers()) {
      ProviderProfile provider = new ProviderProfile();
      provider.setId(item.id());
      provider.setName(item.name());
      provider.setHeadline(item.headline());
      provider.setBio(item.bio() == null ? "" : item.bio());
      provider.setPhotoUrl(item.photoUrl());
      provider.setVehicleType(VehicleType.valueOf(item.vehicleType()));
      provider.setVehicleDescription(item.vehicleDescription() == null ? "" : item.vehicleDescription());
      provider.setRegions(new ArrayList<>(item.regions()));
      provider.setServices(new ArrayList<>(item.services().stream().map(ServiceTag::valueOf).toList()));
      SeedContact contacts = item.contacts();
      provider.setContacts(new ContactInfo(
          contacts == null ? null : contacts.phone(),
          contacts == null ? null : contacts.whatsapp(),
          contacts == null ? null : contacts.email()));
      provider.setStatus(ProviderStatus.valueOf(item.status()));
      provider.setDocumentNote(item.documentNote());
      provider.setCreatedAt(item.createdAt());
      if (item.reviews() != null) {
        for (SeedReview review : item.reviews()) {
          provider.appendReview(new Review(
              review.id(),
              provider,
              null,
              review.authorName(),
              review.rating(),
              review.comment(),
              review.createdAt()));
        }
      }
      providers.save(provider);
    }

    for (SeedFreight item : seed.freights()) {
      FreightOrder freight = new FreightOrder();
      freight.setId(item.id());
      freight.setClient(users.findById(item.clientId()).orElseThrow());
      if (item.providerId() != null) {
        ProviderProfile provider = providers.findById(item.providerId()).orElseThrow();
        freight.setProvider(provider);
        freight.setProviderName(provider.getName());
      }
      freight.setOrigin(item.origin());
      freight.setDestination(item.destination());
      freight.setDescription(item.description());
      freight.setScheduledDate(item.scheduledDate());
      freight.setVehicleType(item.vehicleType() == null ? null : VehicleType.valueOf(item.vehicleType()));
      freight.setService(item.service() == null ? null : ServiceTag.valueOf(item.service()));
      freight.setStatus(FreightStatus.valueOf(item.status()));
      freight.setCreatedAt(item.createdAt());
      freight.setUpdatedAt(item.updatedAt());
      freights.save(freight);
    }
  }

  public record SeedFile(
      List<SeedUser> users, List<SeedProvider> providers, List<SeedFreight> freights) {}

  public record SeedUser(String id, String name, String email, String role, String password) {}

  public record SeedContact(String phone, String whatsapp, String email) {}

  public record SeedReview(
      String id, String authorName, int rating, String comment, Instant createdAt) {}

  public record SeedProvider(
      String id,
      String name,
      String headline,
      String bio,
      String photoUrl,
      String vehicleType,
      String vehicleDescription,
      List<String> regions,
      List<String> services,
      SeedContact contacts,
      String status,
      String documentNote,
      Instant createdAt,
      List<SeedReview> reviews) {}

  public record SeedFreight(
      String id,
      String clientId,
      String providerId,
      String origin,
      String destination,
      String description,
      LocalDate scheduledDate,
      String vehicleType,
      String service,
      String status,
      Instant createdAt,
      Instant updatedAt) {}
}
