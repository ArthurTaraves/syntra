# SYNTRA — Sistema de Navegação, Tecnologia e Recuperação de Arquivos

> **Fonte da verdade: [`docs/PROPOSTA.md`](docs/PROPOSTA.md).** É a especificação oficial do projeto.
> Em caso de conflito entre este arquivo, o código ou pedidos antigos e a PROPOSTA, **vale a PROPOSTA**.
> Leia-a antes de qualquer etapa nova.

Protótipo acadêmico (projeto integrador SENAI) para a **Superintendência Regional da Polícia Rodoviária Federal no Piauí (PRF-PI)**, área de **Gestão de Pessoas**.

## Problema (resumo da PROPOSTA)
Informações dos servidores espalhadas em 9 sistemas/sites e planilhas sem padrão; tempo de serviço, lotação, competências, capacitações e aposentadoria cruzados à mão; sem banco de talentos.

## Solução (resumo da PROPOSTA)
- Sistema único em que tudo fica ligado à **matrícula** (prontuário), no computador e num **totem** (touch, área interna, login obrigatório).
- **Ficha do servidor em 5 blocos**: dados básicos · lotação e movimentações · tempo de serviço e aposentadoria · cursos e capacitações (com documentos) · perfil e talentos. Selo "Ficha atualizada há X meses".
- **Painel de indicadores**, **alerta de risco por unidade**, **busca de talentos** com filtros combinados, **autoatendimento** com aprovação e **LGPD visível**.
- Busca de documentos e localização física (acervo), mantida da etapa anterior.
- Perfis: `servidor` (só a própria ficha; envia atualizações), `gestor` (só a própria unidade; aprova atualizações, nunca as próprias), `admin` = RH (vê e edita tudo).

## Stack
React + Vite + TypeScript + TailwindCSS (v4, via `@tailwindcss/vite`) + React Router + Firebase (Auth e Firestore) + lucide-react. Deploy na Vercel.

## Estrutura
- `docs/PROPOSTA.md` — especificação oficial
- `src/config/regrasRH.ts` — **único** arquivo de regras configuráveis: aposentadoria (idade e tempo mínimos), horizonte de 5 anos, competência rara, limites do alerta, grupo mínimo de privacidade (5), ficha desatualizada (12 meses), tempo do totem (2 min / aviso 15 s)
- `src/lib/rh.ts` — regras de negócio puras (aposentadoria, alertas, talentos, privacidade, "atualizada há X meses")
- `src/pages` — telas (rotas) · `src/components` — UI reutilizável (`ficha/FichaBlocos.tsx` = os 5 blocos)
- `src/services` — **única** camada de acesso a dados (interfaces + implementações)
  - `tipos.ts` — contrato `DataProvider`; `index.ts` — escolhe o provedor e envolve tudo com o registro automático de `LogAcesso`
  - `permissoes.ts` — regras de perfil; **devem ficar idênticas às de `firestore.rules`** (mudou uma, mude a outra)
  - `autoatendimento.ts` — validação dos pedidos e o que muda na ficha ao aprovar (compartilhado pelos provedores)
  - `firebase/` — implementação Firebase · `local/` — modo demonstração no navegador · `sharepoint/` — caminho de migração
- Telas que buscam dados recebem um `Contexto` (`useContextoAcesso('totem' | 'painel')`). Não registre logs manualmente para consulta/visualização/edição: o wrapper em `services/index.ts` já faz isso.
- `src/types` — tipos de domínio · `src/hooks` — hooks · `src/data` — dados fictícios (seed)

## Regras (obrigatórias)
1. **Interface 100% em português do Brasil** (textos, mensagens de erro, rótulos, datas no formato brasileiro).
2. **TODOS os dados são fictícios.** Nunca usar nomes, CPFs, matrículas ou processos reais. CPF sempre mascarado (ex.: `***.456.789-**`); nunca armazenar CPF completo.
   - **Matrículas têm exatamente 4 dígitos** (`PADRAO_MATRICULA` em `src/lib/texto.ts`, `matriculaValida` em `firestore.rules`).
   - **Três contas de demonstração, todas com o nome "Camila"** e senha `syntra123` (uma por perfil, conforme a PROPOSTA): **1001 = servidor** (Delegacia de Teresina), **1002 = gestor** (Delegacia de Parnaíba), **1003 = RH/admin** (Superintendência). Demais servidores fictícios: 1004–1030.
   - O cenário fictício é intencional (Parnaíba e Corrente em vermelho, Superintendência e Picos em amarelo, Teresina e Floriano em verde; pedidos pendentes em Parnaíba). Ao mexer no quadro de `src/data/seed.ts`, preserve esse cenário.
   - Ao mudar os dados fictícios, suba a `VERSAO` em `src/services/local/index.ts` (atual: `v4`) para o navegador descartar o acervo antigo.
3. **Nunca apagar, sobrescrever, mover ou renomear o `.env`**, nem rodar comandos que possam removê-lo (`git clean -x`, `git clean -fdx`, `git stash -u`, `git stash --all`, `rm -rf` na raiz etc.). Novas variáveis vão para o `.env.example`.
4. **Componentes de UI nunca acessam o Firebase diretamente** — nada de importar `firebase/*` em `src/pages`, `src/components` ou `src/hooks`. Todo acesso passa por `src/services`.
5. Nenhuma chave ou credencial fixa no código: usar `import.meta.env.VITE_*`.
6. **LGPD**: relatórios/indicadores agregados não exibem grupos com menos de 5 pessoas (`valorProtegido` em `src/lib/rh.ts`); previsões de aposentadoria sempre com o aviso de estimativa; todo acesso a ficha gera log.
7. **Verificação de tipos ao final de cada parte**: `npx tsc -b --singleThreaded` (ver "Fluxo de trabalho").

## Fluxo de trabalho (computador com pouca memória)
- **Não rodar `npm run build` no computador do usuário**: falta memória (o empacotador falha). Usar só `npx tsc -b --singleThreaded` para checar tipos.
- Trabalhar em **branch** (ex.: `etapa-1-proposta`), com commit e push ao final de cada parte. A Vercel compila cada push e gera um **link de prévia**; o usuário testa ali.
- **Só fazer merge na `main` quando o usuário aprovar** a prévia.
- Antes de cada commit, listar os arquivos e conferir que não há `.env`, `serviceAccount*.json` nem logs; adicionar os arquivos pelo nome (nunca `git add -A`).

## Identidade visual
- Azul-marinho institucional como cor principal (`marinho-*` no tema Tailwind, em `src/index.css`); amarelo como destaque (`destaque-*`); fundo claro (`bg-fundo`), alto contraste (WCAG AA).
- **Modo totem**: fontes grandes, botões com no mínimo 64px de altura, alvos de toque generosos, sem depender de hover.
- **Painel**: layout de desktop com menu lateral.
- Status (verde/amarelo/vermelho, pendente/aprovada/recusada) sempre com **ícone + texto**, nunca só a cor.

## Publicação (produção)
- **Site publicado:** https://syntra-prf-pi.vercel.app (totem em `/totem`, painel em `/admin`).
- **Deploy automático:** a Vercel importou o repositório GitHub `ArthurTaraves/syntra`. **Todo `git push` na `main` publica sozinho**; pushes em outras branches geram prévias.
  - **Não** rodar `vercel deploy`, `vercel link` nem criar outro projeto na Vercel.
- **Hoje em modo demonstração:** não há variáveis do Firebase na Vercel, então o site usa o provedor `local`. O `.env` local também está com `VITE_DATA_PROVIDER=local`.
- **Firebase será ligado na próxima etapa** (a camada `src/services/firebase/`, `firestore.rules` e índices já estão prontos). Passos: cadastrar as variáveis `VITE_FIREBASE_*` na Vercel, publicar regras/índices, rodar `npm run seed` e autorizar `syntra-prf-pi.vercel.app` em Firebase Authentication → Domínios autorizados.
- Repositório: https://github.com/ArthurTaraves/syntra (branch padrão `main`).

## Comandos
- `npm run dev` — servidor de desenvolvimento
- `npx tsc -b --singleThreaded` — checagem de tipos (usar no lugar de `npm run build` neste computador)
- `npm run build` — build de produção (roda na Vercel)
- `npm run seed` — popula Firestore/Auth com os dados fictícios (exige `serviceAccount.json`, nunca versionado)
- `firebase deploy --only firestore:rules,firestore:indexes` — publica regras e índices
