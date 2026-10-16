-- Motoristas do app e pedidos com aceite. Dados da V1 sao preservados.
alter table providers add column type varchar(255) not null default 'EXTERNO';
alter table providers add column user_id varchar(255);
alter table providers add column is_available boolean not null default false;
alter table providers add column documents_verified boolean not null default false;
update providers set documents_verified = true where status = 'APROVADO';
alter table providers add constraint uk_provider_user unique (user_id);
alter table providers add constraint fk_provider_user foreign key (user_id) references app_user (id);
alter table providers add constraint ck_provider_type_user
  check ((type = 'INTERNO' and user_id is not null) or (type = 'EXTERNO' and user_id is null));

alter table freight_requests add column city varchar(255);
alter table freight_requests add column scheduled_at timestamp(6);
alter table freight_requests add column contact_phone varchar(255);
alter table freight_requests add column price_offered numeric(10,2);
alter table freight_requests add column counter_price numeric(10,2);
alter table freight_requests add column agreed_price numeric(10,2);
alter table freight_requests add column response_deadline timestamp(6);
alter table freight_requests add column version bigint not null default 0;

-- A data legada passa a representar 09:00 no fuso de Sao Paulo, guardada em UTC.
update freight_requests
set scheduled_at = ((scheduled_date + time '09:00') at time zone 'America/Sao_Paulo') at time zone 'UTC';
update freight_requests
set status = case status
  when 'ABERTA' then 'EXPIRADO'
  when 'EM_NEGOCIACAO' then 'EXPIRADO'
  when 'CONFIRMADA' then 'ACEITO'
  when 'CONCLUIDA' then 'CONCLUIDO'
  when 'CANCELADA' then 'CANCELADO'
  else status
end;
alter table freight_requests alter column scheduled_at set not null;
alter table freight_requests drop column scheduled_date;

create index idx_freight_client on freight_requests (client_id);
create index idx_freight_provider_status on freight_requests (provider_id, status);
create index idx_freight_status_deadline on freight_requests (status, response_deadline);
