package com.fretehub.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fretehub.jwt")
public record JwtProperties(String secret, int expirationHours) {}
