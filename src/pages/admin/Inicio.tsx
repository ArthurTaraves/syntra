import { Archive, CalendarPlus, FileStack, MonitorSmartphone, Send, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro } from '../../components/Estados'
import { CabecalhoPagina, Cartao } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { podeVerLogs, servicos } from '../../services'

function Indicador({ rotulo, valor, Icone, nota }: { rotulo: string; valor: string | number; Icone: LucideIcon; nota?: string }) {
  return (
    <Cartao className="flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-marinho-900 text-destaque-500">
        <Icone className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-sm text-marinho-700">{rotulo}</p>
        <p className="text-3xl font-bold tabular-nums text-marinho-950">{valor}</p>
        {nota && <p className="text-xs text-marinho-700">{nota}</p>}
      </div>
    </Cartao>
  )
}

export default function Inicio() {
  const ctx = useContextoAcesso('painel')
  const admin = podeVerLogs(ctx.usuario)

  const { dados, carregando, erro } = useCarregar(async () => {
    const docs = await servicos.documentos.buscar({}, ctx, { registrar: false })
    const seteDias = new Date(Date.now() - 7 * 86400000).toISOString()
    const consultasTotem = admin
      ? (await servicos.logs.listar({ desde: seteDias, origem: 'totem', acao: 'consulta' }, ctx)).length
      : null
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    return {
      total: docs.length,
      arquivados: docs.filter((d) => d.status === 'Arquivado').length,
      tramitacao: docs.filter((d) => d.status === 'Em tramitação').length,
      noMes: docs.filter((d) => d.criadoEm >= inicioMes.toISOString()).length,
      consultasTotem,
    }
  }, [ctx, admin])

  return (
    <>
      <CabecalhoPagina titulo={`Olá, ${ctx.usuario.nome.split(' ')[0]}`}
        descricao={ctx.usuario.perfil === 'gestor' ? `Resumo dos documentos da sua unidade: ${ctx.usuario.unidade}` : 'Resumo do acervo de toda a Superintendência'} />
      {carregando && <Carregando />}
      {erro && <MensagemErro>{erro}</MensagemErro>}
      {dados && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Indicador rotulo="Total de documentos" valor={dados.total} Icone={FileStack} />
          <Indicador rotulo="Arquivados" valor={dados.arquivados} Icone={Archive} />
          <Indicador rotulo="Em tramitação" valor={dados.tramitacao} Icone={Send} />
          <Indicador rotulo="Cadastrados no mês" valor={dados.noMes} Icone={CalendarPlus} />
          <Indicador rotulo="Consultas no totem (7 dias)" valor={dados.consultasTotem ?? '—'} Icone={MonitorSmartphone}
            nota={dados.consultasTotem === null ? 'Disponível apenas para administradores (logs de acesso são restritos).' : undefined} />
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ['/admin/documentos', 'Consultar documentos', 'Busca, filtros e cadastro.'],
          ['/admin/servidores', 'Pastas funcionais', 'Todos os documentos e processos de cada servidor.'],
          ['/admin/relatorios', 'Relatórios', 'Indicadores do acervo e do uso do totem.'],
        ].map(([para, t, d]) => (
          <Link key={para} to={para} className="rounded-xl bg-white p-5 ring-1 ring-marinho-100 transition hover:ring-2 hover:ring-destaque-500">
            <p className="font-semibold text-marinho-900">{t}</p>
            <p className="text-sm text-marinho-700">{d}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
