package com.fretehub.domain;

public final class Enums {
  private Enums() {}

  public enum VehicleType {
    MOTO,
    CARRO,
    FIORINO,
    VAN,
    CAMINHAO_PEQUENO,
    CAMINHAO_BAU
  }

  public enum ServiceTag {
    FRETE_PEQUENO,
    MUDANCA_RESIDENCIAL,
    MUDANCA_COMERCIAL,
    ENTREGA_EXPRESSA,
    CARGA_FRAGIL,
    MONTAGEM_MOVEIS,
    AJUDANTE_CARGA
  }

  public enum ProviderStatus {
    PENDENTE,
    APROVADO,
    REJEITADO,
    INATIVO
  }

  public enum ProviderType {
    INTERNO,
    EXTERNO
  }

  public enum FreightStatus {
    PENDENTE,
    CONTRAPROPOSTA,
    ACEITO,
    RECUSADO,
    EXPIRADO,
    EM_ANDAMENTO,
    CONCLUIDO,
    CANCELADO
  }

  public enum UserRole {
    CLIENTE,
    MOTORISTA,
    ADMIN
  }
}
