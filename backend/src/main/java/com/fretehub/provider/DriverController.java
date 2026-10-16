package com.fretehub.provider;

import com.fretehub.web.Dtos.AvailabilityInput;
import com.fretehub.web.Dtos.ProviderView;
import com.fretehub.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/driver/me")
public class DriverController {
  private final ProviderService providers;

  public DriverController(ProviderService providers) {
    this.providers = providers;
  }

  @GetMapping
  public ProviderView me() {
    return providers.getMine();
  }

  @PatchMapping("/availability")
  public ProviderView availability(@RequestBody AvailabilityInput input) {
    if (input == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Informe a disponibilidade.");
    }
    return providers.setAvailability(input.available());
  }
}
