import { Carregando, MensagemErro } from '../../components/Estados'
import { BadgeSituacao } from '../../components/Badges'
import { LinhaDoTempo } from '../../components/LinhaDoTempo'
import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { servicos } from '../../services'

/** Os próprios documentos (com localização física) e processos do policial logado. */
export default function MeusDocumentos() {
  const ctx = useContextoAcesso('totem')
  const u = ctx.usuario
  // No totem, os serviços já devolvem só o que é da própria matrícula (qualquer perfil).
  const { dados: processos, carregando, erro } = useCarregar(() => servicos.processos.listar(ctx), [ctx])

  return (
    <>
      <TituloTotem titulo="Meus documentos e processos" subtitulo={`${u.nome} · matrícula ${u.matricula}`} />

      <h2 className="mb-4 text-3xl font-extrabold text-marinho-900">Documentos</h2>
      <ResultadosTotem filtros={{ matriculaServidor: u.matricula }}
        dicaVazio="Ainda não há documentos na sua ficha. Procure o setor de Gestão de Pessoas." />

      <h2 className="mb-4 mt-10 text-3xl font-extrabold text-marinho-900">Processos</h2>
      {carregando ? <Carregando grande /> : erro ? <MensagemErro grande>{erro}</MensagemErro> : !processos?.length ? (
        <p className="text-xl text-marinho-700">Não há processos vinculados à sua matrícula.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 landscape:xl:grid-cols-2">
          {processos.map((p) => (
            <li key={p.id} className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-xl font-bold text-marinho-950">{p.numeroProcesso}</span>
                <BadgeSituacao situacao={p.situacao} grande />
              </div>
              <p className="text-xl text-marinho-900">{p.assunto}</p>
              <p className="mb-4 text-lg text-marinho-700">Unidade atual: <strong>{p.unidadeAtual}</strong></p>
              <LinhaDoTempo historico={p.historico} grande />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
