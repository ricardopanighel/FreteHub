package com.fretehub.security;

import java.util.UUID;

public final class Ids {
  private Ids() {}

  public static String next(String prefix) {
    return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
  }
}
