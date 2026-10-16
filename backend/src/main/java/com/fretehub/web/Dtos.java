package com.fretehub.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fretehub.domain.Enums.FreightStatus;
import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ProviderType;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.UserRole;
import com.fretehub.domain.Enums.VehicleType;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.util.List;

public final class Dtos {
  private Dtos() {}

  public record ContactView(String phone, String whatsapp, String email) {}

  public record ReviewView(
      String id, String authorName, int rating, String comment, Instant createdAt) {}

  public record ProviderView(
      String id,
      String name,
      String headline,
      String bio,
      String photoUrl,
      VehicleType vehicleType,
      String vehicleDescription,
      List<String> regions,
      List<ServiceTag> services,
      @JsonInclude(JsonInclude.Include.ALWAYS) ContactView contacts,
      ProviderType type,
      boolean available,
      boolean documentsVerified,
      ProviderStatus status,
      String documentNote,
      Instant createdAt,
      List<ReviewView> reviews) {}

  public record ProviderPage(List<ProviderView> items, long total, int page, int pageSize) {}

  public record ContactInput(String phone, String whatsapp, String email) {}

  public record ProviderInput(
      String name,
      String headline,
      String bio,
      String photoUrl,
      VehicleType vehicleType,
      String vehicleDescription,
      List<String> regions,
      List<ServiceTag> services,
      ContactInput contacts) {}

  public record ProviderStatusInput(ProviderStatus status, String documentNote) {}

  public record ReviewInput(int rating, String comment) {}

  public record UserView(String id, String name, String email, UserRole role) {}

  public record AuthResponse(UserView user, String token) {}

  public record LoginInput(String email, String password) {}

  public record RegisterInput(String name, String email, String password) {}

  public record DriverSignupInput(String email, String password, ProviderInput provider) {}

  public record AvailabilityInput(boolean available) {}

  public record PriceInput(BigDecimal price) {}

  public record FreightView(
      String id,
      String clientId,
      String clientName,
      String providerId,
      String providerName,
      String origin,
      String destination,
      String description,
      String city,
      Instant scheduledAt,
      @JsonInclude(JsonInclude.Include.ALWAYS) String contactPhone,
      VehicleType vehicleType,
      ServiceTag service,
      FreightStatus status,
      BigDecimal priceOffered,
      BigDecimal counterPrice,
      BigDecimal agreedPrice,
      Instant responseDeadline,
      @JsonInclude(JsonInclude.Include.ALWAYS) ContactView providerContacts,
      @JsonInclude(JsonInclude.Include.ALWAYS) ContactView clientContact,
      Instant createdAt,
      Instant updatedAt) {}

  public record FreightInput(
      String providerId,
      String origin,
      String destination,
      String description,
      String city,
      LocalDate scheduledDate,
      LocalTime scheduledTime,
      String contactPhone,
      BigDecimal priceOffered,
      String vehicleType,
      String service) {}

  public record FreightStatusInput(FreightStatus status) {}
}
