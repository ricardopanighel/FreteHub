package com.fretehub.provider;

import java.text.Normalizer;
import java.util.Locale;

public final class CityNames {
  private CityNames() {}

  public static String city(String value) {
    if (value == null) return "";
    int separator = value.indexOf(" - ");
    return (separator < 0 ? value : value.substring(0, separator)).trim();
  }

  public static String normalize(String value) {
    if (value == null) return "";
    return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT)
        .trim();
  }

  public static boolean matches(String region, String city) {
    return normalize(city(region)).equals(normalize(city(city)));
  }
}
