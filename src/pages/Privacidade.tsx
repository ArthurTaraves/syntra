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
            <li><strong>Metadados de documentos e processos</strong>: título, tipo, número do processo, datas, status e localização física do arquivo.</li>
            <li><strong>Registros de acesso</strong>: quem consultou, visualizou ou alterou cada informação, quando e de onde (totem ou painel).</li>
          </ul>
        </Secao>

        <Secao titulo="Para quê">
          <ul>
            <li>Permitir que o servidor localize seus documentos funcionais e processos com rapidez.</li>
            <li>Apoiar o setor de Gestão de Pessoas na organização do acervo, evitando retrabalho e duplicidade.</li>
            <li>Garantir a rastreabilidade dos acessos, como exige a LGPD, e identificar documentos que faltam no acervo.</li>
          </ul>
          <p>Base legal: execução de políticas públicas e cumprimento de obrigação legal pela administração pública (LGPD, art. 7º, II e III, e art. 23).</p>
        </Secao>

        <Secao titulo="Quem pode acessar">
          <ul>
            <li><strong>Servidor</strong>: os próprios documentos e os documentos de nível “público interno”.</li>
            <li><strong>Gestor</strong>: os documentos dos servidores da sua unidade.</li>
            <li><strong>Administrador do RH</strong>: todo o acervo, os registros de acesso e o cadastro de usuários.</li>
            <li>Documentos <strong>sigilosos</strong> nunca aparecem no totem; só são acessados no painel administrativo por perfis autorizados.</li>
          </ul>
          <p>As mesmas regras são aplicadas no servidor de dados, e não apenas na tela.</p>
        </Secao>

        <Secao titulo="Segurança no totem">
          <ul>
            <li>A sessão é encerrada automaticamente após 1 minuto sem uso.</li>
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
