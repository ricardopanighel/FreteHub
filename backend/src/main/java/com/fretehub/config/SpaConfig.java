package com.fretehub.config;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Na versao publicada (Dockerfile), o build do front fica em classpath:/static
 * e a API o entrega no mesmo dominio, sem CORS. Rotas do React Router
 * (/catalogo, /prestador/...) nao sao arquivos: caem no index.html e o front
 * resolve a tela. Em dev nao ha index.html e nada muda.
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new SpaFallbackResolver());
  }

  private static class SpaFallbackResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(String resourcePath, Resource location) throws IOException {
      Resource requested = super.getResource(resourcePath, location);
      if (requested != null || resourcePath.startsWith("api/") || looksLikeFile(resourcePath)) {
        return requested;
      }
      return super.getResource("index.html", location);
    }

    // Arquivo que nao existe (ex.: /assets/antigo.js) responde 404, nao a pagina.
    private static boolean looksLikeFile(String path) {
      return path.substring(path.lastIndexOf('/') + 1).contains(".");
    }
  }
}
