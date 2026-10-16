package com.fretehub.provider;

import com.fretehub.domain.Enums.ProviderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<ProviderProfile, String> {
  List<ProviderProfile> findByStatus(ProviderStatus status);

  List<ProviderProfile> findAllByOrderByCreatedAtDesc();

  Optional<ProviderProfile> findByUser_Id(String userId);
}
