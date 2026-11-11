import { Eye, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BadgeNivel, BadgeSituacao, BadgeStatus } from '../../components/Badges'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { FichaBlocos, SeloAtualizacao } from '../../components/ficha/FichaBlocos'
import { CardSolicitacao } from '../../components/ficha/ListaSolicitacoes'
import { CabecalhoPagina, Cartao, Tabela } from '../../components/painel/ui'
import { ALERTA_RISCO } from '../../config/regrasRH'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { contarCompetencias } from '../../lib/rh'
import { formatarData, formatarDataHora } from '../../lib/texto'
import { podeVerLogs, servicos } from '../../services'

/** Ficha do servidor (prontuário ligado à matrícula): 5 blocos + documentos, processos e acessos. */
export default function FichaServidor() {
  const { matricula = '' } = useParams()
  const ctx = useContextoAcesso('painel')
  const rh = podeVerLogs(ctx.usuario)

  const { dados, carregando, erro } = useCarregar(async () => {
    // obterPorMatricula registra no log "quem acessou esta ficha".
    const servidor = await servicos.servidores.obterPorMatricula(matricula, ctx)
    if (!servidor) return null
    const [documentos, processos, solicitacoes, todos] = await Promise.all([
      servicos.documentos.buscar({ matriculaServidor: matricula }, ctx, { registrar: false }),
      servicos.processos.listar(ctx).then((ps) => ps.filter((p) => p.matriculaServidor === matricula)),
      servicos.solicitacoes.listar({ matriculaServidor: matricula }, ctx),
      // O RH / Gestão vê todas as fichas: a raridade é calculada sobre toda a Superintendência.
      servicos.servidores.listar(ctx),
    ])
    // Pequena espera para o próprio acesso aparecer na lista (o log é gravado em segundo plano).
    const acessos = rh ? await new Promise((r) => setTimeout(r, 300)).then(() => servicos.logs.listar({ alvo: servidor.id }, ctx)) : null
    const raras = new Set([...contarCompetencias(todos)].filter(([, n]) => n <= ALERTA_RISCO.raridadeMaxPessoas).map(([c]) => c))
    return { servidor, documentos, processos, solicitacoes, acessos, raras }
  }, [matricula, ctx, rh])

  if (carregando) return <Carregando texto="Abrindo ficha…" />
  if (erro) return <MensagemErro>{erro}</MensagemErro>
  if (!dados) return <NenhumResultado titulo="Ficha não encontrada">Não há servidor com a matrícula {matricula}.</NenhumResultado>
  const { servidor: s, documentos, processos, solicitacoes, acessos, raras } = dados
  const pendentes = solicitacoes.filter((x) => x.status === 'pendente').length

  return (
    <>
      <CabecalhoPagina
        titulo={`${s.nome} · ${s.matricula}`}
        descricao={<span className="mt-1 inline-flex flex-wrap items-center gap-3">Ficha do servidor <SeloAtualizacao iso={s.fichaAtualizadaEm} /></span>}
      />

      <FichaBlocos servidor={s} competenciasRaras={raras} linkDocumento={() => null} />

      <h2 className="mb-3 mt-8 flex items-center gap-3 text-lg font-bold text-marinho-900">
        Atualizações enviadas pelo servidor ({solicitacoes.length})
        {pendentes > 0 && (
          <Link to="/admin/solicitacoes" className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-semibold text-amber-950 ring-1 ring-amber-400 hover:underline">
            {pendentes} pendente{pendentes > 1 ? 's' : ''} · analisar
          </Link>
        )}
      </h2>
      {solicitacoes.length === 0 ? (
        <p className="text-sm text-marinho-700">Nenhum envio de autoatendimento.</p>
      ) : (
        <ul className="flex flex-col gap-3">{solicitacoes.map((x) => <CardSolicitacao key={x.id} s={x} />)}</ul>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-marinho-900">Documentos ({documentos.length})</h2>
      {documentos.length === 0 ? <NenhumResultado titulo="Nenhum documento">Esta ficha ainda não tem documentos no acervo.</NenhumResultado> : (
        <Tabela>
          <thead><tr><th>Documento</th><th>Processo</th><th>Data</th><th>Status</th><th>Localização física</th></tr></thead>
          <tbody>
            {documentos.map((d) => (
              <tr key={d.id}>
                <td><p className="font-semibold">{d.titulo}</p><p className="flex items-center gap-2 text-xs text-marinho-700">{d.tipo} <BadgeNivel nivel={d.nivelAcesso} />{d.origemCadastro === 'autoatendimento' && <span className="rounded bg-marinho-50 px-1.5 text-marinho-800">autoatendimento</span>}</p></td>
                <td className="whitespace-nowrap font-mono text-xs">{d.numeroProcesso || '—'}</td>
                <td className="whitespace-nowrap">{formatarData(d.dataDocumento)}</td>
                <td><BadgeStatus status={d.status} /></td>
                <td className="text-xs">{d.localizacaoFisica}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-marinho-900">Processos ({processos.length})</h2>
      {processos.length === 0 ? <NenhumResultado titulo="Nenhum processo">Não há processos vinculados a este servidor.</NenhumResultado> : (
        <Tabela>
          <thead><tr><th>Nº do processo</th><th>Assunto</th><th>Situação</th><th>Unidade atual</th></tr></thead>
          <tbody>
            {processos.map((p) => (
              <tr key={p.id}>
                <td><Link className="font-mono text-xs text-marinho-800 hover:underline" to={`/admin/processos/${p.id}`}>{p.numeroProcesso}</Link></td>
                <td>{p.assunto}</td>
                <td><BadgeSituacao situacao={p.situacao} /></td>
                <td>{p.unidadeAtual}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      {/* LGPD visível: quem acessou esta ficha (somente o RH vê). */}
      {acessos && (
        <Cartao className="mt-8">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-marinho-900">
            <ShieldCheck className="size-5" aria-hidden /> Quem acessou esta ficha ({acessos.length})
          </h2>
          <p className="mb-3 text-xs text-marinho-700">Registro exigido pela LGPD. Visível apenas para o RH. Seu acesso de agora também foi registrado.</p>
          {acessos.length === 0 ? <p className="text-sm text-marinho-700">Nenhum acesso registrado.</p> : (
            <Tabela>
              <thead><tr><th>Data e hora</th><th>Quem</th><th>Unidade</th><th>De onde</th></tr></thead>
              <tbody>
                {acessos.slice(0, 50).map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap">{formatarDataHora(l.data)}</td>
                    <td className="flex items-center gap-2"><Eye className="size-4 text-marinho-600" aria-hidden /> {l.nomeUsuario}{l.uid === ctx.usuario.uid && <span className="text-xs text-marinho-700">(você)</span>}</td>
                    <td>{l.unidade}</td>
                    <td>{l.origem === 'totem' ? 'Totem' : 'Painel'}</td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
        </Cartao>
      )}
    </>
  )
}
