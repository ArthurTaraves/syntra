import { AlertTriangle, Save } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Carregando, MensagemErro } from '../../components/Estados'
import { Aviso, Botao, CabecalhoPagina, Campo, Cartao, Entrada, Selecao } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro, useCarregar } from '../../hooks/useCarregar'
import { formatarData, hojeISO, mascararProcesso, PADRAO_PROCESSO } from '../../lib/texto'
import { ROTULO_NIVEL, servicos } from '../../services'
import { NIVEIS_ACESSO, STATUS_DOCUMENTO, TIPOS_DOCUMENTO, type DadosDocumento, type Documento, type Servidor } from '../../types'

type Form = Omit<DadosDocumento, 'palavrasChave' | 'nomeServidor' | 'lotacao' | 'urlArquivo'> & { palavrasChave: string; urlArquivo: string }
type Erros = Partial<Record<keyof Form, string>>

const VAZIO: Form = {
  titulo: '',
  tipo: 'Portaria',
  numeroProcesso: '',
  matriculaServidor: '',
  dataDocumento: hojeISO(),
  dataArquivamento: null,
  localizacaoFisica: '',
  status: 'Ativo',
  palavrasChave: '',
  urlArquivo: '',
  nivelAcesso: 'restrito',
}

function validar(f: Form): Erros {
  const e: Erros = {}
  if (f.titulo.trim().length < 5) e.titulo = 'Informe um título com pelo menos 5 caracteres.'
  if (!PADRAO_PROCESSO.test(f.numeroProcesso)) e.numeroProcesso = 'Use o formato 00000.000000/0000-00.'
  if (!f.matriculaServidor) e.matriculaServidor = 'Selecione o servidor.'
  if (!f.dataDocumento) e.dataDocumento = 'Informe a data do documento.'
  else if (f.dataDocumento > hojeISO()) e.dataDocumento = 'A data não pode estar no futuro.'
  if (f.status === 'Arquivado' && !f.dataArquivamento) e.dataArquivamento = 'Informe a data de arquivamento.'
  if (f.dataArquivamento && f.dataArquivamento < f.dataDocumento) e.dataArquivamento = 'Deve ser igual ou posterior à data do documento.'
  if (f.localizacaoFisica.trim().length < 5) e.localizacaoFisica = 'Informe onde o documento físico está guardado.'
  if (f.urlArquivo && !/^(https:\/\/|\/)/.test(f.urlArquivo)) e.urlArquivo = 'Use um endereço iniciado por https:// ou /.'
  return e
}

export default function FormDocumento() {
  const { id } = useParams()
  const editando = Boolean(id)
  const ctx = useContextoAcesso('painel')
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [duplicados, setDuplicados] = useState<Documento[] | null>(null)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const { dados, carregando, erro } = useCarregar(async () => {
    const [servidores, doc] = await Promise.all([
      servicos.servidores.listar(ctx),
      id ? servicos.documentos.obterPorId(id, ctx) : Promise.resolve(null),
    ])
    return { servidores, doc }
  }, [id, ctx])

  useEffect(() => {
    const d = dados?.doc
    if (d)
      setForm({
        titulo: d.titulo, tipo: d.tipo, numeroProcesso: d.numeroProcesso, matriculaServidor: d.matriculaServidor,
        dataDocumento: d.dataDocumento, dataArquivamento: d.dataArquivamento, localizacaoFisica: d.localizacaoFisica,
        status: d.status, palavrasChave: d.palavrasChave.join(', '), urlArquivo: d.urlArquivo ?? '', nivelAcesso: d.nivelAcesso,
      })
  }, [dados?.doc])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setDuplicados(null)
  }

  const salvar = async (e: FormEvent | null, ignorarDuplicidade = false) => {
    e?.preventDefault()
    setErroGeral(null)
    const v = validar(form)
    setErros(v)
    if (Object.keys(v).length) return
    const servidor = dados?.servidores.find((s: Servidor) => s.matricula === form.matriculaServidor)
    if (!servidor) return setErros({ matriculaServidor: 'Servidor não encontrado.' })

    setSalvando(true)
    try {
      if (!ignorarDuplicidade) {
        const dup = await servicos.documentos.verificarDuplicidade(form, ctx, id)
        if (dup.length) {
          setDuplicados(dup)
          setSalvando(false)
          return
        }
      }
      const dadosDoc: DadosDocumento = {
        ...form,
        titulo: form.titulo.trim(),
        localizacaoFisica: form.localizacaoFisica.trim(),
        dataArquivamento: form.status === 'Arquivado' ? form.dataArquivamento : null,
        palavrasChave: form.palavrasChave.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean),
        urlArquivo: form.urlArquivo.trim() || undefined,
        nomeServidor: servidor.nome,
        lotacao: servidor.lotacao,
      }
      if (id) await servicos.documentos.atualizar(id, dadosDoc, ctx)
      else await servicos.documentos.criar(dadosDoc, ctx)
      navigate('/admin/documentos')
    } catch (err) {
      setErroGeral(mensagemDeErro(err))
      setSalvando(false)
    }
  }

  if (carregando) return <Carregando />
  if (erro) return <MensagemErro>{erro}</MensagemErro>
  if (editando && !dados?.doc) return <MensagemErro>Documento não encontrado.</MensagemErro>

  return (
    <>
      <CabecalhoPagina titulo={editando ? 'Editar documento' : 'Cadastrar documento'} descricao="Campos marcados com * são obrigatórios." />
      <form onSubmit={(e) => salvar(e)} noValidate>
        <Cartao className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Campo rotulo="Título *" erro={erros.titulo}>
              <Entrada value={form.titulo} onChange={(e) => set('titulo', e.target.value)} aria-invalid={!!erros.titulo} />
            </Campo>
          </div>
          <Campo rotulo="Tipo de documento *">
            <Selecao value={form.tipo} onChange={(e) => set('tipo', e.target.value as Form['tipo'])}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Nº do processo (SEI) *" erro={erros.numeroProcesso} dica="Formato 00000.000000/0000-00 — a máscara é aplicada automaticamente.">
            <Entrada value={form.numeroProcesso} inputMode="numeric" placeholder="08665.000123/2024-11"
              onChange={(e) => set('numeroProcesso', mascararProcesso(e.target.value))} aria-invalid={!!erros.numeroProcesso} />
          </Campo>
          <Campo rotulo="Servidor *" erro={erros.matriculaServidor}>
            <Selecao value={form.matriculaServidor} onChange={(e) => set('matriculaServidor', e.target.value)} aria-invalid={!!erros.matriculaServidor}>
              <option value="">Selecione…</option>
              {dados?.servidores.map((s) => <option key={s.matricula} value={s.matricula}>{s.nome} — {s.matricula} ({s.lotacao})</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Nível de acesso *" dica="Documentos sigilosos nunca aparecem no totem.">
            <Selecao value={form.nivelAcesso} onChange={(e) => set('nivelAcesso', e.target.value as Form['nivelAcesso'])}>
              {NIVEIS_ACESSO.map((n) => <option key={n} value={n}>{ROTULO_NIVEL[n]}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Data do documento *" erro={erros.dataDocumento}>
            <Entrada type="date" value={form.dataDocumento} max={hojeISO()} onChange={(e) => set('dataDocumento', e.target.value)} aria-invalid={!!erros.dataDocumento} />
          </Campo>
          <Campo rotulo="Status *">
            <Selecao value={form.status} onChange={(e) => {
              const status = e.target.value as Form['status']
              setForm((f) => ({ ...f, status, dataArquivamento: status === 'Arquivado' ? f.dataArquivamento ?? hojeISO() : null }))
            }}>
              {STATUS_DOCUMENTO.map((s) => <option key={s}>{s}</option>)}
            </Selecao>
          </Campo>
          {form.status === 'Arquivado' && (
            <Campo rotulo="Data de arquivamento *" erro={erros.dataArquivamento}>
              <Entrada type="date" value={form.dataArquivamento ?? ''} onChange={(e) => set('dataArquivamento', e.target.value || null)} aria-invalid={!!erros.dataArquivamento} />
            </Campo>
          )}
          <div className="md:col-span-2">
            <Campo rotulo="Localização física *" erro={erros.localizacaoFisica} dica="Onde o papel está guardado. Ex.: Arquivo Central – Caixa 14 – Prateleira B">
              <Entrada value={form.localizacaoFisica} onChange={(e) => set('localizacaoFisica', e.target.value)} aria-invalid={!!erros.localizacaoFisica} />
            </Campo>
          </div>
          <Campo rotulo="Palavras-chave" dica="Separe por vírgulas.">
            <Entrada value={form.palavrasChave} onChange={(e) => set('palavrasChave', e.target.value)} placeholder="férias, escala" />
          </Campo>
          <Campo rotulo="Endereço do arquivo digital (opcional)" erro={erros.urlArquivo}>
            <Entrada value={form.urlArquivo} onChange={(e) => set('urlArquivo', e.target.value)} placeholder="https://…" aria-invalid={!!erros.urlArquivo} />
          </Campo>
        </Cartao>

        {duplicados && (
          <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4" role="alert">
            <p className="mb-2 flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="size-5" /> Possível duplicidade
            </p>
            <p className="mb-2 text-sm text-amber-950">
              Já existe documento com o <strong>mesmo nº de processo, tipo e servidor</strong>:
            </p>
            <ul className="mb-3 list-disc pl-6 text-sm text-amber-950">
              {duplicados.map((d) => (
                <li key={d.id}>
                  {d.titulo} — {formatarData(d.dataDocumento)} · {d.localizacaoFisica}{' '}
                  <Link className="underline" to={`/admin/documentos/${d.id}/editar`}>abrir</Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Botao variante="secundario" onClick={() => setDuplicados(null)}>Revisar dados</Botao>
              <Botao variante="destaque" onClick={() => salvar(null, true)} disabled={salvando}>Salvar mesmo assim</Botao>
            </div>
          </div>
        )}
        {erroGeral && <div className="mt-4"><Aviso tipo="alerta">{erroGeral}</Aviso></div>}

        <div className="mt-6 flex justify-end gap-2">
          <Link to="/admin/documentos"><Botao variante="secundario">Cancelar</Botao></Link>
          <Botao type="submit" disabled={salvando}><Save className="size-4" /> {salvando ? 'Salvando…' : 'Salvar'}</Botao>
        </div>
      </form>
    </>
  )
}
