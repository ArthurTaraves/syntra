import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-marinho-100">
      <h2 className="mb-3 text-xl font-bold text-marinho-900">{titulo}</h2>
      <div className="space-y-2 text-marinho-950 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  )
}

export default function Privacidade() {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh bg-fundo">
      <header className="flex items-center justify-between gap-4 bg-marinho-900 px-4 py-4 sm:px-8">
        <Logo tamanho="sm" />
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/totem'))}
          className="flex min-h-12 items-center gap-2 rounded-xl bg-marinho-700 px-4 font-semibold text-white">
          <ArrowLeft className="size-5" /> Voltar
        </button>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8 text-lg">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-10 text-marinho-700" aria-hidden />
          <div>
            <h1 className="text-3xl font-extrabold text-marinho-900">Privacidade e proteção de dados</h1>
            <p className="text-base text-marinho-700">Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018 (LGPD)</p>
          </div>
        </div>

        <Secao titulo="Quais dados o SYNTRA trata">
          <ul>
            <li><strong>Dados funcionais do servidor</strong>: nome, matrícula, cargo, lotação, situação funcional, data de ingresso e e-mail institucional.</li>
            <li><strong>CPF apenas mascarado</strong> (ex.: ***.456.789-**). O CPF completo nunca é armazenado nem exibido.</li>
            <li><strong>Ficha do servidor</strong>: lotação e histórico de movimentações, data de nascimento e de ingresso (para a previsão de aposentadoria), cursos e capacitações, competências e indicações para oportunidades.</li>
            <li><strong>Metadados de documentos e processos</strong>: título, tipo, número do processo, datas, status e localização física do arquivo.</li>
            <li><strong>Atualizações enviadas pelo próprio servidor</strong> (autoatendimento) e a decisão do gestor ou do RH.</li>
            <li><strong>Registros de acesso</strong>: quem consultou, visualizou, alterou ou imprimiu cada informação, quando e de onde (totem ou painel).</li>
            <li><strong>Extratos emitidos</strong>: código de verificação, nome, matrícula, data de emissão e quais seções foram impressas.</li>
          </ul>
        </Secao>

        <Secao titulo="Para quê">
          <ul>
            <li>Reunir num só lugar, ligado à matrícula, as informações hoje espalhadas em vários sistemas e planilhas.</li>
            <li>Permitir que o servidor consulte a própria ficha e localize seus documentos com rapidez.</li>
            <li>Apoiar o planejamento do RH: indicadores, previsão de aposentadorias, alerta de risco por unidade e busca de talentos.</li>
            <li>Garantir a rastreabilidade dos acessos, como exige a LGPD, e identificar documentos que faltam no acervo.</li>
          </ul>
          <p>Base legal: execução de políticas públicas e cumprimento de obrigação legal pela administração pública (LGPD, art. 7º, II e III, e art. 23).</p>
        </Secao>

        <Secao titulo="Quem pode acessar">
          <ul>
            <li><strong>No totem (Área do servidor)</strong>: qualquer pessoa, de qualquer perfil, consulta <strong>apenas a própria ficha</strong>, os próprios documentos e processos, e envia atualizações para aprovação.</li>
            <li><strong>No painel do RH (computador)</strong>: o <strong>gestor de unidade</strong> vê só os servidores da sua unidade e aprova as atualizações deles (nunca o próprio pedido); o <strong>RH / administrador</strong> vê e edita tudo, incluindo os registros de acesso e o cadastro de usuários.</li>
            <li>Documentos <strong>sigilosos</strong> nunca aparecem no totem; só são acessados no painel administrativo por perfis autorizados.</li>
          </ul>
          <p>As mesmas regras são aplicadas no servidor de dados, e não apenas na tela.</p>
        </Secao>

        <Secao titulo="LGPD visível">
          <ul>
            <li>Cada acesso a uma ficha fica registrado (quem, quando e de onde), e o RH vê esse histórico na própria ficha.</li>
            <li>Relatórios e indicadores agregados <strong>não mostram grupos com menos de 5 pessoas</strong>, para que ninguém possa ser identificado.</li>
            <li>Previsões de aposentadoria são estimativas por regra simplificada e não substituem a análise oficial do RH.</li>
          </ul>
        </Secao>

        <Secao titulo="Impressão e verificação do extrato">
          <ul>
            <li>No totem, cada pessoa pode imprimir um <strong>extrato da própria ficha</strong>, escolhendo as seções. O <strong>CPF nunca é impresso</strong>.</li>
            <li>O extrato é <strong>informativo, sem valor de declaração oficial</strong>, e traz data, hora e um código de verificação com QR code.</li>
            <li>Cada impressão fica registrada no log de acessos.</li>
            <li>Na página pública <strong>/verificar</strong>, quem tem o código vê apenas: se o extrato é válido, nome, matrícula, data de emissão e seções impressas. Não é possível listar extratos nem ver outros dados da ficha.</li>
          </ul>
        </Secao>

        <Secao titulo="Segurança no totem">
          <ul>
            <li>O totem fica em área interna e exige login com matrícula e senha.</li>
            <li>A sessão é encerrada automaticamente após 2 minutos sem uso.</li>
            <li>Após 5 tentativas de senha incorretas, o acesso é bloqueado por 30 segundos.</li>
            <li>Os registros de acesso não podem ser alterados nem apagados.</li>
          </ul>
        </Secao>

        <Secao titulo="Seus direitos">
          <p>Você pode solicitar confirmação, acesso e correção dos seus dados ao setor de Gestão de Pessoas da Superintendência ou ao Encarregado pelo Tratamento de Dados Pessoais da PRF.</p>
        </Secao>

        <p className="text-center text-sm text-marinho-700">Protótipo acadêmico. Todos os dados exibidos são fictícios.</p>
      </main>
    </div>
  )
}
