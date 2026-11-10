# SYNTRA — Sistema de Navegação, Tecnologia e Recuperação de Arquivos

Protótipo acadêmico para a **Superintendência da Polícia Rodoviária Federal no Piauí (PRF-PI)**, área de **Gestão de Pessoas**.

## Problema
Documentos e informações dos servidores estão fragmentados em vários lugares (pastas, planilhas, sistemas). Servidores perdem tempo procurando documentos antigos e processos arquivados; há retrabalho e duplicidade.

## Solução
- **Totem de consulta documental**: interface touch em tela cheia (modo quiosque), acessada via site.
- **Painel administrativo do RH**: cadastro, edição, arquivamento, relatórios e auditoria.
- Busca por número de processo, matrícula, nome do servidor, tipo de documento e período.
- Controle de acesso por perfil (`servidor`, `gestor`, `admin`) e registro de acessos (LGPD).

## Stack
React + Vite + TypeScript + TailwindCSS (v4, via `@tailwindcss/vite`) + React Router + Firebase (Auth e Firestore) + lucide-react. Deploy na Vercel.

## Estrutura
- `src/pages` — telas (rotas)
- `src/components` — componentes de UI reutilizáveis
- `src/services` — **única** camada de acesso a dados (interfaces + implementações)
  - `tipos.ts` — contrato `DataProvider`; `index.ts` — escolhe o provedor e envolve tudo com o registro automático de `LogAcesso`
  - `permissoes.ts` — regras de perfil; **devem ficar idênticas às de `firestore.rules`** (mudou uma, mude a outra)
  - `src/services/firebase/` — implementação Firebase (usada quando o `.env` está preenchido)
  - `src/services/local/` — modo demonstração no navegador (usado sem `.env`)
  - `src/services/sharepoint/` — documentação do caminho de migração (Microsoft Graph)
- Telas que buscam dados recebem um `Contexto` (`useContextoAcesso('totem' | 'painel')`). Não registre logs manualmente para consulta/visualização/edição: o wrapper em `services/index.ts` já faz isso.
- `src/types` — tipos de domínio
- `src/hooks` — hooks React
- `src/data` — dados fictícios (mock/seed)
- `src/lib` — utilitários (formatação, normalização de texto etc.)

## Regras (obrigatórias)
1. **Interface 100% em português do Brasil** (textos, mensagens de erro, rótulos, datas no formato brasileiro).
2. **TODOS os dados são fictícios.** Nunca usar nomes, CPFs, matrículas ou processos reais. CPF sempre mascarado (ex.: `***.456.789-**`); nunca armazenar CPF completo.
3. **Nunca apagar, sobrescrever, mover ou renomear o `.env`**, nem rodar comandos que possam removê-lo (`git clean -x`, `git clean -fdx`, `git stash -u`, `git stash --all`, `rm -rf` na raiz etc.). Novas variáveis vão para o `.env.example`.
4. **Componentes de UI nunca acessam o Firebase diretamente** — nada de importar `firebase/*` em `src/pages`, `src/components` ou `src/hooks`. Todo acesso passa por `src/services`, para permitir trocar a implementação por SharePoint/Microsoft Graph no futuro.
5. Nenhuma chave ou credencial fixa no código: usar `import.meta.env.VITE_*`.
6. **Rodar `npm run build` ao final de cada etapa** e corrigir todos os erros de TypeScript antes de considerar a etapa concluída.

## Identidade visual
- Azul-marinho institucional como cor principal (`marinho-*` no tema Tailwind, em `src/index.css`).
- Amarelo como destaque (`destaque-*`).
- Fundo claro (`bg-fundo`), alto contraste (atender WCAG AA no mínimo).
- **Modo totem**: fontes grandes, botões com no mínimo 64px de altura, alvos de toque generosos, sem depender de hover.
- **Painel administrativo**: layout de desktop com menu lateral.

## Comandos
- `npm run dev` — servidor de desenvolvimento
- `npm run build` — checagem de tipos + build de produção
- `npm run preview` — pré-visualizar o build
- `npm run seed` — popula Firestore/Auth com os dados fictícios (exige `serviceAccount.json`, nunca versionado)
- `firebase deploy --only firestore:rules,firestore:indexes` — publica regras e índices
