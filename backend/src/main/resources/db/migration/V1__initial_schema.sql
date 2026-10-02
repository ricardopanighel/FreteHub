-- Schema inicial do FreteHub.
-- Reproduz o que o ddl-auto: update criava, agora versionado e validado pelo
-- Hibernate (ddl-auto: validate). Dados de demonstracao continuam no seed Java.

create table app_user (
  id            varchar(255) not null,
  name          varchar(255) not null,
  email         varchar(255) not null,
  password_hash varchar(255) not null,
  role          varchar(255) not null,
  primary key (id),
  constraint uk_app_user_email unique (email)
);

create table providers (
  id                  varchar(255)  not null,
  name                varchar(255)  not null,
  headline            varchar(255)  not null,
  bio                 varchar(4000) not null,
  photo_url           varchar(255)  not null,
  vehicle_type        varchar(255)  not null,
  vehicle_description varchar(255)  not null,
  phone               varchar(255),
  whatsapp            varchar(255),
  email               varchar(255),
  status              varchar(255)  not null,
  document_note       varchar(255),
  created_at          timestamp(6)  not null,
  primary key (id)
);

create table provider_region (
  provider_id varchar(255) not null,
  region      varchar(255) not null,
  position    integer      not null,
  primary key (provider_id, position),
  constraint fk_region_provider foreign key (provider_id) references providers (id)
);

create table provider_service (
  provider_id varchar(255) not null,
  service     varchar(255) not null,
  position    integer      not null,
  primary key (provider_id, position),
  constraint fk_service_provider foreign key (provider_id) references providers (id)
);

create table reviews (
  id          varchar(255)  not null,
  provider_id varchar(255)  not null,
  author_id   varchar(255),
  author_name varchar(255)  not null,
  rating      integer       not null,
  comment     varchar(2000) not null,
  created_at  timestamp(6)  not null,
  primary key (id),
  constraint fk_review_provider foreign key (provider_id) references providers (id),
  -- Uma avaliacao por autor e prestador. author_id nulo (dados de seed, sem
  -- autor logado) nao conflita: no Postgres multiplos NULL sao distintos.
  constraint uk_review_author_provider unique (provider_id, author_id)
);

create table freight_requests (
  id             varchar(255)  not null,
  client_id      varchar(255)  not null,
  provider_id    varchar(255),
  provider_name  varchar(255),
  origin         varchar(255)  not null,
  destination    varchar(255)  not null,
  description    varchar(4000) not null,
  scheduled_date date          not null,
  vehicle_type   varchar(255),
  service        varchar(255),
  status         varchar(255)  not null,
  created_at     timestamp(6)  not null,
  updated_at     timestamp(6)  not null,
  primary key (id),
  constraint fk_freight_client foreign key (client_id) references app_user (id),
  constraint fk_freight_provider foreign key (provider_id) references providers (id)
);
