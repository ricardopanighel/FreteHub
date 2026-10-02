package com.fretehub.web;

import com.fretehub.domain.Enums.FreightStatus;
import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.UserRole;
import com.fretehub.domain.Enums.VehicleType;
import java.time.Instant;
import java.time.LocalDate;
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
      ContactView contacts,
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

  public record FreightView(
      String id,
      String clientId,
      String clientName,
      String providerId,
      String providerName,
      String origin,
      String destination,
      String description,
      LocalDate scheduledDate,
      VehicleType vehicleType,
      ServiceTag service,
      FreightStatus status,
      Instant createdAt,
      Instant updatedAt) {}

  public record FreightInput(
      String providerId,
      String origin,
      String destination,
      String description,
      LocalDate scheduledDate,
      String vehicleType,
      String service) {}

  public record FreightStatusInput(FreightStatus status) {}
}
