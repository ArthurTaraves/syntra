import { Check, Printer, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { ExtratoImpressao } from '../../components/ficha/ExtratoImpressao'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro, useCarregar } from '../../hooks/useCarregar'
import { servicos } from '../../services'
import { ROTULO_SECAO_EXTRATO, SECOES_EXTRATO, type Extrato, type SecaoExtrato } from '../../types'

/** O policial escolhe as seções da PRÓPRIA ficha e imprime um extrato com código de verificação. */
export default function ImprimirExtrato() {
  const ctx = useContextoAcesso('totem')
  const { dados: servidor, carregando, erro } = useCarregar(() => servicos.servidores.obterPorMatricula(ctx.usuario.matricula, ctx), [ctx])
  const [secoes, setSecoes] = useState<SecaoExtrato[]>([...SECOES_EXTRATO])
  const [extrato, setExtrato] = useState<Extrato | null>(null)
  const [emitindo, setEmitindo] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  // Abre a janela de impressão assim que o extrato é emitido e desenhado.
  useEffect(() => {
    if (!extrato) return
    const t = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(t)
  }, [extrato])

  const alternar = (s: SecaoExtrato) => setSecoes((atual) => (atual.includes(s) ? atual.filter((x) => x !== s) : [...atual, s]))

  const emitir = async () => {
    setFalha(null)
    setEmitindo(true)
    try {
      // Registra o extrato (código de verificação) e o log de "impressao".
      setExtrato(await servicos.extratos.emitir(secoes, ctx))
    } catch (e) {
      setFalha(mensagemDeErro(e))
    } finally {
      setEmitindo(false)
    }
  }

  if (carregando) return <Carregando grande />
  if (erro) return <MensagemErro grande>{erro}</MensagemErro>
  if (!servidor) return <NenhumResultado grande titulo="Ficha não encontrada">Não há ficha vinculada à sua matrícula.</NenhumResultado>

  if (extrato)
    return (
      <>
        <div className="print:hidden">
          <TituloTotem titulo="Extrato pronto" subtitulo={`Código de verificação: ${extrato.codigo}`} />
          <div className="mb-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()}
              className="flex min-h-20 items-center gap-3 rounded-2xl bg-marinho-800 px-8 text-2xl font-bold text-white active:bg-marinho-700">
              <Printer className="size-8" aria-hidden /> Imprimir novamente
            </button>
            <button type="button" onClick={() => setExtrato(null)}
              className="flex min-h-20 items-center gap-3 rounded-2xl bg-white px-8 text-2xl font-semibold text-marinho-900 ring-2 ring-marinho-100">
              <RotateCcw className="size-8" aria-hidden /> Novo extrato
            </button>
          </div>
        </div>
        <ExtratoImpressao servidor={servidor} extrato={extrato} />
      </>
    )

  return (
    <>
      <TituloTotem titulo="Imprimir extrato da ficha" subtitulo="Escolha o que deve sair no papel. O CPF nunca é impresso." />
      <fieldset className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100">
        <legend className="sr-only">Seções do extrato</legend>
        {SECOES_EXTRATO.map((s) => {
          const marcado = secoes.includes(s)
          return (
            <button key={s} type="button" role="checkbox" aria-checked={marcado} onClick={() => alternar(s)}
              className={`flex min-h-20 items-center gap-4 rounded-2xl px-5 text-left text-2xl font-semibold ring-2 transition ${
                marcado ? 'bg-marinho-50 text-marinho-950 ring-marinho-600' : 'bg-white text-marinho-700 ring-marinho-100'
              }`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg border-4 ${marcado ? 'border-marinho-800 bg-marinho-800 text-white' : 'border-marinho-100'}`}>
                {marcado && <Check className="size-6" aria-hidden />}
              </span>
              {ROTULO_SECAO_EXTRATO[s]}
            </button>
          )
        })}
      </fieldset>
      <p className="mt-4 text-lg text-marinho-700">
        O extrato é um documento informativo, sem valor de declaração oficial. Ele sai com data, hora e um código de verificação com QR code.
      </p>
      {falha && <div className="mt-4"><MensagemErro grande>{falha}</MensagemErro></div>}
      <button type="button" onClick={emitir} disabled={emitindo || secoes.length === 0}
        className="mt-6 flex min-h-20 w-full items-center justify-center gap-3 rounded-2xl bg-marinho-800 text-2xl font-bold text-white active:bg-marinho-700 disabled:opacity-50">
        <Printer className="size-8" aria-hidden /> {emitindo ? 'Gerando…' : secoes.length === 0 ? 'Escolha pelo menos uma seção' : 'Gerar e imprimir'}
      </button>
    </>
  )
}
