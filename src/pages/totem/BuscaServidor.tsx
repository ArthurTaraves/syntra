import { ChevronRight } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Carregando, MensagemErro, NenhumResultado } from '../../components/Estados'
import { SeloAtualizacao } from '../../components/ficha/FichaBlocos'
import { CampoBuscaTotem } from '../../components/totem/CampoBuscaTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useContextoAcesso } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { contemTermos, somenteDigitos } from '../../lib/texto'
import { servicos } from '../../services'

/**
 * "Fichas dos servidores" no totem (só RH / Gestão: a rota é bloqueada para o Policial em App.tsx).
 * A lista vem de servidores.listar, que já devolve só o que o perfil pode ver.
 */
export default function BuscaServidor() {
  const ctx = useContextoAcesso('totem')
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const { dados, carregando, erro } = useCarregar(() => servicos.servidores.listar(ctx), [ctx])

  const resultado = useMemo(() => {
    if (!dados || !q) return []
    // Só dígitos → busca por matrícula, como TEXTO ("0018" e "18" acham a 0018; zeros contam).
    const dig = somenteDigitos(q)
    return dados.filter((s) => (dig && dig === q.replace(/\s/g, '') ? s.matricula.includes(dig) : contemTermos(q, s.nome)))
  }, [dados, q])

  // Busca em dados pessoais: registrada no log de acessos (LGPD). listar() não registra sozinho.
  useEffect(() => {
    if (!q || !dados) return
    void servicos.logs.registrar({ acao: 'consulta', alvo: `servidor: ${q}`, resultados: resultado.length, origem: 'totem' }, ctx.usuario)
  }, [q, dados, resultado.length, ctx.usuario])

  return (
    <>
      <TituloTotem titulo="Fichas dos servidores"
        subtitulo="Todas as unidades da PRF-PI. Acentos e maiúsculas não fazem diferença." />
      <CampoBuscaTotem rotulo="Matrícula ou nome do servidor" valorInicial={q} modo="alfanumerico" placeholder="Ex.: 0018 ou Wesley"
        aoBuscar={(v) => setParams({ q: v }, { replace: true })} />
      {q && (carregando ? <Carregando texto="Buscando…" grande /> : erro ? <MensagemErro grande>{erro}</MensagemErro> : resultado.length === 0 ? (
        <NenhumResultado grande titulo="Nenhum servidor encontrado">Confira a matrícula (4 dígitos) ou tente apenas parte do nome.</NenhumResultado>
      ) : (
        <ul className="grid grid-cols-1 gap-5 landscape:xl:grid-cols-2" aria-live="polite">
          {resultado.map((s) => (
            <li key={s.id}>
              <Link to={`/totem/ficha/${s.matricula}`}
                className="flex items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-md ring-1 ring-marinho-100 active:ring-4 active:ring-destaque-500">
                <span className="min-w-0">
                  <span className="block text-2xl font-bold text-marinho-950">{s.nome}</span>
                  <span className="block text-lg text-marinho-700">Matrícula {s.matricula} · {s.cargo} · {s.lotacao}</span>
                  <span className="mt-2 block"><SeloAtualizacao iso={s.fichaAtualizadaEm} grande /></span>
                </span>
                <ChevronRight className="size-10 shrink-0 text-marinho-600" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </>
  )
}
