# SYNTRA

**Sistema de Navegação, Tecnologia e Recuperação de Arquivos**
Protótipo acadêmico · Superintendência Regional da Polícia Rodoviária Federal no Piauí (PRF-PI) · Gestão de Pessoas

> ⚠️ **Todos os dados do protótipo são fictícios.** Nomes, matrículas, CPFs, datas e números de processo foram inventados.
>
> 📄 A especificação oficial está em [`docs/PROPOSTA.md`](docs/PROPOSTA.md). A preparação para o SharePoint está em [`docs/SHAREPOINT.md`](docs/SHAREPOINT.md).

---

## Objetivo

Ser um **sistema único de gestão de pessoas e documentos**, em que tudo fica ligado à matrícula do servidor, como um prontuário. É **um único site**, usado no computador e num **totem de consulta** (tela touch em ponto fixo da unidade), com **dois níveis de acesso pela matrícula** e LGPD aplicada também no back-end.

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
- **Autoatendimento**: o servidor envia um curso ou documento pela própria ficha (totem ou computador). O pedido fica **pendente** até o RH / Gestão aprovar ou recusar (recusa exige motivo; **ninguém decide o próprio pedido**). Ao aprovar, a ficha é atualizada e a data muda.
- **LGPD visível**: o RH vê, na própria ficha, **quem a acessou e quando**. Os indicadores agregados **não mostram grupos com menos de 5 pessoas** (“dados insuficientes para preservar a privacidade”).

### Regras configuráveis
Tudo fica num único arquivo, [`src/config/regrasRH.ts`](src/config/regrasRH.ts):
- a regra simplificada de aposentadoria (hoje ilustrativa: **55 anos de idade + 30 de serviço**; a regra exata seria definida pelo RH da PRF);
- o horizonte do alerta;
- o critério de competência rara e os limites de cor;
- o grupo mínimo para os relatórios;
- o tempo de saída do totem.

### Um único site, dois níveis de acesso
O mesmo sistema roda no computador (teclado e mouse) e no totem (toque); só muda o formato da tela. O que cada pessoa vê depende do nível da sua matrícula:

| Nível | Totem e computador (`/totem`) | Painel completo (`/admin`) |
|---|---|---|
| **Policial** | **Só a própria ficha**: menu do policial | Não entra |
| **RH / Gestão** | Menu do policial + **Fichas dos servidores**, **Pedidos para aprovar** (com contador) e **Abrir painel completo** | Tudo, de **todas as unidades** |

### Totem (`/totem`)
- Tela de descanso com data e hora, botão **“Toque para começar”** e link discreto **“Acesso do RH / Gestão (painel)”**.
- Login obrigatório, com **matrícula de 4 dígitos** e senha.
  - Na tela de toque, usa um teclado virtual próprio.
  - No computador, aceita o teclado físico.
- **Bloqueio de 30 s após 5 tentativas erradas.**
- **Menu do policial** (nos dois níveis, cada um vê a **própria** ficha):
  - **Minha ficha** (5 blocos, sem CPF);
  - **Meus documentos e processos** (com a **localização física em destaque** e a linha do tempo dos processos);
  - **Enviar curso ou documento**;
  - **Minhas solicitações**;
  - **Imprimir extrato da ficha**.
- **Menu do RH / Gestão**: a seção **“Gestão de pessoas”** vem primeiro, logo abaixo do “Olá”, em destaque amarelo, e cabe sem rolar no totem vertical (1080×1920) e horizontal (1920×1080):
  - **Pedidos para aprovar**: com contador grande; aprovar ou recusar com motivo. O próprio pedido não aparece (ninguém aprova o próprio pedido);
  - **Fichas dos servidores**: busca por matrícula (4 dígitos) ou nome, em todas as unidades; ficha em 5 blocos, sem CPF;
  - **Abrir painel completo**: vai para `/admin`. Aberto a partir do totem, o painel também encerra após 2 minutos sem uso.

  Abaixo, a seção **“Minha ficha pessoal”** traz as 5 opções do policial em cards compactos.
- **Faixa abaixo do “Olá”**: Policial → “Aqui você consulta a sua ficha”. RH / Gestão → “Painel de gestão · X pedidos aguardando sua análise” (ou “Nenhum pedido pendente”).
- **Extrato da ficha:**
  - o policial escolhe as seções e imprime em **A4**;
  - sai com cabeçalho da PRF-PI, data e hora e o aviso “Documento informativo, sem valor de declaração oficial”;
  - leva um **código de verificação** (ex.: SYN-7K4Q-2M9X) e um **QR code**;
  - **sem CPF**;
  - cada impressão fica registrada no log.
- **Verificação pública** em `/verificar/CODIGO`: mostra se o extrato é válido, nome, matrícula, data e seções impressas.
- **Saída automática após 2 minutos sem uso**, com contagem regressiva nos últimos 15 s. O botão **Sair** fica sempre visível. Os acessos feitos aqui ficam no log com origem **“totem”**.
- O cabeçalho mostra o nome e o perfil. Documentos **sigilosos nunca aparecem no totem**.

### Painel completo (`/admin`): só RH / Gestão
Vale para todas as unidades. A busca por **matrícula ou nome** fica em “Fichas dos servidores”. A busca por **nº de processo**, com ou sem pontuação, fica em “Processos” e “Documentos”.
- **Indicadores e alertas** (todas as unidades) e **Busca de talentos**;
- **Fichas dos servidores** (5 blocos, documentos, processos) com **“Quem acessou esta ficha”**;
- **Solicitações** (aprovar/recusar autoatendimento; nunca o próprio pedido);
- **Documentos** (busca, filtros, cadastro, edição e arquivamento) e **Processos** (linha do tempo e movimentação);
- **Relatórios do acervo** (Exportar PDF), **Logs de acesso** (exportação CSV) e **Usuários**.

Também funciona em **tela de toque**: botões e campos com área de toque maior quando o aparelho é touch, e tabelas com rolagem horizontal.

### Segurança e LGPD
- **Toda consulta, visualização, download e edição gera um registro de acesso** (`LogAcesso`), inclusive as buscas sem resultado e as buscas de talentos.
- As regras de acesso valem **também no servidor** (`firestore.rules`): o Policial só lê a própria ficha, documentos (nunca sigilosos), processos e pedidos; pedidos de autoatendimento são criados só em nome próprio; só o RH / Gestão decide, e nunca o próprio pedido.
- Logs só podem ser **criados**, nunca editados nem apagados. Só o RH / Gestão lê.
- O **CPF fica sempre mascarado**. A página `/privacidade` explica quais dados são tratados, para quê e quem acessa.

## Perfis de acesso

| Perfil | O que vê e faz |
|---|---|
| **Policial** (`servidor`) | No totem e no computador: só a **própria ficha**, os próprios documentos, processos e pedidos; envia atualizações para aprovação e imprime o extrato. Não acessa o painel. |
| **RH / Gestão** (`admin`) | **Vê e edita tudo, de todas as unidades**: fichas, aprovação de pedidos (**nunca o próprio**), indicadores, talentos, documentos, processos, relatórios, logs e usuários. No totem: menu do policial + fichas, pedidos e painel completo. |

## Contas de demonstração

Senha das duas: **`syntra123`**. Ambas se chamam “Camila”; o perfil aparece ao lado do nome no cabeçalho.

| Matrícula | Perfil | Unidade |
|---|---|---|
| **0001** | Policial | Delegacia de Teresina |
| **0002** | RH / Gestão | Superintendência – Teresina |

**Matrículas são sempre texto de exatamente 4 dígitos, e os zeros à esquerda contam** (“0001” não é “1”). Os demais servidores fictícios vão de 0003 a 0030. Uma matrícula com outro tamanho mostra “A matrícula tem 4 dígitos” e não conta como tentativa errada.

O acervo fictício tem **30 servidores, 120 documentos, 40 processos e 6 solicitações** em 6 lotações do Piauí, além de registros de acesso de exemplo dos últimos 30 dias. O cenário foi montado para a demonstração:
- **Delegacia de Parnaíba** e **Corrente** em **vermelho**: perdem competências raras com aposentadorias previstas.
- **Superintendência** e **Picos** em **amarelo**.
- **Teresina** e **Floriano** em **verde**.
- Parnaíba e Teresina têm pedidos de autoatendimento pendentes para o RH / Gestão aprovar. A Camila 0002 também tem um pedido próprio pendente, que ela **não** pode aprovar.

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
5. `npm run dev`. Com o `.env` preenchido, o sistema passa a usar o Firebase automaticamente (ou force com `VITE_DATA_PROVIDER=firebase|local`; `sharepoint` mostra a tela de integração prevista, veja [`docs/SHAREPOINT.md`](docs/SHAREPOINT.md)).

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
│   └── sharepoint/     esqueleto do provedor SharePoint (Microsoft Graph), não ligado
├── types/        tipos de domínio (Servidor, Documento, Processo, Usuario, LogAcesso)
├── data/         seed.ts: gerador de dados fictícios
└── lib/          normalização de texto, máscaras, datas
```

**Princípio central:** nenhuma tela importa o Firebase. Todas usam `servicos` (`src/services/index.ts`), que segue o contrato `DataProvider`. O registro de logs envolve o provedor inteiro, então nenhuma consulta escapa da auditoria.

### Caminho de migração para o SharePoint (Microsoft Graph)
Na implantação real na PRF, os dados passam para o **Microsoft SharePoint** do Microsoft 365 institucional:
- documentos → **biblioteca de documentos** com colunas de metadados; servidores, processos e logs → **listas**;
- login → **Microsoft Entra ID** (MSAL), com perfis definidos por grupos;
- o provedor já existe como esqueleto em `src/services/sharepoint/index.ts` (cada função só lança "Integração SharePoint não configurada"); basta implementá-lo seguindo o mesmo `DataProvider`. **As telas não mudam.**
- com `VITE_DATA_PROVIDER=sharepoint`, o site mostra "Integração com SharePoint prevista para a implantação na PRF" em vez de quebrar.

📄 Plano completo (por que SharePoint, correspondência de listas e colunas, login, permissões por grupo, passo a passo e diagrama): [`docs/SHAREPOINT.md`](docs/SHAREPOINT.md).

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
