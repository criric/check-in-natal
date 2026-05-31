# CLAUDE.md — Regras do projeto

Este arquivo define diretrizes obrigatórias para qualquer trabalho no codebase deste projeto. **Leia antes de editar ou criar qualquer arquivo.**

---

## Stack

- **Next.js 14+** com App Router (não usar Pages Router)
- **Supabase** — PostgreSQL, Auth, Storage, RLS
- **TypeScript** em modo strict
- **Zod** para validação de inputs
- **Resend** para e-mails transacionais
- **@react-pdf/renderer** para geração de PDF
- **date-fns** para datas

---

## Regras de tipagem

### Nunca use union de strings literais com `|` para representar um conjunto fixo de valores. Use `enum` do TypeScript.

**Errado:**

```typescript
type StatusReserva = 'confirmada' | 'cancelada' | 'no_show'
type UserRole = 'admin' | 'proprietario'
```

**Certo:**

```typescript
export enum StatusReserva {
  Confirmada = 'confirmada',
  Cancelada = 'cancelada',
  NoShow = 'no_show',
}

export enum UserRole {
  Admin = 'admin',
  Proprietario = 'proprietario',
}
```

### Por quê
- Permite reuso em runtime (iteração, comparação, conversão).
- Documenta o domínio em um único lugar.
- Integra-se diretamente com Zod via `z.nativeEnum(MeuEnum)`.
- Evita strings mágicas espalhadas pelo código.

### Como aplicar
- Toda coluna com `CHECK IN (...)` no banco deve ter um enum correspondente em [types/index.ts](types/index.ts).
- Schemas Zod desses campos usam `z.nativeEnum(...)`, não `z.enum([...])`.
- Em Server Actions, comparações com esses valores usam o enum: `if (status === StatusReserva.Cancelada)`.

### Nullable / Optional
- `T | null` ainda é aceito quando representa ausência de valor (não há alternativa idiomática em TypeScript).
- Prefira `field?: T` (optional) sobre `field: T | null` quando o campo pode simplesmente não existir no payload.

---

## Estrutura de Server Actions

Todo módulo em [lib/actions/](lib/actions/) deve:

1. Iniciar com `'use server'`.
2. Validar inputs com Zod antes de qualquer operação.
3. Verificar autenticação e role do usuário.
4. Retornar `ActionResult<T>` (tipo definido em [types/index.ts](types/index.ts)).
5. Nunca lançar exceções para o caller — capturar internamente e retornar `{ error }`.

---

## Supabase clients

- [lib/supabase/client.ts](lib/supabase/client.ts) — browser, usar em Client Components.
- [lib/supabase/server.ts](lib/supabase/server.ts) — Server Components / Server Actions / Route Handlers.
- [lib/supabase/admin.ts](lib/supabase/admin.ts) — service role, **só** para operações privilegiadas (criar usuário Auth, bypass RLS). Nunca exponha ao cliente.

---

## RLS já está habilitado

Toda tabela tem RLS ligado. Operações como anon (formulário de leads, criação de usuário) **devem** usar o admin client.

---

## Convenções de naming

- Arquivos: `kebab-case.ts` para utils, `camelCase` para funções/variáveis, `PascalCase` para tipos/enums/componentes.
- Server Actions exportam funções nomeadas (não default).
- Enums em PascalCase, valores em camelCase ou snake_case (espelhando o banco).
