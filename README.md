# SYNTRA

**Sistema de Navegação, Tecnologia e Recuperação de Arquivos**
Protótipo acadêmico · Superintendência Regional da Polícia Rodoviária Federal no Piauí (PRF-PI) · Gestão de Pessoas

> ⚠️ **Todos os dados do protótipo são fictícios.** Nomes, matrículas, CPFs, datas e números de processo foram inventados.
>
> 📄 A especificação oficial está em [`docs/PROPOSTA.md`](docs/PROPOSTA.md).

---

## Objetivo

Ser um **sistema único de gestão de pessoas e documentos**, em que tudo fica ligado à matrícula do servidor, como um prontuário. Funciona no computador e num **totem de consulta** (tela touch em ponto fixo da unidade), com controle de acesso por perfil e LGPD aplicada também no back-end.

## Problema

A demanda oficial: **“Fragmentação de Informações e Falta de Sistema Integrado na Gestão de Pessoas da PRF”**.

- Para ter as informações completas de um servidor, hoje é preciso acessar **9 sistemas ou sites diferentes**, além de planilhas locais sem padrão.
- Tempo de serviço, lotação, competências, capacitações e previsão de aposentadoria são **cruzados manualmente**.
- Não existe **banco de talentos** nem forma unificada de identificar perfis para movimentações, capacitações e lideranças.
- Resultado: retrabalho, dados inconsistentes e demora para atender a gestão.

## Funcionalidades

### Ficha do servidor (5 blocos)
1. **Dados básicos**: nome, matrícula, cargo, situação e e-mail institucional. O CPF aparece sempre mascarado.
2. **Lotação e movimentações**: unidade atual e histórico de transferências.
3. **Tempo de serviço e aposentadoria**: ingresso, tempo de casa (com tempo averbado) e **previsão de aposentadoria**, sempre com aviso de estimativa.
4. **Cursos e capacitações**: com o **certificado anexado** no acervo, quando houver.
5. **Perfil e talentos**: competências (as **raras** ficam destacadas) e indicações (liderança, instrutoria…).

Toda ficha mostra **“Ficha atualizada há X meses”**, em amarelo quando passa de 12 meses.

### Painel de indicadores e diferenciais
- **Indicadores**: servidores por unidade, **próximos da aposentadoria (5 anos)** por unidade e por prazo, e capacitações por área.
- **Alerta de risco por unidade** (verde, amarelo ou vermelho): cruza as aposentadorias previstas com as competências e mostra as unidades que podem perder pessoas ou **competências raras**.
- **Busca de talentos com filtros combinados**: curso ou competência, tempo de casa, unidade e indicação. Exemplo: “Instrutor de tiro + mais de 10 anos + Superintendência”.
- **Autoatendimento**: o servidor envia um curso ou documento pela própria ficha (totem ou computador). O pedido fica **pendente** até o gestor da unidade ou o RH aprovar ou recusar (recusa exige motivo). Ao aprovar, a ficha é atualizada e a data muda.
- **LGPD visível**: o RH vê, na própria ficha, **quem a acessou e quando**. Os indicadores agregados **não mostram grupos com menos de 5 pessoas** (“dados insuficientes para preservar a privacidade”).

### Regras configuráveis
Tudo fica num único arquivo, [`src/config/regrasRH.ts`](src/config/regrasRH.ts):
- a regra simplificada de aposentadoria (hoje ilustrativa: **55 anos de idade + 30 de serviço**; a regra exata seria definida pelo RH da PRF);
- o horizonte do alerta;
- o critério de competência rara e os limites de cor;
- o grupo mínimo para os relatórios;
- o tempo de saída do totem.

### Duas áreas separadas
| Área | Quem usa | O que se vê |
|---|---|---|
| **Totem = Área do servidor** (`/totem`) | Qualquer policial (servidor, gestor e RH também) | **Só a própria ficha** |
| **Site do RH = painel** (`/admin`), no computador | Gestor de unidade e RH | Gestor: a própria unidade · RH: tudo |

### Totem: Área do servidor (`/totem`)
- Tela de descanso com data e hora, botão **“Toque para começar”** e link discreto **“Acesso do RH (painel)”**.
- Login obrigatório, com **matrícula de 4 dígitos** e senha.
  - Na tela de toque, usa um teclado virtual próprio.
  - No computador, aceita o teclado físico.
- **Bloqueio de 30 s após 5 tentativas erradas.**
- **Menu igual para todos os perfis:**
  - **Minha ficha** (5 blocos, sem CPF);
  - **Meus documentos e processos** (com a **localização física em destaque** e a linha do tempo dos processos);
  - **Enviar curso ou documento**;
  - **Minhas solicitações**;
  - **Imprimir extrato da ficha**.
- **Faixa de escopo** abaixo do “Olá”: “Aqui você consulta apenas a sua ficha”. Para gestor e RH, também: “Para gerenciar servidores, use o painel do RH no computador”.
- **Extrato da ficha:**
  - o policial escolhe as seções e imprime em **A4**;
  - sai com cabeçalho da PRF-PI, data e hora e o aviso “Documento informativo, sem valor de declaração oficial”;
  - leva um **código de verificação** (ex.: SYN-7K4Q-2M9X) e um **QR code**;
  - **sem CPF**;
  - cada impressão fica registrada no log.
- **Verificação pública** em `/verificar/CODIGO`: mostra se o extrato é válido, nome, matrícula, data e seções impressas.
- **Saída automática após 2 minutos sem uso**, com contagem regressiva nos últimos 15 s. O botão **Sair** fica sempre visível.
- O cabeçalho mostra o nome e o perfil. Documentos **sigilosos nunca aparecem no totem**.

### Site do RH: painel (`/admin`), gestor de unidade e RH
A busca por **matrícula ou nome** fica em “Fichas dos servidores”. A busca por **nº de processo**, com ou sem pontuação, fica em “Processos” e “Documentos”.
| Aba | Gestor | RH |
|---|:-:|:-:|
| **Indicadores e alertas** | ✔ (sua unidade) | ✔ |
| **Busca de talentos** | ✔ (sua unidade) | ✔ |
| **Fichas dos servidores** (5 blocos, documentos, processos) | ✔ (sua unidade) | ✔ |
| **“Quem acessou esta ficha”** | – | ✔ |
| **Solicitações** (aprovar/recusar autoatendimento) | ✔ (sua unidade, nunca o próprio pedido) | ✔ |
| **Documentos**: busca e filtros | ✔ | ✔ |
| Cadastrar, editar e arquivar documento | – | ✔ |
| **Processos**: linha do tempo e movimentação | ✔ | ✔ |
| **Relatórios do acervo** (Exportar PDF) | ✔ | ✔ |
| **Logs de acesso** (exportação CSV) e **Usuários** | – | ✔ |

### Segurança e LGPD
- **Toda consulta, visualização, download e edição gera um registro de acesso** (`LogAcesso`), inclusive as buscas sem resultado e as buscas de talentos.
- As regras de acesso valem **também no servidor** (`firestore.rules`): fichas por perfil e unidade, pedidos de autoatendimento criados só em nome próprio e aprovação conferida no mesmo lote de gravação.
- Logs só podem ser **criados**, nunca editados nem apagados. Só o RH lê.
- O **CPF fica sempre mascarado**. A página `/privacidade` explica quais dados são tratados, para quê e quem acessa.

## Perfis de acesso

| Perfil | O que vê e faz |
|---|---|
| **Servidor** | No totem: só a **própria ficha**, os próprios documentos e processos; envia atualizações para aprovação e imprime o extrato. Não acessa o painel. |
| **Gestor de unidade** | No painel: só os servidores da **própria unidade**; **aprova atualizações** da unidade (nunca o próprio pedido). No totem: só a própria ficha, como qualquer policial. |
| **RH / administrador** | No painel: **vê e edita tudo**, incluindo logs, usuários e cadastro de documentos. No totem: só a própria ficha. |

## Contas de demonstração

Senha de todas: **`syntra123`**. Todas se chamam “Camila”; o perfil aparece ao lado do nome no cabeçalho.

| Matrícula | Perfil | Unidade |
|---|---|---|
| **1001** | Servidor | Delegacia de Teresina |
| **1002** | Gestor de unidade | Delegacia de Parnaíba |
| **1003** | RH / administrador | Superintendência – Teresina |

**Matrículas têm exatamente 4 dígitos**: os demais servidores fictícios vão de 1004 a 1030. Uma matrícula com outro tamanho mostra “A matrícula tem 4 dígitos” e não conta como tentativa errada.

O acervo fictício tem **30 servidores, 120 documentos, 40 processos e 6 solicitações** em 6 lotações do Piauí, além de registros de acesso de exemplo dos últimos 30 dias. O cenário foi montado para a demonstração:
- **Delegacia de Parnaíba** (a da gestora 1002) e **Corrente** em **vermelho**: perdem competências raras com aposentadorias previstas.
- **Superintendência** e **Picos** em **amarelo**.
- **Teresina** e **Floriano** em **verde**.
- Parnaíba tem pedidos de autoatendimento pendentes para a gestora aprovar.

## Como rodar

Pré-requisito: **Node.js 20+**.

```bash
npm install
npm run dev
```

Acesse http://localhost:5173. **Sem nenhuma configuração**, o sistema roda em **modo demonstração**: os dados fictícios ficam no navegador (localStorage), com as mesmas regras de perfil. No painel, “Restaurar dados da demonstração” volta ao acervo original. Quando o formato do acervo fictício muda, a versão dos dados locais é atualizada e o navegador recarrega o acervo novo sozinho.

### Com Firebase (dados na nuvem)
1. Crie um projeto em https://console.firebase.google.com, ative **Authentication → E-mail/senha** e **Firestore Database**.
2. Copie `.env.example` para `.env` e preencha as variáveis `VITE_FIREBASE_*` (Configurações do projeto → Seus apps → Web).
3. Baixe uma chave de conta de serviço (Configurações do projeto → Contas de serviço → Gerar nova chave privada), salve como `serviceAccount.json` na raiz (já está no `.gitignore`) e confira `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json` no `.env`.
4. Publique as regras e os índices (veja abaixo) e popule o banco:
   ```bash
   npm run seed
   ```
5. `npm run dev`. Com o `.env` preenchido, o sistema passa a usar o Firebase automaticamente (ou force com `VITE_DATA_PROVIDER=firebase|local`).

### Comandos
| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checagem de tipos + build de produção |
| `npm run preview` | pré-visualiza o build |
| `npm run seed` | popula Firestore e Auth com os dados fictícios |
| `npm run lint` | análise estática (oxlint) |

## Como publicar

### Regras e índices do Firestore
```bash
npm install -g firebase-tools
firebase login
firebase use --add            # escolha o projeto e dê o apelido "default"
firebase deploy --only firestore:rules,firestore:indexes
```

### Vercel
1. Envie o projeto para um repositório no GitHub (o `.env` **não** vai junto).
2. Em https://vercel.com → **Add New → Project** → importe o repositório. A Vercel detecta Vite sozinha (build `npm run build`, saída `dist`).
3. Em **Settings → Environment Variables**, cadastre as seis variáveis `VITE_FIREBASE_*` com os mesmos valores do `.env` (Production e Preview). Para publicar só em modo demonstração, não cadastre nenhuma ou use `VITE_DATA_PROVIDER=local`.
4. Clique em **Deploy**. O `vercel.json` já redireciona todas as rotas para o `index.html` (SPA).
5. No Console do Firebase → **Authentication → Configurações → Domínios autorizados**, adicione o domínio gerado (ex.: `syntra.vercel.app`) e o domínio próprio, se houver.

Para usar como totem: abra `https://<seu-domínio>/totem` no tablet ou monitor touch em **modo quiosque** (ex.: Chrome com `--kiosk`, ou “Acesso guiado” no iPad / “Fixar tela” no Android).

## Arquitetura

```
src/
├── pages/        telas (totem/, admin/, Privacidade)
├── components/   UI reutilizável (TecladoVirtual, LinhaDoTempo, totem/, painel/)
├── hooks/        useAuth (AuthContext), useInatividade, useBloqueioLogin, useCarregar
├── services/     ÚNICA camada de acesso a dados
│   ├── tipos.ts        contrato DataProvider (interfaces)
│   ├── index.ts        escolhe o provedor + registro automático de logs (LGPD)
│   ├── permissoes.ts   regras de perfil (espelhadas em firestore.rules)
│   ├── firebase/       implementação Firebase Auth + Firestore
│   ├── local/          implementação no navegador (modo demonstração)
│   └── sharepoint/     README do caminho de migração (Microsoft Graph)
├── types/        tipos de domínio (Servidor, Documento, Processo, Usuario, LogAcesso)
├── data/         seed.ts: gerador de dados fictícios
└── lib/          normalização de texto, máscaras, datas
```

**Princípio central:** nenhuma tela importa o Firebase. Todas usam `servicos` (`src/services/index.ts`), que segue o contrato `DataProvider`. O registro de logs envolve o provedor inteiro, então nenhuma consulta escapa da auditoria.

### Caminho de migração para o SharePoint (Microsoft Graph)
Na implantação real na PRF, os dados passam para o **Microsoft SharePoint** do Microsoft 365 institucional:
- documentos → **biblioteca de documentos** com colunas de metadados; servidores, processos e logs → **listas**;
- login → **Microsoft Entra ID** (MSAL), com perfis definidos por grupos;
- basta implementar `criarProviderSharePoint()` seguindo o mesmo `DataProvider`. **Nenhuma tela muda.**

Detalhes e o mapeamento de cada operação para a Graph API: [`src/services/sharepoint/README.md`](src/services/sharepoint/README.md).

## Relação com os Objetivos de Desenvolvimento Sustentável (ONU)

| ODS | Meta | Como o SYNTRA contribui |
|---|---|---|
| **ODS 16** – Paz, justiça e instituições eficazes | **16.6** Desenvolver instituições eficazes, responsáveis e transparentes | Reduz o tempo de localização de documentos, elimina duplicidade e registra cada acesso (auditoria). |
| | **16.7** Garantir a tomada de decisão responsiva, inclusiva, participativa e representativa | O próprio servidor consulta e atualiza a sua ficha (autoatendimento com aprovação), e os indicadores, alertas e buscas sem resultado orientam decisões do RH. |
| **ODS 9** – Indústria, inovação e infraestrutura | **9.1** Desenvolver infraestrutura de qualidade, confiável, sustentável e resiliente | Infraestrutura digital acessível (totem touch + web), integrada ao ambiente Microsoft 365 já existente na instituição. |
| **ODS 8** – Trabalho decente e crescimento econômico | **8.2** Atingir níveis mais elevados de produtividade por meio da diversificação, modernização tecnológica e inovação | Libera os servidores do RH de buscas manuais repetitivas e reduz o tempo improdutivo de todos os servidores. |

## Estimativa de custo de implantação

**Faixa total estimada: R$ 5.000 a R$ 15.000** (valores de referência, a confirmar com cotação)

| Item | Estimativa |
|---|---|
| Totem físico: monitor touch 32″–43″ + mini PC + pedestal/suporte | R$ 4.000 – R$ 10.000 |
| Instalação elétrica e de rede no local do totem | R$ 300 – R$ 1.000 |
| Etiquetagem e organização inicial do arquivo físico (caixas e prateleiras) | R$ 500 – R$ 2.500 |
| Treinamento da equipe de RH e material de divulgação | R$ 200 – R$ 1.500 |
| Software: SharePoint / Microsoft 365 | R$ 0 (licenças institucionais já existentes) |
| Hospedagem do protótipo (Vercel + Firebase, planos gratuitos) | R$ 0 |

**Custo mensal de operação: praticamente zero** (planos gratuitos do Firebase e da Vercel).

O desenvolvimento do protótipo foi realizado no âmbito acadêmico. Na implantação, o principal custo é o equipamento do totem.

---

*Protótipo acadêmico, sem vínculo oficial com a Polícia Rodoviária Federal.*
