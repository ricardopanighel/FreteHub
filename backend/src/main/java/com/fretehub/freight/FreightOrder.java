package com.fretehub.freight;

import com.fretehub.domain.Enums.FreightStatus;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.VehicleType;
import com.fretehub.provider.ProviderProfile;
import com.fretehub.user.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "freight_requests")
public class FreightOrder {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "client_id")
  private UserAccount client;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "provider_id")
  private ProviderProfile provider;

  private String providerName;

  @Column(nullable = false)
  private String origin;

  @Column(nullable = false)
  private String destination;

  @Column(nullable = false, length = 4000)
  private String description;

  private String city;

  @Column(nullable = false)
  private Instant scheduledAt;

  private String contactPhone;

  @Column(precision = 10, scale = 2)
  private BigDecimal priceOffered;

  @Column(precision = 10, scale = 2)
  private BigDecimal counterPrice;

  @Column(precision = 10, scale = 2)
  private BigDecimal agreedPrice;

  private Instant responseDeadline;

  @Version
  @Column(nullable = false)
  private Long version;

  @Enumerated(EnumType.STRING)
  private VehicleType vehicleType;

  @Enumerated(EnumType.STRING)
  private ServiceTag service;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private FreightStatus status;

  @Column(nullable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  public FreightOrder() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public UserAccount getClient() {
    return client;
  }

  public void setClient(UserAccount client) {
    this.client = client;
  }

  public ProviderProfile getProvider() {
    return provider;
  }

  public void setProvider(ProviderProfile provider) {
    this.provider = provider;
  }

  public String getProviderName() {
    return providerName;
  }

  public void setProviderName(String providerName) {
    this.providerName = providerName;
  }

  public String getOrigin() {
    return origin;
  }

  public void setOrigin(String origin) {
    this.origin = origin;
  }

  public String getDestination() {
    return destination;
  }

  public void setDestination(String destination) {
    this.destination = destination;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city;
  }

  public Instant getScheduledAt() {
    return scheduledAt;
  }

  public void setScheduledAt(Instant scheduledAt) {
    this.scheduledAt = scheduledAt;
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String contactPhone) {
    this.contactPhone = contactPhone;
  }

  public BigDecimal getPriceOffered() {
    return priceOffered;
  }

  public void setPriceOffered(BigDecimal priceOffered) {
    this.priceOffered = priceOffered;
  }

  public BigDecimal getCounterPrice() {
    return counterPrice;
  }

  public void setCounterPrice(BigDecimal counterPrice) {
    this.counterPrice = counterPrice;
  }

  public BigDecimal getAgreedPrice() {
    return agreedPrice;
  }

  public void setAgreedPrice(BigDecimal agreedPrice) {
    this.agreedPrice = agreedPrice;
  }

  public Instant getResponseDeadline() {
    return responseDeadline;
  }

  public void setResponseDeadline(Instant responseDeadline) {
    this.responseDeadline = responseDeadline;
  }

  public Long getVersion() {
    return version;
  }

  public VehicleType getVehicleType() {
    return vehicleType;
  }

  public void setVehicleType(VehicleType vehicleType) {
    this.vehicleType = vehicleType;
  }

  public ServiceTag getService() {
    return service;
  }

  public void setService(ServiceTag service) {
    this.service = service;
  }

  public FreightStatus getStatus() {
    return status;
  }

  public void setStatus(FreightStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
