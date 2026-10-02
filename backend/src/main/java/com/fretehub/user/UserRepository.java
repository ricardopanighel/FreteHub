package com.fretehub.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserAccount, String> {
  Optional<UserAccount> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);
}
