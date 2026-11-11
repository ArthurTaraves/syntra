# Migração para Microsoft SharePoint (Microsoft Graph API)

O SYNTRA foi construído para que a fonte de dados possa ser trocada **sem alterar nenhuma tela**.
Todas as telas usam apenas `servicos` (de `src/services/index.ts`), que segue o contrato
`DataProvider` definido em `src/services/tipos.ts`. Hoje existem duas implementações:

| Provedor | Pasta | Uso |
|---|---|---|
| Firebase (Auth + Firestore) | `src/services/firebase/` | protótipo publicado |
| Local (navegador) | `src/services/local/` | demonstração sem internet/credenciais |
| **SharePoint (Microsoft Graph)** | `src/services/sharepoint/` | **implantação na PRF** (esqueleto em `index.ts`, não ligado) |

O esqueleto `criarProviderSharePoint(): DataProvider` já está em `index.ts` (cada função só lança
"Integração SharePoint não configurada") e é escolhido com `VITE_DATA_PROVIDER=sharepoint`.
Plano completo: [`docs/SHAREPOINT.md`](../../../docs/SHAREPOINT.md). O registro automático de logs
(`comRegistroDeAcessos`) continua funcionando igual, pois envolve qualquer provedor.

## Mapeamento das entidades

| SYNTRA | SharePoint | Observações |
|---|---|---|
| `Documento` (metadados) | **Biblioteca de documentos** "Acervo Funcional" com colunas personalizadas (Tipo, NumeroProcesso, MatriculaServidor, Lotacao, LocalizacaoFisica, Status, NivelAcesso…) | O arquivo digitalizado fica na própria biblioteca; `urlArquivo` passa a ser o `webUrl` do item. |
| `Servidor` | **Lista** "Servidores" | Pode ser sincronizada com o sistema de RH oficial. |
| `Processo` + `historico` | **Lista** "Processos" + lista "Movimentacoes" (com coluna de pesquisa para o processo) | Ou integração direta com o SEI, se disponível. |
| `Usuario` / perfis | **Microsoft Entra ID** (antigo Azure AD): grupos `SYNTRA-Policiais` e `SYNTRA-RH-Gestao` | O perfil vem dos grupos do usuário, não de uma coleção própria. |
| `LogAcesso` | **Lista** "LogsAcesso" com permissão só de inclusão para o aplicativo | Complementada pelo log de auditoria nativo do Microsoft Purview. |

## Autenticação

- Login com a conta institucional via **MSAL.js** (`@azure/msal-browser`), substituindo matrícula + senha.
- Escopos delegados: `Sites.Read.All` (consulta) e `Sites.ReadWrite.All` (painel administrativo), concedidos pelo administrador do tenant.
- No totem, recomenda-se login por cartão/crachá ou QR Code integrado ao Entra ID, com sessão curta.

## Equivalência das operações (Microsoft Graph)

| Método do DataProvider | Chamada Graph |
|---|---|
| `documentos.buscar` | `GET /sites/{site-id}/lists/{lista}/items?$expand=fields&$filter=fields/MatriculaServidor eq '…'` (colunas indexadas) ou `POST /search/query` para busca textual |
| `documentos.obterPorId` | `GET /sites/{site-id}/lists/{lista}/items/{id}?$expand=fields` |
| `documentos.criar` | `PUT /sites/{site-id}/drive/root:/{pasta}/{arquivo}:/content` + `PATCH …/listItem/fields` |
| `documentos.atualizar` / `arquivar` | `PATCH /sites/{site-id}/lists/{lista}/items/{id}/fields` |
| `processos.adicionarMovimentacao` | `POST /sites/{site-id}/lists/Movimentacoes/items` |
| `logs.registrar` | `POST /sites/{site-id}/lists/LogsAcesso/items` |
| `auth.entrar` / `sair` | `msalInstance.loginPopup()` / `logoutRedirect()` + `GET /me/memberOf` para o perfil |

## Controle de acesso

As regras de `firestore.rules` passam a ser garantidas pelo SharePoint:
- **Permissões por item/pasta**: cada policial lê só os itens da própria matrícula; o grupo `SYNTRA-RH-Gestao` lê tudo.
- **Rótulos de confidencialidade (Purview)** para documentos sigilosos, que nunca são retornados ao app do totem.
- O app do totem usa um registro de aplicativo com escopo apenas de leitura.

## Etapas sugeridas de implantação

1. Criar o site do SharePoint "SYNTRA – Gestão de Pessoas" e as listas/biblioteca acima.
2. Registrar o aplicativo no Entra ID e configurar os grupos de perfil.
3. Implementar `criarProviderSharePoint()` seguindo `DataProvider`.
4. Migrar os metadados (exportação do Firestore → importação via Graph em lote).
5. Homologar com o RH e ativar o totem físico.
