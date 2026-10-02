package com.fretehub.security;

import com.fretehub.domain.Enums.UserRole;

public record AuthUser(String id, String name, String email, UserRole role) {}
