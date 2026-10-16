package com.fretehub.freight;

import com.fretehub.domain.Enums.FreightStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FreightRepository extends JpaRepository<FreightOrder, String> {
  List<FreightOrder> findByClient_IdOrderByCreatedAtDesc(String clientId);

  List<FreightOrder> findAllByOrderByCreatedAtDesc();

  List<FreightOrder> findByProvider_IdOrderByCreatedAtDesc(String providerId);

  List<FreightOrder> findByProviderIsNullAndStatusOrderByCreatedAtDesc(FreightStatus status);
}
