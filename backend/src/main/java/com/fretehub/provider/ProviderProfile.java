package com.fretehub.provider;

import com.fretehub.domain.Enums.ProviderStatus;
import com.fretehub.domain.Enums.ServiceTag;
import com.fretehub.domain.Enums.VehicleType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "providers")
public class ProviderProfile {

  @Id
  private String id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String headline;

  @Column(nullable = false, length = 4000)
  private String bio;

  @Column(nullable = false)
  private String photoUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private VehicleType vehicleType;

  @Column(nullable = false)
  private String vehicleDescription;

  @ElementCollection
  @CollectionTable(name = "provider_region", joinColumns = @JoinColumn(name = "provider_id"))
  @Column(name = "region", nullable = false)
  @OrderColumn(name = "position")
  private List<String> regions = new ArrayList<>();

  @ElementCollection
  @CollectionTable(name = "provider_service", joinColumns = @JoinColumn(name = "provider_id"))
  @Enumerated(EnumType.STRING)
  @Column(name = "service", nullable = false)
  @OrderColumn(name = "position")
  private List<ServiceTag> services = new ArrayList<>();

  @Embedded
  private ContactInfo contacts = new ContactInfo(null, null, null);

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ProviderStatus status;

  private String documentNote;

  @Column(nullable = false)
  private Instant createdAt;

  @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("createdAt DESC")
  private List<Review> reviews = new ArrayList<>();

  public ProviderProfile() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getHeadline() {
    return headline;
  }

  public void setHeadline(String headline) {
    this.headline = headline;
  }

  public String getBio() {
    return bio;
  }

  public void setBio(String bio) {
    this.bio = bio;
  }

  public String getPhotoUrl() {
    return photoUrl;
  }

  public void setPhotoUrl(String photoUrl) {
    this.photoUrl = photoUrl;
  }

  public VehicleType getVehicleType() {
    return vehicleType;
  }

  public void setVehicleType(VehicleType vehicleType) {
    this.vehicleType = vehicleType;
  }

  public String getVehicleDescription() {
    return vehicleDescription;
  }

  public void setVehicleDescription(String vehicleDescription) {
    this.vehicleDescription = vehicleDescription;
  }

  public List<String> getRegions() {
    return regions;
  }

  public void setRegions(List<String> regions) {
    this.regions = regions;
  }

  public List<ServiceTag> getServices() {
    return services;
  }

  public void setServices(List<ServiceTag> services) {
    this.services = services;
  }

  public ContactInfo getContacts() {
    return contacts;
  }

  public void setContacts(ContactInfo contacts) {
    this.contacts = contacts;
  }

  public ProviderStatus getStatus() {
    return status;
  }

  public void setStatus(ProviderStatus status) {
    this.status = status;
  }

  public String getDocumentNote() {
    return documentNote;
  }

  public void setDocumentNote(String documentNote) {
    this.documentNote = documentNote;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public List<Review> getReviews() {
    return reviews;
  }

  public void addReview(Review review) {
    reviews.add(0, review);
  }

  public void appendReview(Review review) {
    reviews.add(review);
  }
}
