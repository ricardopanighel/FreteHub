package com.fretehub.freight;

import com.fretehub.web.Dtos.FreightInput;
import com.fretehub.web.Dtos.FreightStatusInput;
import com.fretehub.web.Dtos.FreightView;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FreightController {

  private final FreightService freightService;

  public FreightController(FreightService freightService) {
    this.freightService = freightService;
  }

  @PostMapping("/freights")
  public FreightView create(@RequestBody FreightInput input) {
    return freightService.create(input);
  }

  @GetMapping("/freights/mine")
  public List<FreightView> mine() {
    return freightService.listMine();
  }

  @PostMapping("/freights/{id}/cancel")
  public FreightView cancel(@PathVariable String id) {
    return freightService.cancel(id);
  }

  @GetMapping("/admin/freights")
  public List<FreightView> all() {
    return freightService.listAll();
  }

  @PatchMapping("/admin/freights/{id}")
  public FreightView updateStatus(@PathVariable String id, @RequestBody FreightStatusInput input) {
    return freightService.updateStatus(id, input);
  }
}
