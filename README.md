# SYNTRA

**Sistema de Navegação, Tecnologia e Recuperação de Arquivos**
Protótipo acadêmico · Superintendência da Polícia Rodoviária Federal no Piauí (PRF-PI) · Gestão de Pessoas

> ⚠️ **Todos os dados do protótipo são fictícios.** Nomes, matrículas, CPFs e números de processo foram inventados.

---

## Objetivo

Centralizar e agilizar a consulta a documentos e processos funcionais dos servidores da PRF-PI, por meio de um **totem de consulta documental** (tela touch em modo quiosque) e de um **painel administrativo do RH**, com controle de acesso por perfil e registro de acessos conforme a LGPD.

## Problema

Os documentos e informações dos servidores estão **fragmentados** em pastas físicas, planilhas e sistemas diferentes. Na prática:

- servidores perdem tempo procurando documentos antigos e processos arquivados;
- o RH é acionado para localizar papéis que poderiam ser consultados diretamente;
- há **retrabalho** e **duplicidade** de documentos;
- não há registro de quem consultou o quê.

## Funcionalidades

### Totem de consulta (`/totem`)
- Tela de descanso com data e hora e botão **“Toque para começar”** (entra em tela cheia).
- Login por **matrícula de 4 dígitos** e senha. Em tela de toque, usa um **teclado virtual próprio** (numérico e alfanumérico); no computador, aceita o teclado físico (Enter avança, Tab funciona).
- **Bloqueio de 30 segundos após 5 tentativas erradas** seguidas.
- Menu com 4 opções: **nº de processo**, **matrícula ou nome do servidor**, **meus documentos** e **busca avançada** (tipo, período, status, lotação).
- Busca tolerante: ignora acentos e maiúsculas e aceita nº de processo **com ou sem pontuação**.
- Resultados em cards com a **localização física em destaque** (ex.: “Arquivo Central – Caixa 14 – Prateleira B”).
- Detalhe do documento com todos os metadados, **linha do tempo do processo** e “Visualizar arquivo”.
- **Logout automático após 60 s sem interação**, com contagem regressiva nos últimos 10 s. Botão **Sair** sempre visível.
- Documentos **sigilosos nunca aparecem no totem**.
- Interface pensada para monitor touch na **vertical (1080×1920) e na horizontal (1920×1080)**: botões de no mínimo 64 px e fontes grandes.

### Painel administrativo (`/admin`)
| Aba | Gestor | Admin |
|---|:-:|:-:|
| **Início**: totais, arquivados, em tramitação, cadastrados no mês, consultas no totem na semana | ✔ (sua unidade) | ✔ |
| **Documentos**: busca, filtros e paginação | ✔ | ✔ |
| Cadastrar, editar e arquivar documento (com validação, máscara de processo e **aviso de duplicidade**) | – | ✔ |
| **Servidores**: lista e **pasta funcional digital** (todos os documentos e processos do servidor) | ✔ | ✔ |
| **Processos**: lista, linha do tempo de tramitação e nova movimentação | ✔ | ✔ |
| **Relatórios**: gráficos, filtros por período e lotação, **Exportar PDF** | ✔ | ✔ |
| **Logs de acesso**: filtros e **exportação CSV** | – | ✔ |
| **Usuários**: listar, criar e alterar perfil | – | ✔ |

### Segurança e LGPD
- **Toda consulta, visualização, download e edição gera um registro de acesso** (`LogAcesso`), com origem *totem* ou *painel*, inclusive as **buscas sem resultado**.
- Regras de acesso aplicadas **também no servidor** (`firestore.rules`), não só na tela.
- Logs só podem ser **criados**: nunca editados nem apagados. Só o admin lê.
- **CPF sempre mascarado** (`***.456.789-**`); o CPF completo nunca é armazenado.
- Página `/privacidade` explica quais dados são tratados, para quê e quem acessa.

## Perfis de acesso

| Perfil | O que vê | Onde |
|---|---|---|
| **Servidor** | Os **próprios** documentos e os de nível **público interno**. Nunca os sigilosos. | Totem |
| **Gestor** | Os documentos dos servidores da **sua unidade** (lotação). | Totem e painel |
| **Admin** | **Tudo**, incluindo logs e usuários. Cadastra, edita e arquiva. | Totem e painel |

Níveis de acesso dos documentos: `publico-interno`, `restrito` e `sigiloso` (este nunca é exibido no totem).

## Contas de demonstração

Senha de todas as contas: **`syntra123`**

| Perfil | Matrícula | Nome (fictício) | Unidade |
|---|---|---|---|
| Servidor | **1001** | Camila | Delegacia de Teresina |
| Gestor | **1002** | Camila | Delegacia de Parnaíba |
| Admin | **1003** | Camila | Superintendência – Teresina |

As três contas se chamam “Camila”; o perfil aparece ao lado do nome no cabeçalho. **Todas as matrículas do sistema têm exatamente 4 dígitos**: as contas usam 1001–1003 e os demais servidores fictícios, 1004–1030. Uma matrícula digitada com outro tamanho mostra “A matrícula tem 4 dígitos” e **não conta** como tentativa errada para o bloqueio.

O acervo fictício tem **30 servidores, 120 documentos e 40 processos** em 6 lotações do Piauí, além de cerca de 390 registros de acesso de exemplo dos últimos 30 dias, que alimentam os relatórios.

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
| | **16.7** Garantir a tomada de decisão responsiva, inclusiva, participativa e representativa | O próprio servidor consulta sua pasta funcional pelo totem, e os relatórios (como as buscas sem resultado) orientam decisões do RH. |
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

O desenvolvimento do protótipo foi realizado no âmbito acadêmico. Na implantação, o principal custo é o equipamento do totem.

---

*Protótipo acadêmico, sem vínculo oficial com a Polícia Rodoviária Federal.*
