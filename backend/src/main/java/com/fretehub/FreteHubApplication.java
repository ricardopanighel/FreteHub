package com.fretehub;

import com.fretehub.security.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(JwtProperties.class)
public class FreteHubApplication {

  public static void main(String[] args) {
    SpringApplication.run(FreteHubApplication.class, args);
  }
}
