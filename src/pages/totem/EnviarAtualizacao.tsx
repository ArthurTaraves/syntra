import { Award, CheckCircle2, FileText, Paperclip, Send } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MensagemErro } from '../../components/Estados'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro } from '../../hooks/useCarregar'
import { hojeISO } from '../../lib/texto'
import { servicos } from '../../services'
import { AREAS_CAPACITACAO, TIPOS_DOCUMENTO, type AreaCapacitacao, type NovaSolicitacao, type TipoDocumento } from '../../types'

const campo = 'min-h-16 w-full rounded-2xl bg-white px-4 text-xl outline-none ring-4 ring-marinho-100 focus:ring-destaque-500'

function Rotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xl font-semibold text-marinho-800">{texto}</span>
      {children}
    </label>
  )
}

/** Autoatendimento: o servidor envia um curso ou documento; fica "pendente" até a aprovação. */
export default function EnviarAtualizacao() {
  const ctx = useContextoAcesso('totem')
  const [tipo, setTipo] = useState<'capacitacao' | 'documento'>('capacitacao')
  const [curso, setCurso] = useState({ nome: '', area: 'Operacional' as AreaCapacitacao, cargaHoraria: '', instituicao: '', dataConclusao: '' })
  const [docu, setDocu] = useState({ titulo: '', tipo: 'Capacitação' as TipoDocumento, descricao: '' })
  const [arquivo, setArquivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    const dados: NovaSolicitacao =
      tipo === 'capacitacao'
        ? { tipo, capacitacao: { ...curso, nome: curso.nome.trim(), instituicao: curso.instituicao.trim(), cargaHoraria: Number(curso.cargaHoraria) }, nomeArquivo: arquivo || undefined }
        : { tipo, documento: { ...docu, titulo: docu.titulo.trim(), descricao: docu.descricao.trim() }, nomeArquivo: arquivo || undefined }
    setEnviando(true)
    try {
      await servicos.solicitacoes.criar(dados, ctx)
      setEnviado(true)
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  if (enviado)
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
        <CheckCircle2 className="size-24 text-emerald-700" aria-hidden />
        <h1 className="text-4xl font-extrabold text-marinho-900">Enviado para aprovação</h1>
        <p className="text-2xl text-marinho-700">
          Seu pedido está <strong>pendente</strong>. Quando o RH / Gestão aprovar, ele entra na sua ficha e a data de atualização muda.
        </p>
        <Link to="/totem/minha-ficha" className="flex min-h-20 items-center rounded-2xl bg-marinho-800 px-10 text-2xl font-bold text-white active:bg-marinho-700">
          Voltar para minha ficha
        </Link>
      </div>
    )

  const opcao = (valor: typeof tipo, rotulo: string, Icone: typeof Award) => (
    <button type="button" onClick={() => setTipo(valor)} aria-pressed={tipo === valor}
      className={`flex min-h-20 flex-1 items-center justify-center gap-3 rounded-2xl text-2xl font-bold ring-4 transition ${
        tipo === valor ? 'bg-marinho-800 text-white ring-marinho-800' : 'bg-white text-marinho-900 ring-marinho-100'
      }`}>
      <Icone className="size-8" aria-hidden /> {rotulo}
    </button>
  )

  return (
    <>
      <TituloTotem titulo="Enviar atualização" subtitulo="O pedido fica pendente até a aprovação do RH / Gestão." voltarPara="/totem/minha-ficha" />
      <form onSubmit={enviar} className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100" noValidate>
        <div className="flex flex-col gap-3 sm:flex-row">
          {opcao('capacitacao', 'Curso ou capacitação', Award)}
          {opcao('documento', 'Outro documento', FileText)}
        </div>

        {tipo === 'capacitacao' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Rotulo texto="Nome do curso *"><input className={campo} value={curso.nome} onChange={(e) => setCurso({ ...curso, nome: e.target.value })} placeholder="Ex.: Atendimento Pré-Hospitalar" /></Rotulo>
            </div>
            <Rotulo texto="Área *">
              <select className={campo} value={curso.area} onChange={(e) => setCurso({ ...curso, area: e.target.value as AreaCapacitacao })}>
                {AREAS_CAPACITACAO.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Rotulo>
            <Rotulo texto="Carga horária (horas) *"><input className={campo} inputMode="numeric" value={curso.cargaHoraria} onChange={(e) => setCurso({ ...curso, cargaHoraria: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></Rotulo>
            <Rotulo texto="Instituição *"><input className={campo} value={curso.instituicao} onChange={(e) => setCurso({ ...curso, instituicao: e.target.value })} placeholder="Ex.: ENAP" /></Rotulo>
            <Rotulo texto="Data de conclusão *"><input className={campo} type="date" max={hojeISO()} value={curso.dataConclusao} onChange={(e) => setCurso({ ...curso, dataConclusao: e.target.value })} /></Rotulo>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Rotulo texto="Título do documento *"><input className={campo} value={docu.titulo} onChange={(e) => setDocu({ ...docu, titulo: e.target.value })} placeholder="Ex.: Diploma de especialização" /></Rotulo>
            </div>
            <Rotulo texto="Tipo">
              <select className={campo} value={docu.tipo} onChange={(e) => setDocu({ ...docu, tipo: e.target.value as TipoDocumento })}>
                {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Rotulo>
            <Rotulo texto="Observação"><input className={campo} value={docu.descricao} onChange={(e) => setDocu({ ...docu, descricao: e.target.value })} /></Rotulo>
          </div>
        )}

        <Rotulo texto="Anexar comprovante (opcional)">
          <span className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-dashed border-marinho-100 px-4 text-lg text-marinho-800">
            <Paperclip className="size-6 shrink-0" aria-hidden />
            <input type="file" accept=".pdf,image/*" className="w-full text-lg file:mr-4 file:min-h-12 file:rounded-xl file:border-0 file:bg-marinho-100 file:px-4 file:font-semibold file:text-marinho-900"
              onChange={(e) => setArquivo(e.target.files?.[0]?.name ?? '')} />
          </span>
          <span className="text-base text-marinho-700">
            No protótipo, só o nome do arquivo é registrado. O arquivo em si passa a ser guardado quando o armazenamento de arquivos for ligado.
          </span>
        </Rotulo>

        {erro && <MensagemErro grande>{erro}</MensagemErro>}
        <button type="submit" disabled={enviando}
          className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-marinho-800 text-2xl font-bold text-white active:bg-marinho-700 disabled:opacity-50">
          <Send className="size-8" aria-hidden /> {enviando ? 'Enviando…' : 'Enviar para aprovação'}
        </button>
      </form>
    </>
  )
}
