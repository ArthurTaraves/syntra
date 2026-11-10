import { Link, useParams } from 'react-router-dom'
import { BadgeNivel, BadgeSituacao, BadgeStatus } from '../../components/Badges'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { CabecalhoPagina, Cartao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { formatarData, mascararCpf } from '../../lib/texto'
import { servicos } from '../../services'

/** Pasta funcional digital: dados do servidor + todos os documentos e processos vinculados. */
export default function FichaServidor() {
  const { matricula = '' } = useParams()
  const ctx = useContextoAcesso('painel')
  const { dados, carregando, erro } = useCarregar(async () => {
    // obterPorMatricula registra a visualização da pasta funcional no log.
    const servidor = await servicos.servidores.obterPorMatricula(matricula, ctx)
    if (!servidor) return null
    const [documentos, processos] = await Promise.all([
      servicos.documentos.buscar({ matriculaServidor: matricula }, ctx, { registrar: false }),
      servicos.processos.listar(ctx).then((ps) => ps.filter((p) => p.matriculaServidor === matricula)),
    ])
    return { servidor, documentos, processos }
  }, [matricula, ctx])

  if (carregando) return <Carregando />
  if (erro) return <MensagemErro>{erro}</MensagemErro>
  if (!dados) return <NenhumResultado titulo="Servidor não encontrado">O servidor não existe ou não pertence à sua unidade.</NenhumResultado>
  const { servidor: s, documentos, processos } = dados

  const campos: [string, string][] = [
    ['Matrícula', s.matricula],
    ['Cargo', s.cargo],
    ['Lotação', s.lotacao],
    ['Situação', s.situacao],
    ['Data de ingresso', formatarData(s.dataIngresso)],
    ['E-mail', s.email],
    ['CPF', mascararCpf(s.cpfMascarado)],
  ]

  return (
    <>
      <CabecalhoPagina titulo={s.nome} descricao="Pasta funcional digital" />
      <Cartao className="mb-6">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {campos.map(([r, v]) => (
            <div key={r}><dt className="text-xs font-semibold text-marinho-700">{r}</dt><dd className="text-sm text-marinho-950">{v}</dd></div>
          ))}
        </dl>
      </Cartao>

      <h2 className="mb-3 text-lg font-bold text-marinho-900">Documentos ({documentos.length})</h2>
      {documentos.length === 0 ? <NenhumResultado titulo="Nenhum documento">Esta pasta funcional ainda não tem documentos cadastrados.</NenhumResultado> : (
        <Tabela>
          <thead><tr><th>Documento</th><th>Processo</th><th>Data</th><th>Status</th><th>Localização física</th></tr></thead>
          <tbody>
            {documentos.map((d) => (
              <tr key={d.id}>
                <td><p className="font-semibold">{d.titulo}</p><p className="flex items-center gap-2 text-xs text-marinho-700">{d.tipo} <BadgeNivel nivel={d.nivelAcesso} /></p></td>
                <td className="whitespace-nowrap font-mono text-xs">{d.numeroProcesso}</td>
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
    </>
  )
}
