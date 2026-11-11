import { Archive, FilePlus2, Pencil, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeNivel, BadgeStatus } from '../../components/Badges'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { ModalArquivar } from '../../components/painel/ModalArquivar'
import { Botao, CabecalhoPagina, Campo, Entrada, Paginacao, Selecao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { formatarData } from '../../lib/texto'
import { podeEditarDocumentos, ROTULO_NIVEL, servicos, type FiltrosDocumento } from '../../services'
import { LOTACOES, NIVEIS_ACESSO, STATUS_DOCUMENTO, TIPOS_DOCUMENTO, type Documento } from '../../types'

const POR_PAGINA = 15

export default function Documentos() {
  const ctx = useContextoAcesso('painel')
  const admin = podeEditarDocumentos(ctx.usuario)
  const [texto, setTexto] = useState('')
  const [filtros, setFiltros] = useState<FiltrosDocumento>({})
  const [pagina, setPagina] = useState(1)
  const [arquivando, setArquivando] = useState<Documento | null>(null)

  // Debounce do texto: cada busca efetiva gera um LogAcesso de consulta.
  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => ({ ...f, texto: texto.trim() || undefined })), 450)
    return () => clearTimeout(t)
  }, [texto])
  useEffect(() => setPagina(1), [filtros])

  const { dados, carregando, erro, recarregar } = useCarregar(() => servicos.documentos.buscar(filtros, ctx), [JSON.stringify(filtros), ctx])

  const set = <K extends keyof FiltrosDocumento>(k: K, v: string) => setFiltros((f) => ({ ...f, [k]: v || undefined }))
  const lista = dados ?? []
  const visiveis = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <>
      <CabecalhoPagina titulo="Documentos"
        descricao="Acervo documental de todos os servidores, de todas as unidades."
        acoes={admin && (
          <Link to="/admin/documentos/novo"><Botao variante="destaque"><FilePlus2 className="size-4" /> Cadastrar documento</Botao></Link>
        )} />

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 ring-1 ring-marinho-100 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Campo rotulo="Buscar">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-marinho-600" />
              <Entrada value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Título, servidor, matrícula, nº de processo, localização…" className="pl-9" />
            </div>
          </Campo>
        </div>
        <Campo rotulo="Tipo">
          <Selecao value={filtros.tipo ?? ''} onChange={(e) => set('tipo', e.target.value)}>
            <option value="">Todos</option>
            {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Status">
          <Selecao value={filtros.status ?? ''} onChange={(e) => set('status', e.target.value)}>
            <option value="">Todos</option>
            {STATUS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
          </Selecao>
        </Campo>
        {ctx.usuario.perfil === 'admin' && (
          <Campo rotulo="Lotação">
            <Selecao value={filtros.lotacao ?? ''} onChange={(e) => set('lotacao', e.target.value)}>
              <option value="">Todas</option>
              {LOTACOES.map((t) => <option key={t}>{t}</option>)}
            </Selecao>
          </Campo>
        )}
        <Campo rotulo="Nível de acesso">
          <Selecao value={filtros.nivelAcesso ?? ''} onChange={(e) => set('nivelAcesso', e.target.value)}>
            <option value="">Todos</option>
            {NIVEIS_ACESSO.map((t) => <option key={t} value={t}>{ROTULO_NIVEL[t]}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Data inicial"><Entrada type="date" value={filtros.dataInicio ?? ''} onChange={(e) => set('dataInicio', e.target.value)} /></Campo>
        <Campo rotulo="Data final"><Entrada type="date" value={filtros.dataFim ?? ''} onChange={(e) => set('dataFim', e.target.value)} /></Campo>
      </div>

      {carregando && !dados ? (
        <Carregando texto="Buscando documentos…" />
      ) : erro ? (
        <MensagemErro>{erro}</MensagemErro>
      ) : lista.length === 0 ? (
        <NenhumResultado>Nenhum documento corresponde aos filtros. Tente remover algum filtro ou buscar por outro termo.</NenhumResultado>
      ) : (
        <div className={carregando ? 'opacity-60' : ''}>
          <Tabela>
            <thead>
              <tr>
                <th>Documento</th><th>Servidor</th><th>Processo</th><th>Data</th><th>Status</th><th>Localização física</th>{admin && <th className="text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((d) => (
                <tr key={d.id}>
                  <td>
                    <p className="font-semibold text-marinho-950">{d.titulo}</p>
                    <p className="flex items-center gap-2 text-xs text-marinho-700">{d.tipo} <BadgeNivel nivel={d.nivelAcesso} /></p>
                  </td>
                  <td>
                    <Link to={`/admin/servidores/${d.matriculaServidor}`} className="text-marinho-800 underline-offset-2 hover:underline">{d.nomeServidor}</Link>
                    <p className="text-xs text-marinho-700">{d.matriculaServidor}</p>
                  </td>
                  <td className="whitespace-nowrap font-mono text-xs">{d.numeroProcesso}</td>
                  <td className="whitespace-nowrap">{formatarData(d.dataDocumento)}</td>
                  <td><BadgeStatus status={d.status} /></td>
                  <td className="text-xs">{d.localizacaoFisica}</td>
                  {admin && (
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/documentos/${d.id}/editar`} title="Editar" aria-label={`Editar ${d.titulo}`}
                          className="flex size-11 items-center justify-center rounded-lg text-marinho-800 hover:bg-marinho-50 active:bg-marinho-50 pointer-coarse:size-13"><Pencil className="size-4" /></Link>
                        {d.status !== 'Arquivado' && (
                          <button type="button" onClick={() => setArquivando(d)} title="Arquivar" aria-label={`Arquivar ${d.titulo}`}
                            className="flex size-11 items-center justify-center rounded-lg text-marinho-800 hover:bg-marinho-50 active:bg-marinho-50 pointer-coarse:size-13"><Archive className="size-4" /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Tabela>
          <Paginacao pagina={pagina} total={lista.length} porPagina={POR_PAGINA} aoMudar={setPagina} />
        </div>
      )}

      {arquivando && (
        <ModalArquivar doc={arquivando} ctx={ctx} aoFechar={() => setArquivando(null)} aoConcluir={() => { setArquivando(null); recarregar() }} />
      )}
    </>
  )
}
