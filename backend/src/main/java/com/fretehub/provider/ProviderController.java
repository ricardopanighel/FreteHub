package com.fretehub.provider;

import com.fretehub.web.Dtos.ProviderInput;
import com.fretehub.web.Dtos.ProviderPage;
import com.fretehub.web.Dtos.ProviderStatusInput;
import com.fretehub.web.Dtos.ProviderView;
import com.fretehub.web.Dtos.ReviewInput;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProviderController {

  private final ProviderService providerService;

  public ProviderController(ProviderService providerService) {
    this.providerService = providerService;
  }

  @GetMapping("/providers")
  public ProviderPage listPublic(
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String vehicleType,
      @RequestParam(defaultValue = "") String region,
      @RequestParam(defaultValue = "") String service,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "9") int pageSize) {
    return providerService.listPublic(search, vehicleType, region, service, page, pageSize);
  }

  @GetMapping("/regions")
  public List<String> regions() {
    return providerService.listRegions();
  }

  @GetMapping("/providers/{id}")
  public ProviderView get(@PathVariable String id) {
    return providerService.get(id);
  }

  @PostMapping("/providers")
  public ProviderView create(@RequestBody ProviderInput input) {
    return providerService.create(input);
  }

  @PostMapping("/providers/{id}/reviews")
  public ProviderView review(@PathVariable String id, @RequestBody ReviewInput input) {
    return providerService.addReview(id, input);
  }

  @GetMapping("/admin/providers")
  public List<ProviderView> listAll() {
    return providerService.listAll();
  }

  @PatchMapping("/admin/providers/{id}")
  public ProviderView updateStatus(@PathVariable String id, @RequestBody ProviderStatusInput input) {
    return providerService.updateStatus(id, input);
  }
}
