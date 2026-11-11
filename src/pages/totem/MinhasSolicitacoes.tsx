import { Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { CardSolicitacao } from '../../components/ficha/ListaSolicitacoes'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { servicos } from '../../services'

/** O que o próprio policial enviou (autoatendimento) e a situação de cada pedido. */
export default function MinhasSolicitacoes() {
  const ctx = useContextoAcesso('totem')
  const { dados, carregando, erro } = useCarregar(
    async () =>
      // O RH / Gestão vê os pedidos de todos em "Pedidos para aprovar"; aqui só os da própria matrícula.
      (await servicos.solicitacoes.listar({ matriculaServidor: ctx.usuario.matricula }, ctx)).filter((s) => s.matriculaServidor === ctx.usuario.matricula),
    [ctx],
  )

  return (
    <>
      <TituloTotem titulo="Minhas solicitações" subtitulo="Cursos e documentos que você enviou para atualizar a sua ficha." />
      <Link to="/totem/minha-ficha/enviar"
        className="mb-6 flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-destaque-500 px-8 text-2xl font-bold text-marinho-950 active:bg-destaque-400 sm:inline-flex">
        <Upload className="size-8" aria-hidden /> Enviar curso ou documento
      </Link>
      {carregando ? <Carregando grande /> : erro ? <MensagemErro grande>{erro}</MensagemErro> : !dados?.length ? (
        <NenhumResultado grande titulo="Nenhuma solicitação">Você ainda não enviou nenhuma atualização para a sua ficha.</NenhumResultado>
      ) : (
        <ul className="flex flex-col gap-4">{dados.map((s) => <CardSolicitacao key={s.id} s={s} grande />)}</ul>
      )}
    </>
  )
}
