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
- RH / administrador: vê e edita tudo.
- Gestor de unidade: vê só os servidores da própria unidade e aprova atualizações.
- Servidor: vê a própria ficha e envia atualizações para aprovação.

## Modo totem
- Botões e textos grandes, navegação simples, pensada para toque.
- Login obrigatório (matrícula + senha).
- Saída automática após 1 a 2 minutos sem uso.
- O totem fica em área interna, não aberto ao público.
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