package com.fretehub.provider;

import com.fretehub.domain.Enums.ProviderStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<ProviderProfile, String> {
  List<ProviderProfile> findByStatus(ProviderStatus status);

  List<ProviderProfile> findAllByOrderByCreatedAtDesc();
}
