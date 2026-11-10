import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { CardSolicitacao, resumoSolicitacao } from '../../components/ficha/ListaSolicitacoes'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro, useCarregar } from '../../hooks/useCarregar'
import { podeDecidirSolicitacao, servicos } from '../../services'
import type { Solicitacao } from '../../types'

/** Pedidos de autoatendimento pendentes que o usuário pode decidir (gestor: unidade, nunca os próprios; RH: todos). */
export default function PedidosTotem() {
  const ctx = useContextoAcesso('totem')
  const [recusando, setRecusando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const { dados, carregando, erro, recarregar } = useCarregar(() => servicos.solicitacoes.listar({ status: 'pendente' }, ctx), [ctx])

  const decidiveis = (dados ?? []).filter((s) => podeDecidirSolicitacao(ctx.usuario, s))
  const meusPendentes = (dados ?? []).filter((s) => s.matriculaServidor === ctx.usuario.matricula).length

  const decidir = async (s: Solicitacao, decisao: 'aprovada' | 'recusada') => {
    setOcupado(s.id)
    setMsg(null)
    try {
      await servicos.solicitacoes.decidir(s.id, decisao, decisao === 'recusada' ? motivo : undefined, ctx)
      setMsg({ ok: true, texto: `${decisao === 'aprovada' ? 'Aprovado' : 'Recusado'}: ${resumoSolicitacao(s).titulo} (${s.nomeServidor}).` })
      setRecusando(null)
      setMotivo('')
      recarregar()
    } catch (e) {
      setMsg({ ok: false, texto: mensagemDeErro(e) })
    } finally {
      setOcupado(null)
    }
  }

  const botao = 'flex min-h-16 items-center justify-center gap-2 rounded-2xl px-6 text-xl font-bold disabled:opacity-50'

  return (
    <>
      <TituloTotem titulo="Pedidos para aprovar"
        subtitulo={ctx.usuario.perfil === 'gestor' ? `Servidores da ${ctx.usuario.unidade}. Ao aprovar, a ficha é atualizada.` : 'Todas as unidades. Ao aprovar, a ficha é atualizada.'} />
      {msg && (
        <p role="status" className={`mb-5 rounded-2xl p-4 text-xl ${msg.ok ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-300' : 'bg-red-50 text-red-950 ring-1 ring-red-300'}`}>
          {msg.texto}
        </p>
      )}
      {meusPendentes > 0 && ctx.usuario.perfil === 'gestor' && (
        <p className="mb-5 rounded-2xl bg-marinho-50 p-4 text-lg text-marinho-900">
          Você tem {meusPendentes === 1 ? '1 pedido seu pendente' : `${meusPendentes} pedidos seus pendentes`}: eles são analisados pelo RH.
        </p>
      )}

      {carregando ? <Carregando grande /> : erro ? <MensagemErro grande>{erro}</MensagemErro> : decidiveis.length === 0 ? (
        <NenhumResultado grande titulo="Nenhum pedido pendente">Tudo em dia: não há atualizações aguardando a sua análise.</NenhumResultado>
      ) : (
        <ul className="flex flex-col gap-5">
          {decidiveis.map((s) => (
            <div key={s.id} className="flex flex-col gap-3">
              <CardSolicitacao s={s} grande
                mostrarServidor={<Link to={`/totem/ficha/${s.matriculaServidor}`} className="text-lg font-semibold text-marinho-800 underline-offset-2 hover:underline">{s.nomeServidor} · {s.matriculaServidor}</Link>}
                acoes={recusando === s.id ? undefined : (
                  <>
                    <button type="button" disabled={ocupado === s.id} onClick={() => { setRecusando(s.id); setMotivo('') }}
                      className={`${botao} bg-white text-marinho-900 ring-2 ring-marinho-100 active:bg-marinho-50`}>
                      <X className="size-7" aria-hidden /> Recusar
                    </button>
                    <button type="button" disabled={ocupado === s.id} onClick={() => decidir(s, 'aprovada')}
                      className={`${botao} bg-marinho-800 text-white active:bg-marinho-700`}>
                      <Check className="size-7" aria-hidden /> {ocupado === s.id ? 'Salvando…' : 'Aprovar'}
                    </button>
                  </>
                )} />
              {recusando === s.id && (
                <div className="flex flex-col gap-3 rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
                  <label className="flex flex-col gap-2">
                    <span className="text-xl font-semibold text-red-950">Motivo da recusa (o servidor verá este texto)</span>
                    <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus
                      className="rounded-2xl bg-white px-4 py-3 text-xl outline-none ring-4 ring-red-200 focus:ring-destaque-500" />
                  </label>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button type="button" onClick={() => setRecusando(null)} className={`${botao} bg-white text-marinho-900 ring-2 ring-marinho-100`}>Cancelar</button>
                    <button type="button" disabled={!motivo.trim() || ocupado === s.id} onClick={() => decidir(s, 'recusada')}
                      className={`${botao} bg-red-700 text-white active:bg-red-600`}>Confirmar recusa</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </ul>
      )}
    </>
  )
}
