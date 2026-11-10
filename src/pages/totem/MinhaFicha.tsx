import { Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { FichaBlocos, SeloAtualizacao } from '../../components/ficha/FichaBlocos'
import { CardSolicitacao } from '../../components/ficha/ListaSolicitacoes'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { servicos } from '../../services'

/** A própria ficha do usuário logado (5 blocos) + autoatendimento. */
export default function MinhaFicha() {
  const ctx = useContextoAcesso('totem')
  const { dados, carregando, erro } = useCarregar(async () => {
    const servidor = await servicos.servidores.obterPorMatricula(ctx.usuario.matricula, ctx)
    const solicitacoes = servidor ? await servicos.solicitacoes.listar({ matriculaServidor: ctx.usuario.matricula }, ctx) : []
    return { servidor, solicitacoes: solicitacoes.filter((s) => s.matriculaServidor === ctx.usuario.matricula) }
  }, [ctx])

  if (carregando) return <Carregando texto="Abrindo sua ficha…" grande />
  if (erro) return <MensagemErro grande>{erro}</MensagemErro>
  const s = dados?.servidor
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
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-md ring-1 ring-marinho-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <SeloAtualizacao iso={s.fichaAtualizadaEm} grande />
          <p className="text-lg text-marinho-700">Fez um curso ou tem um documento novo? Envie aqui; o gestor da unidade ou o RH aprova.</p>
        </div>
        <Link to="/totem/minha-ficha/enviar"
          className="flex min-h-20 shrink-0 items-center justify-center gap-3 rounded-2xl bg-destaque-500 px-8 text-2xl font-bold text-marinho-950 active:bg-destaque-400">
          <Upload className="size-8" aria-hidden /> Enviar curso ou documento
        </Link>
      </div>

      {/* Totem em ponto fixo: o CPF não é exibido (nem mascarado). */}
      <FichaBlocos servidor={s} grande ocultarCpf linkDocumento={(id) => `/totem/documento/${id}`} />

      <h2 className="mb-4 mt-8 text-3xl font-extrabold text-marinho-900">Minhas solicitações</h2>
      {dados.solicitacoes.length === 0 ? (
        <p className="text-xl text-marinho-700">Você ainda não enviou nenhuma atualização.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {dados.solicitacoes.map((x) => <CardSolicitacao key={x.id} s={x} grande />)}
        </ul>
      )}
    </>
  )
}
