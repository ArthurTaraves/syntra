import { useSearchParams } from 'react-router-dom'
import { CampoBuscaTotem } from '../../components/totem/CampoBuscaTotem'
import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'

export default function BuscaServidor() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  return (
    <>
      <TituloTotem titulo="Buscar por matrícula ou nome" subtitulo="Acentos e letras maiúsculas não fazem diferença." />
      <CampoBuscaTotem rotulo="Matrícula ou nome do servidor" valorInicial={q} modo="alfanumerico" placeholder="Ex.: 1000001 ou Lívia Bastos"
        aoBuscar={(v) => setParams({ q: v }, { replace: true })} />
      {q && (
        <ResultadosTotem filtros={{ servidor: q }}
          dicaVazio="Confira a matrícula ou tente apenas parte do nome. Você só vê documentos permitidos para o seu perfil." />
      )}
    </>
  )
}
