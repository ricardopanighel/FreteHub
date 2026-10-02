package com.fretehub.provider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "reviews")
public class Review {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "provider_id")
  private ProviderProfile provider;

  // Cliente autor da avaliacao. Nulo apenas para dados de seed (sem login).
  @Column(name = "author_id")
  private String authorId;

  @Column(nullable = false)
  private String authorName;

  @Column(nullable = false)
  private int rating;

  @Column(nullable = false, length = 2000)
  private String comment;

  @Column(nullable = false)
  private Instant createdAt;

  protected Review() {}

  public Review(
      String id,
      ProviderProfile provider,
      String authorId,
      String authorName,
      int rating,
      String comment,
      Instant createdAt) {
    this.id = id;
    this.provider = provider;
    this.authorId = authorId;
    this.authorName = authorName;
    this.rating = rating;
    this.comment = comment;
    this.createdAt = createdAt;
  }

  public String getId() {
    return id;
  }

  public String getAuthorId() {
    return authorId;
  }

  public String getAuthorName() {
    return authorName;
  }

  public int getRating() {
    return rating;
  }

  public String getComment() {
    return comment;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
