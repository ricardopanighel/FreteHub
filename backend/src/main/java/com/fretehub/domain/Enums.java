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

  public enum FreightStatus {
    ABERTA,
    EM_NEGOCIACAO,
    CONFIRMADA,
    CONCLUIDA,
    CANCELADA
  }

  public enum UserRole {
    CLIENTE,
    ADMIN
  }
}
