import { useSearchParams } from 'react-router-dom'
import { CampoBuscaTotem } from '../../components/totem/CampoBuscaTotem'
import { ResultadosTotem } from '../../components/totem/ResultadosTotem'
import { TituloTotem } from '../../components/totem/TituloTotem'
import { useAuth } from '../../hooks/useAuth'
import { mascararProcesso } from '../../lib/texto'

export default function BuscaProcesso() {
  const { usuario } = useAuth()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  // Servidor: só os próprios processos. Gestor/RH: dentro do escopo do perfil (unidade ou tudo).
  const soProprios = usuario?.perfil === 'servidor'
  return (
    <>
      <TituloTotem titulo="Buscar por nº de processo"
        subtitulo={`${soProprios ? 'Somente os seus processos. ' : ''}Pode digitar só os números; a pontuação é opcional.`} />
      <CampoBuscaTotem rotulo="Número do processo" valorInicial={q} modo="numerico" placeholder="00000.000000/0000-00"
        formatar={mascararProcesso} aoBuscar={(v) => setParams({ q: v }, { replace: true })} />
      {q && (
        <ResultadosTotem filtros={soProprios ? { numeroProcesso: q, matriculaServidor: usuario!.matricula } : { numeroProcesso: q }}
          dicaVazio={soProprios ? 'Confira o número. Aqui aparecem apenas processos vinculados à sua matrícula.' : 'Confira o número do processo. Você também pode digitar apenas parte dele.'} />
      )}
    </>
  )
}
