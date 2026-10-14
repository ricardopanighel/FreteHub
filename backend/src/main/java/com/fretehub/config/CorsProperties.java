package com.fretehub.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fretehub.cors")
public record CorsProperties(List<String> allowedOrigins) {}
