# Contexto do projeto: SYNTRA

## O que é
SYNTRA (Sistema de Navegação, Tecnologia e Recuperação de Arquivos) é um protótipo
de sistema web de gestão de pessoas e documentos para a Superintendência Regional da
Polícia Rodoviária Federal no Piauí (PRF-PI). Ele responde a um desafio oficial de
projeto integrador (escola técnica / SENAI). Pode ser usado no computador e também
num totem de consulta (tela touch em ponto fixo da unidade).

- Repositório: https://github.com/ArthurTaraves/syntra
- Deploy: https://syntra-prf-pi.vercel.app (hoje em modo demonstração)

## A demanda oficial (o problema)
Título: "Fragmentação de Informações e Falta de Sistema Integrado na Gestão de Pessoas da PRF".

- Para ter as informações completas de um servidor, hoje é preciso acessar 9 sistemas
  ou sites diferentes, além de planilhas locais sem padrão.
- Isso gera retrabalho, dados inconsistentes e demora para atender a gestão.
- Informações como tempo de serviço, lotação, competências, capacitações e previsão de
  aposentadoria são cruzadas manualmente.
- Não existe banco de talentos estruturado.
- Não existe forma unificada de identificar perfis por critérios (tempo de atuação,
  qualificações, histórico funcional) para movimentações, capacitações e lideranças.

Benefícios esperados pela PRF: menos buscas manuais, melhor alocação por unidade,
planejamento com dados centralizados, banco de talentos, gestão do ciclo de vida
funcional (ingresso, movimentação, capacitação, aposentadoria), indicadores de RH,
mais agilidade e menos retrabalho.

## Restrições (o que a solução NÃO pode ter)
1. Custo alto de desenvolvimento ou manutenção.
2. Interface complexa ou difícil para gestores e usuários operacionais.
3. Falta de conformidade com a LGPD.
4. Acesso irrestrito ou inseguro a dados pessoais e funcionais dos servidores.

## A solução proposta
Um sistema único em que tudo fica ligado à matrícula do servidor, como um prontuário.
"Servidor" aqui é o funcionário da própria PRF (policial ou administrativo). O sistema
NÃO trata de cidadãos, multas ou veículos.

UM ÚNICO SITE, usado no computador (teclado e mouse) e no totem (toque). É o mesmo
sistema; só muda o tamanho e o formato da tela. O que cada pessoa vê depende do
nível de acesso da sua matrícula:

1. Policial (servidor): em qualquer aparelho, vê só a própria ficha, imprime o extrato,
   envia cursos/documentos e acompanha os próprios pedidos.
2. Gestor de unidade: tudo do policial + fichas dos servidores da própria unidade e
   aprovação de pedidos da unidade.
3. RH / superintendência: tudo do gestor, para todas as unidades + indicadores e alertas,
   banco de talentos, relatórios, documentos, processos, logs e usuários.

O RH trabalha principalmente no computador. Quando um gestor ou alguém da
superintendência visita uma unidade, faz login no totem com a própria matrícula e
acessa as funções do seu nível (consultar fichas, aprovar pedidos, abrir o painel
completo) sem depender de um computador.

### Ficha do servidor (5 blocos)
1. Dados básicos: nome, matrícula, cargo e informações funcionais.
2. Lotação e movimentações: unidade atual e histórico de transferências.
3. Tempo de serviço e aposentadoria: data de ingresso e previsão de aposentadoria.
4. Cursos e capacitações: formações e certificações (com documentos anexados).
5. Perfil e talentos: habilidades e indicações para oportunidades (ex.: liderança).

### Painel de indicadores
Servidores por unidade, servidores próximos da aposentadoria, capacitações e outros
números prontos, sem montagem manual.

### Rotina de atualização
O sistema precisa ter um fluxo claro de atualização para não ficar desatualizado.

## Diferenciais (a inovação)
1. Busca de talentos com filtros combinados
   (ex.: "curso X + mais de 10 anos de casa + lotado na unidade Y").
2. Alerta de risco por unidade: cruza previsão de aposentadoria com competências e
   mostra unidades que vão perder pessoas ou competências raras (verde/amarelo/vermelho).
3. Autoatendimento: o servidor envia cursos/documentos e o gestor aprova. Cada ficha
   mostra "atualizada há X meses".
4. LGPD visível: registro de quem acessou cada ficha e quando; relatórios agregados não
   mostram grupos pequenos (menos de 5 pessoas) para não identificar ninguém.
5. Extrato impresso com verificação: no totem, o policial imprime um extrato da própria
   ficha (seções à escolha), com código de verificação e QR code. Qualquer pessoa confere
   a autenticidade em /verificar/CODIGO. É um documento informativo, sem valor de
   declaração oficial, e reduz os pedidos ao RH.

O argumento de inovação: trazer recursos de planejamento que hoje só existem em
sistemas de RH caros, numa solução simples e de baixo custo, feita para a PRF-PI.

## Perfis de acesso
- RH / administrador: vê e edita tudo, de qualquer unidade.
- Gestor de unidade: vê só os servidores da própria unidade e aprova os pedidos deles
  (o próprio pedido do gestor é aprovado pelo RH).
- Servidor: vê só a própria ficha e envia atualizações para aprovação.
- As permissões valem igual no computador e no totem.

## Totem
- Mesmo site, em tela de toque. Login obrigatório (matrícula + senha).
- Menu do policial: Minha ficha, Meus documentos e processos, Enviar curso ou documento,
  Minhas solicitações, Imprimir extrato da ficha.
- Gestor e RH, no totem, veem o menu do policial + "Fichas dos servidores" (o gestor só
  da unidade), "Pedidos para aprovar" e "Abrir painel completo".
- Botões e textos grandes; teclado virtual em tela de toque e teclado físico no computador.
- Saída automática após 2 minutos sem uso. Fica em área interna da unidade.
- Por que totem e não só celular: segurança (aparelho da PRF, em modo quiosque, na rede
  interna, sem guardar dados, com saída automática e log de origem "totem"), impressão
  do extrato na hora, e acesso rápido para gestores e superintendência em visita às
  unidades.
- Hardware de baixo custo: tablet ou computador já existente + suporte antifurto +
  impressora. Começar com piloto em 1 ou 2 unidades.

## Stack e decisões técnicas
- React + TypeScript + Vite + TailwindCSS, deploy na Vercel.
- Firebase: Authentication (cadastro e login de usuários reais) e Firestore.
- Regras de segurança do Firestore garantem o acesso por perfil e unidade.
  É a LGPD funcionando no back-end, não só na tela.
- Matrículas com 4 dígitos.
- Manter um modo demonstração com dados fictícios. Contas de demonstração usam o
  nome "Camila" (uma para cada perfil).
- Nunca usar dados reais de servidores.
- Regra de aposentadoria: usar uma regra simplificada e configurável
  (idade e tempo de serviço mínimos). A regra exata seria definida pelo RH da PRF.
- Custo mensal do software: praticamente zero (planos gratuitos do Firebase e da Vercel).
- Custo de implantação: hardware dos totens (estimativa de R$ 5.000 a R$ 15.000, começando
  por um piloto mais barato).