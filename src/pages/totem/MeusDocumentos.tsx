import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useAuth } from '../../hooks/useAuth'

export default function MeusDocumentos() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return (
    <>
      <TituloTotem titulo="Meus documentos" subtitulo={`Pasta funcional de ${usuario.nome} · matrícula ${usuario.matricula}`} />
      <ResultadosTotem filtros={{ matriculaServidor: usuario.matricula }}
        dicaVazio="Ainda não há documentos cadastrados na sua pasta funcional. Procure o setor de Gestão de Pessoas." />
    </>
  )
}
