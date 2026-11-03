# FreteHub — Backlog

Itens que ficaram de fora do commit `024d850` e aguardam revisao e decisao.
Nenhum deles bloqueia o funcionamento do fluxo atual.

## Decisoes pendentes

- **Publicar a nova versao.** Exige OK explicito, backup do Neon, reset do
  Neon (documentacao tecnica, §6.3) e desconectar o Blueprint duplicado
  (servicos terminados em `-y6sg`).
- **Versionar `.claude/skills/`.** Hoje a pasta esta fora do git.
- **Apagar schemas locais de teste** no PostgreSQL: `fretehub_e2e_20261016`,
  `fretehub_teste_20261016` e, depois que o outro agente terminar,
  `fretehub_verify_20261015`.

## Ajustes de interface e regra

- Pedido antigo `ACEITO` sem motorista so pode ser cancelado pela equipe.
- "Cancelar pedido" nao pede confirmacao.
- Nao ha atalho para avaliar o motorista depois de `CONCLUIDO`; avaliacoes
  tambem nao exigem um frete concluido.
- Motorista que recusou um pedido direto o ve de novo se o cliente o reenviar
  para a fila.
- O rodape mostra links de cliente a quem e motorista.
- Textos: "WhatsApp" x "Chamar no WhatsApp"; o rotulo do interruptor de
  disponibilidade muda com o estado.
- Alguns nomes de teste ainda dizem "prestador".

## Visao futura

Push em tempo real, e-mail ou SMS, chat, GPS, mapas, preco por distancia,
pagamento, upload de documentos e fotos, edicao do perfil pelo motorista,
mais rodadas de contraproposta, desistencia apos o aceite, varios veiculos
por motorista e limite de cadastros por IP.
