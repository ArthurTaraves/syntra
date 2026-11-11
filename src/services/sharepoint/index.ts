// Provedor SHAREPOINT (Microsoft 365 / Microsoft Graph) — ESQUELETO, ainda NÃO ligado.
//
// Implementa o mesmo contrato DataProvider dos provedores local e Firebase, mas cada
// função apenas lança "Integração SharePoint não configurada". O comentário de cada uma
// diz qual lista/biblioteca do site "SYNTRA – Gestão de Pessoas" e qual chamada do
// Microsoft Graph seria usada na implantação. Visão geral: docs/SHAREPOINT.md.
//
// Convenções usadas nos comentários:
//   {site}  = id do site do SharePoint (GET /sites/{tenant}.sharepoint.com:/sites/syntra)
//   {lista} = id ou nome da lista/biblioteca
//   Filtros por coluna exigem a coluna INDEXADA no SharePoint (ex.: Matricula).
//
// Nenhuma credencial fica no código: na implantação, os ids virão de variáveis VITE_SHAREPOINT_*.

import { ErroServico, type DataProvider } from '../tipos'

export const MSG_SHAREPOINT_NAO_CONFIGURADO = 'Integração SharePoint não configurada'

function naoConfigurado(): never {
  throw new ErroServico(MSG_SHAREPOINT_NAO_CONFIGURADO, 'nao-configurado')
}

export function criarProviderSharePoint(): DataProvider {
  return {
    nome: 'sharepoint',

    auth: {
      // Conta Microsoft institucional (Entra ID) via MSAL.js: msal.loginPopup() / loginRedirect().
      // Perfil: GET /me/memberOf → grupo "SYNTRA-RH-Gestao" = RH / Gestão; "SYNTRA-Policiais" = Policial.
      // Matrícula: GET /me?$select=displayName,employeeId (employeeId = matrícula de 4 dígitos, como texto).
      async entrar() {
        naoConfigurado()
      },
      // msal.logoutRedirect() (o log de "logout" é gravado antes pelo wrapper de services/index.ts).
      async sair() {
        naoConfigurado()
      },
      // msal.addEventCallback(LOGIN_SUCCESS/LOGOUT_SUCCESS) + msal.getActiveAccount() para a sessão atual.
      observar() {
        naoConfigurado()
      },
    },

    documentos: {
      // Biblioteca "Acervo Funcional" (metadados nas colunas). Filtros exatos:
      // GET /sites/{site}/lists/AcervoFuncional/items?$expand=fields&$filter=fields/MatriculaServidor eq '0001'
      // Busca por texto livre: POST /search/query (entityTypes: ["listItem"]), restrita ao site.
      async buscar() {
        naoConfigurado()
      },
      // GET /sites/{site}/lists/AcervoFuncional/items/{id}?$expand=fields
      async obterPorId() {
        naoConfigurado()
      },
      // GET /sites/{site}/lists/AcervoFuncional/items?$expand=fields
      //   &$filter=fields/NumeroProcesso eq '…' and fields/Tipo eq '…' and fields/MatriculaServidor eq '…'
      async verificarDuplicidade() {
        naoConfigurado()
      },
      // Arquivo: PUT /sites/{site}/drive/root:/{Lotacao}/{arquivo}:/content
      // Metadados: PATCH /sites/{site}/drive/items/{itemId}/listItem/fields
      async criar() {
        naoConfigurado()
      },
      // PATCH /sites/{site}/lists/AcervoFuncional/items/{id}/fields
      async atualizar() {
        naoConfigurado()
      },
      // PATCH /sites/{site}/lists/AcervoFuncional/items/{id}/fields  { Status: "Arquivado", LocalizacaoFisica, DataArquivamento }
      async arquivar() {
        naoConfigurado()
      },
    },

    servidores: {
      // Lista "Servidores" (fichas). Policial: $filter=fields/Matricula eq '{própria}'; RH / Gestão: sem filtro.
      // GET /sites/{site}/lists/Servidores/items?$expand=fields&$top=999
      // Cursos (bloco 4): lista "Capacitacoes" com coluna de pesquisa para o servidor.
      async listar() {
        naoConfigurado()
      },
      // GET /sites/{site}/lists/Servidores/items?$expand=fields&$filter=fields/Matricula eq '0018'
      async obterPorMatricula() {
        naoConfigurado()
      },
    },

    processos: {
      // GET /sites/{site}/lists/Processos/items?$expand=fields (Policial: filtro pela própria matrícula)
      async listar() {
        naoConfigurado()
      },
      // GET /sites/{site}/lists/Processos/items/{id}?$expand=fields
      // + GET /sites/{site}/lists/Movimentacoes/items?$expand=fields&$filter=fields/ProcessoLookupId eq {id}
      async obterPorId() {
        naoConfigurado()
      },
      // GET /sites/{site}/lists/Processos/items?$expand=fields&$filter=fields/NumeroProcesso eq '08665.000123/2024-11'
      async obterPorNumero() {
        naoConfigurado()
      },
      // POST /sites/{site}/lists/Movimentacoes/items  { fields: { ProcessoLookupId, Data, Unidade, Descricao } }
      // + PATCH /sites/{site}/lists/Processos/items/{id}/fields  { UnidadeAtual, Situacao }
      async adicionarMovimentacao() {
        naoConfigurado()
      },
    },

    logs: {
      // POST /sites/{site}/lists/LogsAcesso/items  (o app só tem permissão de INCLUIR nesta lista)
      async registrar() {
        naoConfigurado()
      },
      // GET /sites/{site}/lists/LogsAcesso/items?$expand=fields&$filter=fields/Data ge '…'&$orderby=fields/Data desc
      async listar() {
        naoConfigurado()
      },
    },

    usuarios: {
      // Membros dos grupos do Entra ID: GET /groups/{id-SYNTRA-Policiais}/members e /groups/{id-SYNTRA-RH-Gestao}/members
      // ($select=displayName,employeeId,officeLocation → nome, matrícula, unidade)
      async listar() {
        naoConfigurado()
      },
      // Contas são criadas pela TI no Entra ID; o app só inclui no grupo:
      // POST /groups/{id-grupo}/members/$ref  { "@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/{userId}" }
      async criar() {
        naoConfigurado()
      },
      // Troca de grupo: DELETE /groups/{grupo-antigo}/members/{userId}/$ref + POST /groups/{grupo-novo}/members/$ref
      async alterarPerfil() {
        naoConfigurado()
      },
    },

    solicitacoes: {
      // Lista "Solicitacoes". Policial: $filter=fields/MatriculaServidor eq '{própria}'; RH / Gestão: todas.
      // GET /sites/{site}/lists/Solicitacoes/items?$expand=fields&$filter=fields/Status eq 'pendente'
      async listar() {
        naoConfigurado()
      },
      // POST /sites/{site}/lists/Solicitacoes/items  { fields: { …, Status: "pendente" } }
      // Anexo: PUT /sites/{site}/drive/root:/Autoatendimento/{arquivo}:/content
      async criar() {
        naoConfigurado()
      },
      // Lote: POST /$batch com PATCH Solicitacoes/items/{id}/fields + PATCH Servidores/items/{id}/fields
      // (+ POST no Acervo Funcional, se houver comprovante). Ninguém decide o próprio pedido.
      async decidir() {
        naoConfigurado()
      },
    },

    extratos: {
      // POST /sites/{site}/lists/Extratos/items  { fields: { Title: código, MatriculaServidor, NomeServidor, EmitidoEm, Secoes } }
      async emitir() {
        naoConfigurado()
      },
      // Verificação pública sem login: uma função de servidor (ex.: Azure Function) com permissão de aplicativo
      // faz GET /sites/{site}/lists/Extratos/items?$expand=fields&$filter=fields/Title eq 'SYN-XXXX-XXXX'
      // e devolve só os campos de verificação.
      async verificar() {
        naoConfigurado()
      },
    },
  }
}
