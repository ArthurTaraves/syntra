import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { CabecalhoPagina, Entrada, Paginacao, Selecao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { contemTermos } from '../../lib/texto'
import { servicos } from '../../services'
import { LOTACOES, SITUACOES_SERVIDOR } from '../../types'

const POR_PAGINA = 15

export default function Servidores() {
  const ctx = useContextoAcesso('painel')
  const [busca, setBusca] = useState('')
  const [lotacao, setLotacao] = useState('')
  const [situacao, setSituacao] = useState('')
  const [pagina, setPagina] = useState(1)
  const { dados, carregando, erro } = useCarregar(() => servicos.servidores.listar(ctx), [ctx])

  const lista = useMemo(
    () =>
      (dados ?? []).filter(
        (s) =>
          contemTermos(busca, s.nome, s.matricula, s.cargo) &&
          (!lotacao || s.lotacao === lotacao) &&
          (!situacao || s.situacao === situacao),
      ),
    [dados, busca, lotacao, situacao],
  )

  return (
    <>
      <CabecalhoPagina titulo="Servidores" descricao="Abra a ficha para ver a pasta funcional digital: todos os documentos e processos do servidor." />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-marinho-600" />
          <Entrada aria-label="Buscar servidor" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} placeholder="Nome, matrícula ou cargo" className="pl-9" />
        </div>
        <Selecao aria-label="Lotação" value={lotacao} onChange={(e) => { setLotacao(e.target.value); setPagina(1) }}>
          <option value="">Todas as lotações</option>
          {LOTACOES.map((l) => <option key={l}>{l}</option>)}
        </Selecao>
        <Selecao aria-label="Situação" value={situacao} onChange={(e) => { setSituacao(e.target.value); setPagina(1) }}>
          <option value="">Todas as situações</option>
          {SITUACOES_SERVIDOR.map((l) => <option key={l}>{l}</option>)}
        </Selecao>
      </div>
      {carregando ? <Carregando /> : erro ? <MensagemErro>{erro}</MensagemErro> : lista.length === 0 ? (
        <NenhumResultado>Nenhum servidor encontrado com esses critérios.</NenhumResultado>
      ) : (
        <>
          <Tabela>
            <thead><tr><th>Nome</th><th>Matrícula</th><th>Cargo</th><th>Lotação</th><th>Situação</th></tr></thead>
            <tbody>
              {lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/admin/servidores/${s.matricula}`} className="font-semibold text-marinho-800 hover:underline">{s.nome}</Link></td>
                  <td className="font-mono">{s.matricula}</td>
                  <td>{s.cargo}</td>
                  <td>{s.lotacao}</td>
                  <td className="capitalize">{s.situacao}</td>
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
