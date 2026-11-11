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

O argumento de inovação: trazer recursos de planejamento que hoje só existem em
sistemas de RH caros, numa solução simples e de baixo custo, feita para a PRF-PI.

## Perfis de acesso
- RH / administrador: vê e edita tudo (no painel do RH).
- Gestor de unidade: vê só os servidores da própria unidade e aprova atualizações (no painel do RH).
- Servidor: vê a própria ficha e envia atualizações para aprovação (no totem).
- No totem, gestor e RH usam a "Área do servidor" como qualquer policial: só a própria ficha.

## Organização em duas áreas (decisão de projeto)
O sistema tem duas áreas bem separadas:

1. **Totem = "Área do servidor"** (`/totem`): o policial consulta a **própria** ficha.
   Vale para qualquer perfil (servidor, gestor e RH também são policiais), mas no totem
   **todos veem só a própria ficha**. Menu igual para todos:
   - Minha ficha
   - Meus documentos e processos
   - Enviar curso ou documento
   - Minhas solicitações
   - Imprimir extrato da ficha

   Faixa de aviso: "Aqui você consulta apenas a sua ficha"; para gestor e RH, acrescenta
   "Para gerenciar servidores, use o painel do RH no computador".
   **Não há** no totem busca de outros servidores, busca avançada nem aprovação de pedidos.
2. **Site do RH = painel** (`/admin`): só gestor e RH, no computador. Tudo que é cruzar
   dados fica aqui: fichas dos servidores, busca por matrícula/nome e por nº de processo,
   busca de talentos, indicadores e alertas, solicitações (aprovar/recusar), documentos,
   processos, relatórios, logs e usuários. Gestor vê só a própria unidade; RH vê tudo.

### Extrato da ficha (impresso no totem)
- O policial escolhe as seções e imprime: dados funcionais, lotação e movimentações,
  tempo de serviço e previsão de aposentadoria, cursos e capacitações, competências.
- Folha A4 com cabeçalho "PRF-PI · Gestão de Pessoas · Extrato da ficha funcional",
  data e hora, "Documento informativo, sem valor de declaração oficial", código de
  verificação (ex.: SYN-7K4Q-2M9X) e QR code para `/verificar/CODIGO`. Sem CPF.
- Cada impressão gera log ("impressao"). Os extratos emitidos ficam guardados (coleção
  `extratos`) só com os campos de verificação.
- Página pública `/verificar/:codigo`: mostra se o extrato é válido, nome, matrícula,
  data de emissão e seções impressas; código inválido → "Extrato não encontrado".

## Modo totem
- Botões e textos grandes, navegação simples, pensada para toque.
- Login obrigatório (matrícula + senha); teclado virtual em tela de toque.
- Saída automática após 2 minutos sem uso (aviso nos últimos 15 segundos).
- O totem fica em área interna, não aberto ao público; por isso o CPF não aparece na tela.
- Cabeçalho com nome e perfil; na tela inicial, link "Acesso do RH (painel)".
- O mesmo sistema funciona no navegador do computador.

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
- Custo mensal: praticamente zero (planos gratuitos do Firebase e da Vercel).