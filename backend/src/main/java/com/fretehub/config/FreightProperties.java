package com.fretehub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fretehub.freight")
public record FreightProperties(long responseMinutes) {}
