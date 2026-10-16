package com.fretehub.freight;

import com.fretehub.web.Dtos.FreightView;
import com.fretehub.web.Dtos.PriceInput;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/driver/freights")
public class DriverFreightController {
  private final FreightService freights;

  public DriverFreightController(FreightService freights) {
    this.freights = freights;
  }

  @GetMapping
  public List<FreightView> list() {
    return freights.listDriverFreights();
  }

  @PostMapping("/{id}/accept")
  public FreightView accept(@PathVariable String id) {
    return freights.accept(id);
  }

  @PostMapping("/{id}/reject")
  public FreightView reject(@PathVariable String id) {
    return freights.reject(id);
  }

  @PostMapping("/{id}/counter-offer")
  public FreightView counterOffer(@PathVariable String id, @RequestBody PriceInput input) {
    return freights.counterOffer(id, input);
  }

  @PostMapping("/{id}/start")
  public FreightView start(@PathVariable String id) {
    return freights.start(id);
  }

  @PostMapping("/{id}/complete")
  public FreightView complete(@PathVariable String id) {
    return freights.complete(id);
  }
}
