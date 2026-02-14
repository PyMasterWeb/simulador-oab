# Simulador OAB - Monorepo MVP (Padrão FGV)

Este repositório agora contém um **novo monorepo** com frontend + backend + shared package, preservando os arquivos legados já existentes (`index.html`, `app.js`, PDFs e scripts de parser).

## Estrutura

- `apps/web`: Next.js (App Router) + TypeScript + Tailwind
- `apps/api`: Fastify + TypeScript + Prisma + PostgreSQL
- `packages/shared`: tipos/validações compartilhadas (`zod`)
- `docker-compose.yml`: PostgreSQL local
- `.env.example`: variáveis de ambiente

## Funcionalidades MVP implementadas

- Simulados padrão FGV com modo full/subject.
- Execução cronometrada com navegação, marcação para revisão e autosave de resposta.
- Resultado com estatísticas por matéria e recomendações.
- Gabarito comentado por questão (texto + referências + link de vídeo).
- Ranking semanal/geral com score ponderado por tempo.
- Anti-cheat básico no ranking (tempo médio mínimo por questão).
- Captura de lead no simulado free antes do resultado final.
- Exportação de leads em CSV.
- Integração de pagamento por webhook com assinatura HMAC:
  - `POST /webhooks/payments/:provider`
  - status FREE/PREMIUM automático por email.
- LGPD:
  - consentimento explícito no cadastro/lead;
  - exportação e exclusão de conta (`/users/:id/export`, `/users/:id`).
- Admin (CRUD básico de questões via API + página `/admin`).

## Plano de execução (checklist)

- [x] Passo 1: scaffolding do monorepo
- [x] Passo 2: DB + Prisma + seed
- [x] Passo 3: auth
- [x] Passo 4: prova (timer + respostas + persistência)
- [x] Passo 5: resultados + comentários
- [x] Passo 6: ranking
- [x] Passo 7: admin CRUD
- [x] Passo 8: webhook pagamento

## Modelagem de dados (Prisma)

Entidades implementadas:

- `User`
- `Subject`
- `Topic`
- `Question`
- `Exam`
- `ExamQuestion`
- `Attempt`
- `AttemptAnswer`
- `LeaderboardEntry`
- `PaymentEvent`
- `Lead`

## Seed

`apps/api/prisma/seed.ts` cria:

- 1 usuário admin: `admin@oab.local` / `admin123`
- 3 matérias + tópicos
- 30 questões com gabarito comentado
- 2 simulados (free + premium)

## Pagamento premium e webhooks

### Variáveis de ambiente (resumo)

```env
PREMIUM_CHECKOUT_URL_ASAAS=https://www.asaas.com/c/SEU_LINK
PREMIUM_CHECKOUT_URL_MERCADOPAGO=
PREMIUM_CHECKOUT_URL_NUBANK_QR=
ASAAS_WEBHOOK_TOKEN=seu-token-no-asaas
MERCADOPAGO_WEBHOOK_SECRET=
WEBHOOK_SECRET=change-webhook-secret
```

### Endpoints de checkout e status

- `GET /checkout/options`: retorna provedores configurados para exibir na página `/premium`.
- `GET /billing/me`: retorna plano atual do usuário autenticado e últimos eventos de pagamento.

### Webhooks suportados

- `POST /webhooks/payments/asaas`
- `POST /webhooks/payments/mercadopago`
- `POST /webhooks/payments/nubank_qr`

### Assinatura/validação de webhook por provedor

- Asaas: header `asaas-access-token` (ou `x-asaas-access-token`) deve bater com `ASAAS_WEBHOOK_TOKEN`.
- Mercado Pago: header `x-signature` validado por HMAC-SHA256 com `MERCADOPAGO_WEBHOOK_SECRET` (ou `WEBHOOK_SECRET` como fallback).
- Nubank QR genérico: header `x-signature`/`x-hotmart-hottok` validado com `WEBHOOK_SECRET`.

### Exemplo de payload Asaas (aprovado)

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "status": "RECEIVED",
    "customer": {
      "email": "aluno@exemplo.com"
    }
  }
}
```

Quando o status é aprovado, o usuário com o mesmo email é promovido para `PREMIUM`.

### Teste rápido local (sem painel)

```bash
curl -X POST http://localhost:3333/webhooks/payments/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: oab-token-2026" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"status":"RECEIVED","customer":{"email":"SEU_EMAIL_DE_LOGIN"}}}'
```

Depois, no frontend (`/premium`), clique em `Já paguei, atualizar status` para recarregar o plano.

## Publicação (instruções)

- Web: Vercel
- API: Render/Fly.io
- Banco: Neon/Supabase/Postgres gerenciado
- Configurar variáveis de ambiente em cada serviço.

## Como rodar

1. Copiar variáveis:

```bash
cp .env.example .env
```

2. Instalar dependências:

```bash
pnpm install
```

3. Subir banco:

```bash
docker compose up -d
```

4. Migrar e seedar:

```bash
pnpm db:migrate && pnpm db:seed
```

5. Rodar apps em desenvolvimento:

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3333`

## Observações

- A linguagem do produto foi mantida sóbria e informativa, sem promessas de aprovação.
- O simulador legado anterior continua no repositório e não foi removido.

## Extração do banco de questões (FGV)

Script novo para buscar materiais direto em `https://oab.fgv.br/`, baixar prova tipo 1 + gabarito definitivo e reconstruir os JSONs locais:

```bash
./scripts/sync_fgv_bank.py --from-exam 39 --to-exam 45
```

Esse comando:

- baixa/atualiza `P{EXAME}OAB.pdf` e `G{EXAME}OAB.pdf`;
- regenera `data/objective_questions.json`;
- regenera `data/local_answer_keys.json`;
- atualiza `data/oab_catalog.json`.
