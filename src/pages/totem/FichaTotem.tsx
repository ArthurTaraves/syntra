import { useParams } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { FichaBlocos, SeloAtualizacao } from '../../components/ficha/FichaBlocos'
import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { servicos } from '../../services'

/** Ficha de outro servidor no totem (só RH / Gestão). CPF não é exibido. */
export default function FichaTotem() {
  // Matrícula vem da URL como texto ("0018"): nunca converter para número.
  const { matricula = '' } = useParams()
  const ctx = useContextoAcesso('totem')
  // obterPorMatricula registra o acesso à ficha no log (LGPD) e respeita o perfil.
  const { dados: s, carregando, erro } = useCarregar(() => servicos.servidores.obterPorMatricula(matricula, ctx), [matricula, ctx])

  if (carregando) return <Carregando texto="Abrindo ficha…" grande />
  if (erro) return <MensagemErro grande>{erro}</MensagemErro>
  if (!s)
    return (
      <>
        <TituloTotem titulo="Ficha do servidor" voltarPara={-1} />
        <NenhumResultado grande titulo="Ficha não encontrada">Não há servidor com a matrícula {matricula}.</NenhumResultado>
      </>
    )

  return (
    <>
      <TituloTotem titulo={s.nome} subtitulo={`Matrícula ${s.matricula} · ${s.lotacao}`} voltarPara={-1} />
      <div className="mb-6"><SeloAtualizacao iso={s.fichaAtualizadaEm} grande /></div>
      {/* Totem em ponto fixo: o CPF não é exibido (nem mascarado). */}
      <FichaBlocos servidor={s} grande ocultarCpf linkDocumento={(id) => `/totem/documento/${id}`} />
      <h2 className="mb-4 mt-8 text-3xl font-extrabold text-marinho-900">Documentos</h2>
      <ResultadosTotem filtros={{ matriculaServidor: s.matricula }} dicaVazio="Não há documentos desta ficha disponíveis no totem." />
    </>
  )
}
