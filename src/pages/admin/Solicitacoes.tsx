import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { CardSolicitacao, resumoSolicitacao } from '../../components/ficha/ListaSolicitacoes'
import { Aviso, AreaTexto, Botao, CabecalhoPagina, Campo, Modal } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro, useCarregar } from '../../hooks/useCarregar'
import { podeDecidirSolicitacao, servicos } from '../../services'
import type { Solicitacao, StatusSolicitacao } from '../../types'

const ABAS: { id: StatusSolicitacao | 'todas'; rotulo: string }[] = [
  { id: 'pendente', rotulo: 'Pendentes' },
  { id: 'aprovada', rotulo: 'Aprovadas' },
  { id: 'recusada', rotulo: 'Recusadas' },
  { id: 'todas', rotulo: 'Todas' },
]

/** Autoatendimento: pedidos enviados pelos servidores, para o RH / Gestão decidir (nunca os próprios). */
export default function Solicitacoes() {
  const ctx = useContextoAcesso('painel')
  const [aba, setAba] = useState<StatusSolicitacao | 'todas'>('pendente')
  const [recusando, setRecusando] = useState<Solicitacao | null>(null)
  const [motivo, setMotivo] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'alerta' | 'sucesso'; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const { dados, carregando, erro, recarregar } = useCarregar(() => servicos.solicitacoes.listar({}, ctx), [ctx])

  const lista = (dados ?? []).filter((s) => aba === 'todas' || s.status === aba)
  const contagem = (st: StatusSolicitacao) => (dados ?? []).filter((s) => s.status === st).length

  const decidir = async (s: Solicitacao, decisao: 'aprovada' | 'recusada', motivoRecusa?: string) => {
    setOcupado(s.id)
    setMsg(null)
    try {
      await servicos.solicitacoes.decidir(s.id, decisao, motivoRecusa, ctx)
      const { titulo } = resumoSolicitacao(s)
      setMsg({
        tipo: 'sucesso',
        texto: decisao === 'aprovada' ? `Aprovado: ${titulo}. A ficha de ${s.nomeServidor} foi atualizada.` : `Recusado: ${titulo}. O servidor verá o motivo na ficha.`,
      })
      setRecusando(null)
      setMotivo('')
      recarregar()
    } catch (e) {
      setMsg({ tipo: 'alerta', texto: mensagemDeErro(e) })
    } finally {
      setOcupado(null)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Solicitações de atualização"
        descricao="Cursos e documentos enviados pelos servidores de todas as unidades (autoatendimento). Ao aprovar, a ficha é atualizada. Ninguém decide o próprio pedido." />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por situação">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ring-1 transition pointer-coarse:min-h-13 pointer-coarse:px-5 pointer-coarse:text-base ${aba === a.id ? 'bg-marinho-800 text-white ring-marinho-800' : 'bg-white text-marinho-900 ring-marinho-100 hover:bg-marinho-50'}`}>
            {a.rotulo}{a.id !== 'todas' && dados ? ` (${contagem(a.id)})` : ''}
          </button>
        ))}
      </div>
      {msg && <div className="mb-4"><Aviso tipo={msg.tipo}>{msg.texto}</Aviso></div>}

      {carregando ? <Carregando /> : erro ? <MensagemErro>{erro}</MensagemErro> : lista.length === 0 ? (
        <NenhumResultado titulo={aba === 'pendente' ? 'Nenhum pedido pendente' : 'Nenhuma solicitação'}>
          {aba === 'pendente' ? 'Tudo em dia: não há atualizações aguardando análise.' : 'Não há solicitações nesta situação.'}
        </NenhumResultado>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((s) => {
            const pode = podeDecidirSolicitacao(ctx.usuario, s)
            const proprio = s.status === 'pendente' && s.matriculaServidor === ctx.usuario.matricula
            return (
              <CardSolicitacao key={s.id} s={s}
                mostrarServidor={
                  <Link to={`/admin/servidores/${s.matriculaServidor}`} className="text-sm font-semibold text-marinho-800 hover:underline">
                    {s.nomeServidor} · {s.matriculaServidor} · {s.lotacao}
                  </Link>
                }
                acoes={pode ? (
                  <>
                    <Botao variante="secundario" disabled={ocupado === s.id} onClick={() => { setRecusando(s); setMotivo('') }}>
                      <X className="size-4" /> Recusar
                    </Botao>
                    <Botao disabled={ocupado === s.id} onClick={() => decidir(s, 'aprovada')}>
                      <Check className="size-4" /> {ocupado === s.id ? 'Salvando…' : 'Aprovar'}
                    </Botao>
                  </>
                ) : proprio ? (
                  <span className="rounded-lg bg-marinho-50 px-3 py-2 text-xs text-marinho-800">Seu pedido: será analisado por outra pessoa do RH / Gestão</span>
                ) : undefined} />
            )
          })}
        </ul>
      )}

      {recusando && (
        <Modal titulo="Recusar solicitação" aoFechar={() => setRecusando(null)}>
          <p className="mb-3 text-sm text-marinho-800">
            {resumoSolicitacao(recusando).titulo} — {recusando.nomeServidor}
          </p>
          <Campo rotulo="Motivo da recusa *" dica="O servidor verá este texto na própria ficha.">
            <AreaTexto rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus placeholder="Ex.: o certificado está ilegível; envie em PDF." />
          </Campo>
          <div className="mt-5 flex justify-end gap-2">
            <Botao variante="secundario" onClick={() => setRecusando(null)}>Cancelar</Botao>
            <Botao variante="perigo" disabled={!motivo.trim() || ocupado === recusando.id} onClick={() => decidir(recusando, 'recusada', motivo)}>
              Recusar pedido
            </Botao>
          </div>
        </Modal>
      )}
    </>
  )
}
