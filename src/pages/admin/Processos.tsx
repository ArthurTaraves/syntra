import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeSituacao } from '../../components/Badges'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { CabecalhoPagina, Entrada, Paginacao, Selecao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { contemTermos, formatarData, somenteDigitos } from '../../lib/texto'
import { servicos } from '../../services'
import { SITUACOES_PROCESSO } from '../../types'

const POR_PAGINA = 15

export default function Processos() {
  const ctx = useContextoAcesso('painel')
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState('')
  const [pagina, setPagina] = useState(1)
  const { dados, carregando, erro } = useCarregar(() => servicos.processos.listar(ctx), [ctx])

  const lista = useMemo(() => {
    const dig = somenteDigitos(busca)
    return (dados ?? [])
      .filter(
        (p) =>
          (contemTermos(busca, p.assunto, p.nomeServidor, p.matriculaServidor, p.numeroProcesso, p.unidadeAtual) ||
            (dig.length >= 4 && somenteDigitos(p.numeroProcesso).includes(dig))) &&
          (!situacao || p.situacao === situacao),
      )
      .map((p) => ({ ...p, ultima: [...p.historico].sort((a, b) => b.data.localeCompare(a.data))[0] }))
      .sort((a, b) => (b.ultima?.data ?? '').localeCompare(a.ultima?.data ?? ''))
  }, [dados, busca, situacao])

  return (
    <>
      <CabecalhoPagina titulo="Processos" descricao="Acompanhe a tramitação e registre movimentações." />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[3fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-marinho-600" />
          <Entrada aria-label="Buscar processo" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} placeholder="Nº do processo (com ou sem pontuação), assunto, servidor…" className="pl-9" />
        </div>
        <Selecao aria-label="Situação" value={situacao} onChange={(e) => { setSituacao(e.target.value); setPagina(1) }}>
          <option value="">Todas as situações</option>
          {SITUACOES_PROCESSO.map((s) => <option key={s}>{s}</option>)}
        </Selecao>
      </div>
      {carregando ? <Carregando /> : erro ? <MensagemErro>{erro}</MensagemErro> : lista.length === 0 ? (
        <NenhumResultado>Nenhum processo encontrado.</NenhumResultado>
      ) : (
        <>
          <Tabela>
            <thead><tr><th>Nº do processo</th><th>Assunto</th><th>Servidor</th><th>Situação</th><th>Unidade atual</th><th>Última movimentação</th></tr></thead>
            <tbody>
              {lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/admin/processos/${p.id}`} className="whitespace-nowrap font-mono text-xs font-semibold text-marinho-800 hover:underline">{p.numeroProcesso}</Link></td>
                  <td>{p.assunto}</td>
                  <td>{p.nomeServidor}</td>
                  <td><BadgeSituacao situacao={p.situacao} /></td>
                  <td>{p.unidadeAtual}</td>
                  <td className="whitespace-nowrap">{formatarData(p.ultima?.data)}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
          <Paginacao pagina={pagina} total={lista.length} porPagina={POR_PAGINA} aoMudar={setPagina} />
        </>
      )}
    </>
  )
}
