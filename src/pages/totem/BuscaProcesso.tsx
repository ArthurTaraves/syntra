import { useSearchParams } from 'react-router-dom'
import { CampoBuscaTotem } from '../../components/totem/CampoBuscaTotem'
import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { mascararProcesso } from '../../lib/texto'

export default function BuscaProcesso() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  return (
    <>
      <TituloTotem titulo="Buscar por nº de processo" subtitulo="Pode digitar só os números; a pontuação é opcional." />
      <CampoBuscaTotem rotulo="Número do processo" valorInicial={q} modo="numerico" placeholder="00000.000000/0000-00"
        formatar={mascararProcesso} aoBuscar={(v) => setParams({ q: v }, { replace: true })} />
      {q && (
        <ResultadosTotem filtros={{ numeroProcesso: q }}
          dicaVazio="Confira o número do processo. Você também pode digitar apenas parte dele." />
      )}
    </>
  )
}
