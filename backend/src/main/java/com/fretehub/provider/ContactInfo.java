package com.fretehub.provider;

import jakarta.persistence.Embeddable;

@Embeddable
public class ContactInfo {
  private String phone;
  private String whatsapp;
  private String email;

  protected ContactInfo() {}

  public ContactInfo(String phone, String whatsapp, String email) {
    this.phone = blankToNull(phone);
    this.whatsapp = blankToNull(whatsapp);
    this.email = blankToNull(email);
  }

  public String getPhone() {
    return phone;
  }

  public String getWhatsapp() {
    return whatsapp;
  }

  public String getEmail() {
    return email;
  }

  public boolean hasAny() {
    return phone != null || whatsapp != null || email != null;
  }

  private static String blankToNull(String value) {
    if (value == null || value.isBlank()) return null;
    return value.trim();
  }
}
