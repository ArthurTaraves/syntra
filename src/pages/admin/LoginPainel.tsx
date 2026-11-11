import { LogIn, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Aviso, Botao, Campo, Entrada } from '../../components/painel/ui'
import { useAuth } from '../../hooks/useAuth'
import { mensagemDeErro } from '../../hooks/useCarregar'
import { limparMatricula, MSG_MATRICULA_INVALIDA, PADRAO_MATRICULA, TAMANHO_MATRICULA } from '../../lib/texto'

export default function LoginPainel() {
  const { usuario, entrar, sair } = useAuth()
  const navigate = useNavigate()
  const destino = (useLocation().state as { de?: string } | null)?.de ?? '/admin'
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario && usuario.perfil !== 'servidor' && !enviando) return <Navigate to={destino} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!PADRAO_MATRICULA.test(matricula)) return setErro(MSG_MATRICULA_INVALIDA)
    setErro(null)
    setEnviando(true)
    try {
      const u = await entrar(matricula, senha, 'painel')
      if (u.perfil === 'servidor') {
        await sair('painel')
        setErro('O painel completo é restrito ao RH / Gestão. Use o totem ou a área do servidor para consultar a sua ficha.')
        setEnviando(false)
        return
      }
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(mensagemDeErro(err))
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-marinho-950 to-marinho-800 p-4">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo claro={false} />
          <p className="text-sm text-marinho-700">Painel administrativo · Gestão de Pessoas</p>
        </div>
        <div className="flex flex-col gap-4">
          <Campo rotulo="Matrícula">
            <Entrada value={matricula} onChange={(e) => setMatricula(limparMatricula(e.target.value))} inputMode="numeric"
              maxLength={TAMANHO_MATRICULA} placeholder="4 dígitos" autoComplete="username" required autoFocus />
          </Campo>
          <Campo rotulo="Senha">
            <Entrada type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </Campo>
          {erro && <Aviso tipo="alerta">{erro}</Aviso>}
          <Botao type="submit" disabled={enviando} className="min-h-11">
            <LogIn className="size-4" /> {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
          <p className="flex items-start gap-2 text-xs text-marinho-700">
            <ShieldCheck className="size-4 shrink-0" /> O acesso é registrado conforme a LGPD (Lei 13.709/2018).{' '}
          </p>
          <div className="flex justify-between text-xs">
            <Link to="/totem" className="text-marinho-700 underline">Ir para o totem</Link>
            <Link to="/privacidade" className="text-marinho-700 underline">Privacidade</Link>
          </div>
        </div>
      </form>
    </div>
  )
}
