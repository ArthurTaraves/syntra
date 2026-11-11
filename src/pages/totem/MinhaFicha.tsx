import { Inbox, Printer, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { FichaBlocos, SeloAtualizacao } from '../../components/ficha/FichaBlocos'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { servicos } from '../../services'

const acao = 'flex min-h-20 items-center justify-center gap-3 rounded-2xl px-6 text-xl font-bold'

/** A própria ficha do usuário logado (5 blocos) e os atalhos da área do servidor. */
export default function MinhaFicha() {
  const ctx = useContextoAcesso('totem')
  // No totem, obterPorMatricula só devolve a própria ficha (qualquer perfil) e registra o acesso.
  const { dados: s, carregando, erro } = useCarregar(() => servicos.servidores.obterPorMatricula(ctx.usuario.matricula, ctx), [ctx])

  if (carregando) return <Carregando texto="Abrindo sua ficha…" grande />
  if (erro) return <MensagemErro grande>{erro}</MensagemErro>
  if (!s)
    return (
      <>
        <TituloTotem titulo="Minha ficha" />
        <NenhumResultado grande titulo="Ficha não encontrada">Não há ficha vinculada à sua matrícula. Procure o setor de Gestão de Pessoas.</NenhumResultado>
      </>
    )

  return (
    <>
      <TituloTotem titulo="Minha ficha" subtitulo={`${s.nome} · matrícula ${s.matricula}`} />
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-md ring-1 ring-marinho-100">
        <SeloAtualizacao iso={s.fichaAtualizadaEm} grande />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/totem/minha-ficha/enviar" className={`${acao} bg-destaque-500 text-marinho-950 active:bg-destaque-400`}>
            <Upload className="size-7" aria-hidden /> Enviar curso ou documento
          </Link>
          <Link to="/totem/solicitacoes" className={`${acao} bg-white text-marinho-900 ring-2 ring-marinho-100 active:bg-marinho-50`}>
            <Inbox className="size-7" aria-hidden /> Minhas solicitações
          </Link>
          <Link to="/totem/extrato" className={`${acao} bg-white text-marinho-900 ring-2 ring-marinho-100 active:bg-marinho-50`}>
            <Printer className="size-7" aria-hidden /> Imprimir extrato
          </Link>
        </div>
      </div>

      {/* Totem em ponto fixo: o CPF não é exibido (nem mascarado). */}
      <FichaBlocos servidor={s} grande ocultarCpf linkDocumento={(id) => `/totem/documento/${id}`} />
    </>
  )
}
