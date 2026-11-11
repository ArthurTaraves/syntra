# SYNTRA — Sistema de Navegação, Tecnologia e Recuperação de Arquivos

> **Fonte da verdade: [`docs/PROPOSTA.md`](docs/PROPOSTA.md).** É a especificação oficial do projeto.
> Em caso de conflito entre este arquivo, o código ou pedidos antigos e a PROPOSTA, **vale a PROPOSTA**.
> Leia-a antes de qualquer etapa nova.

Protótipo acadêmico (projeto integrador SENAI) para a **Superintendência Regional da Polícia Rodoviária Federal no Piauí (PRF-PI)**, área de **Gestão de Pessoas**.

## Problema (resumo da PROPOSTA)
Informações dos servidores espalhadas em 9 sistemas/sites e planilhas sem padrão; tempo de serviço, lotação, competências, capacitações e aposentadoria cruzados à mão; sem banco de talentos.

## Um único site, dois níveis de acesso (decisão registrada na PROPOSTA)
O mesmo site no computador e no totem; o que cada um vê depende do nível da matrícula. Há só **dois perfis** (o antigo "gestor de unidade", com escopo por unidade, foi **removido** do código, das telas, dos serviços, do modo local e das `firestore.rules`):
- **Policial** (perfil `servidor`, rótulo "Policial"): no totem e no computador vê **só a própria ficha**. Menu: Minha ficha · Meus documentos e processos · Enviar curso ou documento · Minhas solicitações · Imprimir extrato. **Não entra no painel.** Faixa abaixo do "Olá": "Aqui você consulta a sua ficha".
- **RH / Gestão** (perfil `admin`, rótulo "RH / Gestão"): vê tudo, de todas as unidades. No totem: primeiro a seção em destaque **"Gestão de pessoas"**, nesta ordem: **Pedidos para aprovar** (`/totem/pedidos`, contador grande), **Fichas dos servidores** (`/totem/fichas`, `/totem/ficha/:matricula`) e **Abrir painel completo** (`/admin`); as três devem caber sem rolar em 1080×1920 e 1920×1080. Abaixo, **"Minha ficha pessoal"** com as 5 opções do policial em cards compactos. Faixa: "Painel de gestão · X pedidos aguardando sua análise" (ou "Nenhum pedido pendente").
- **Ninguém aprova o próprio pedido** (`podeDecidirSolicitacao` e `firestore.rules`).
- As regras ficam na **camada de serviços** (`permissoes.ts`: `ehGestao`, `podeVer*`; `restricaoPerfil` no Firebase) e nas `firestore.rules`, não só nas telas. As telas exclusivas do RH / Gestão no totem usam `ExigePerfil`; rotas desconhecidas do totem voltam ao menu.
- Totem: saída automática de 2 min (`TotemShell`), logs com origem `totem`, documentos `sigiloso` nunca aparecem lá. O painel aberto a partir do totem (botão do menu ou link da tela de descanso) herda a saída de 2 min (`src/lib/sessaoTotem.ts`).
- Extrato: seções escolhidas, A4 (`@media print`), código `SYN-XXXX-XXXX` + QR para `/verificar/CODIGO`, sem CPF, log `impressao`; coleção `extratos` guarda só campos de verificação (`src/services/extratos.ts`).
- **Painel** (`/admin`): só RH / Gestão, todas as unidades: fichas, busca por matrícula/nome e por nº de processo, talentos, indicadores e alertas, solicitações, documentos, processos, relatórios, logs, usuários. Usável em tela de toque (`pointer-coarse:` no `ui.tsx`/menu; `Tabela` com rolagem horizontal).
- Páginas públicas: `/privacidade` e `/verificar/:codigo`.

## Solução (resumo da PROPOSTA)
- Sistema único em que tudo fica ligado à **matrícula** (prontuário), no computador e num **totem** (touch, área interna, login obrigatório).
- **Ficha do servidor em 5 blocos**: dados básicos · lotação e movimentações · tempo de serviço e aposentadoria · cursos e capacitações (com documentos) · perfil e talentos. Selo "Ficha atualizada há X meses".
- **Painel de indicadores**, **alerta de risco por unidade**, **busca de talentos** com filtros combinados, **autoatendimento** com aprovação e **LGPD visível**.
- Busca de documentos e localização física (acervo), mantida da etapa anterior.
- Perfis: `servidor` = Policial (só a própria ficha; envia atualizações) e `admin` = RH / Gestão (vê e edita tudo, de todas as unidades; aprova atualizações, nunca as próprias).

## Stack
React + Vite + TypeScript + TailwindCSS (v4, via `@tailwindcss/vite`) + React Router + Firebase (Auth e Firestore) + lucide-react. Deploy na Vercel.

## Estrutura
- `docs/PROPOSTA.md` — especificação oficial · `docs/SHAREPOINT.md` — plano de integração com o SharePoint (correspondência de listas, login, permissões, implantação, diagrama)
- `src/config/regrasRH.ts` — **único** arquivo de regras configuráveis: aposentadoria (idade e tempo mínimos), horizonte de 5 anos, competência rara, limites do alerta, grupo mínimo de privacidade (5), ficha desatualizada (12 meses), tempo do totem (2 min / aviso 15 s)
- `src/lib/rh.ts` — regras de negócio puras (aposentadoria, alertas, talentos, privacidade, "atualizada há X meses")
- `src/pages` — telas (rotas) · `src/components` — UI reutilizável (`ficha/FichaBlocos.tsx` = os 5 blocos)
- `src/services` — **única** camada de acesso a dados (interfaces + implementações)
  - `tipos.ts` — contrato `DataProvider`; `index.ts` — escolhe o provedor e envolve tudo com o registro automático de `LogAcesso`
  - `permissoes.ts` — regras de perfil; **devem ficar idênticas às de `firestore.rules`** (mudou uma, mude a outra)
  - `autoatendimento.ts` — validação dos pedidos e o que muda na ficha ao aprovar (compartilhado pelos provedores)
  - `firebase/` — implementação Firebase · `local/` — modo demonstração no navegador · `sharepoint/` — **esqueleto não ligado**: cada função lança "Integração SharePoint não configurada" e comenta a chamada Graph prevista. `VITE_DATA_PROVIDER=sharepoint` faz o `App.tsx` mostrar a tela `SharePointPrevisto` (ver `docs/SHAREPOINT.md`)
- Telas que buscam dados recebem um `Contexto` (`useContextoAcesso('totem' | 'painel')`). Não registre logs manualmente para consulta/visualização/edição: o wrapper em `services/index.ts` já faz isso.
- `src/types` — tipos de domínio · `src/hooks` — hooks · `src/data` — dados fictícios (seed)

## Regras (obrigatórias)
1. **Interface 100% em português do Brasil** (textos, mensagens de erro, rótulos, datas no formato brasileiro).
2. **TODOS os dados são fictícios.** Nunca usar nomes, CPFs, matrículas ou processos reais. CPF sempre mascarado (ex.: `***.456.789-**`); nunca armazenar CPF completo.
   - **Matrícula é sempre texto de exatamente 4 dígitos; zeros à esquerda contam** ("0001" ≠ "1"). Nunca converter para número (`PADRAO_MATRICULA`/`limparMatricula` em `src/lib/texto.ts`, `matriculaValida` em `firestore.rules`).
   - **Duas contas de demonstração, ambas com o nome "Camila"** e senha `syntra123`: **0001 = Policial** (Delegacia de Teresina) e **0002 = RH / Gestão** (Superintendência). Demais servidores fictícios: 0003–0030 (a 0003 é a antiga linha da gestora de Parnaíba, hoje "Marcela Torres Ibiapina").
   - O cenário fictício é intencional (Parnaíba e Corrente em vermelho, Superintendência e Picos em amarelo, Teresina e Floriano em verde; pedidos pendentes em Parnaíba e Teresina, e um pedido próprio da 0002 que ela não pode aprovar). A ordem das linhas do quadro em `src/data/seed.ts` sustenta o gerador e os vínculos: preserve-a.
   - Ao mudar os dados fictícios, suba a `VERSAO` em `src/services/local/index.ts` (atual: `v6`) para o navegador descartar o acervo antigo.
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
