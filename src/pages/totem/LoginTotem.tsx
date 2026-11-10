import { ArrowLeft, Eye, EyeOff, Lock, LogIn, ShieldCheck, Timer } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BotaoMostrarTeclado } from '../../components/BotaoMostrarTeclado'
import { MensagemErro } from '../../components/Estados'
import { Logo } from '../../components/Logo'
import { TecladoVirtual } from '../../components/TecladoVirtual'
import { useAuth } from '../../hooks/useAuth'
import { BLOQUEIO_SEGUNDOS, MAX_TENTATIVAS, useBloqueioLogin } from '../../hooks/useBloqueioLogin'
import { useTelaDeToque } from '../../hooks/useTelaDeToque'
import { limparMatricula, MSG_MATRICULA_INVALIDA, PADRAO_MATRICULA, TAMANHO_MATRICULA } from '../../lib/texto'
import { ErroServico } from '../../services'

type Campo = 'matricula' | 'senha'

export default function LoginTotem() {
  const { usuario, entrar } = useAuth()
  const navigate = useNavigate()
  const bloqueio = useBloqueioLogin()
  const toque = useTelaDeToque()
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [campo, setCampo] = useState<Campo>('matricula')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // null = segue o padrão do aparelho (toque: visível; computador: escondido).
  const [tecladoEscolhido, setTecladoEscolhido] = useState<boolean | null>(null)
  const tecladoVisivel = tecladoEscolhido ?? toque

  const refMatricula = useRef<HTMLInputElement>(null)
  const refSenha = useRef<HTMLInputElement>(null)

  /** Troca o campo ativo e move o foco junto, para teclado físico e virtual ficarem em sincronia. */
  const irPara = (c: Campo) => {
    setCampo(c)
    ;(c === 'matricula' ? refMatricula : refSenha).current?.focus()
  }

  // Computador: foco automático na matrícula ao abrir a tela.
  useEffect(() => {
    if (!toque) refMatricula.current?.focus()
  }, [toque])

  // Ao TERMINAR o bloqueio (transição bloqueado → livre), devolve o foco à senha:
  // os campos ficam desabilitados durante o bloqueio e perdem o foco.
  const estavaBloqueado = useRef(bloqueio.bloqueado)
  useEffect(() => {
    if (estavaBloqueado.current && !bloqueio.bloqueado && !toque) refSenha.current?.focus()
    estavaBloqueado.current = bloqueio.bloqueado
  }, [bloqueio.bloqueado, toque])

  if (usuario && !enviando) return <Navigate to="/totem/menu" replace />

  const setValor = campo === 'matricula' ? setMatricula : setSenha
  const desabilitado = enviando || bloqueio.bloqueado

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault()
    if (desabilitado) return
    // Formato errado não chama o servidor e NÃO conta como tentativa errada.
    if (!PADRAO_MATRICULA.test(matricula)) {
      setErro(MSG_MATRICULA_INVALIDA)
      irPara('matricula')
      return
    }
    if (!senha) {
      setErro('Informe a senha.')
      irPara('senha')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      await entrar(matricula, senha, 'totem')
      bloqueio.registrarSucesso()
      navigate('/totem/menu', { replace: true })
    } catch (err) {
      const credenciais = err instanceof ErroServico && err.codigo === 'credenciais'
      if (credenciais) {
        bloqueio.registrarFalha()
        const restam = bloqueio.tentativasRestantes - 1
        setErro(
          restam > 0
            ? `Matrícula ou senha incorretas. ${restam === 1 ? 'Resta 1 tentativa' : `Restam ${restam} tentativas`} antes do bloqueio temporário.`
            : null,
        )
      } else {
        setErro(err instanceof ErroServico ? err.message : 'Não foi possível entrar. Tente novamente.')
      }
      setSenha('')
      setEnviando(false)
      // O campo só é reabilitado no próximo render; foca em seguida.
      setCampo('senha')
      requestAnimationFrame(() => refSenha.current?.focus())
    }
  }

  /** Avança da matrícula para a senha só se a matrícula tiver 4 dígitos. */
  const avancarParaSenha = () => {
    if (!PADRAO_MATRICULA.test(matricula)) return setErro(MSG_MATRICULA_INVALIDA)
    setErro(null)
    irPara('senha')
  }

  // Enter na matrícula pula para a senha (em vez de tentar o login com a senha vazia).
  const enterNaMatricula = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      avancarParaSenha()
    }
  }

  const classeCampo = (c: Campo) =>
    `flex min-h-20 w-full items-center rounded-2xl bg-white px-5 text-3xl tracking-wider outline-none ring-4 transition ${
      campo === c ? 'ring-destaque-500' : 'ring-marinho-100'
    }`

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 bg-marinho-900 px-4 py-3 sm:px-8">
        <Logo />
        <button type="button" onClick={() => navigate('/totem')}
          className="flex min-h-16 items-center gap-2 rounded-2xl bg-marinho-700 px-5 text-xl font-semibold text-white active:bg-marinho-600">
          <ArrowLeft className="size-7" aria-hidden /> Voltar
        </button>
      </header>

      <main
        className={`mx-auto flex w-full flex-1 flex-col justify-center gap-6 px-4 py-6 sm:px-8 ${
          tecladoVisivel ? 'max-w-5xl landscape:lg:flex-row landscape:lg:items-center landscape:lg:gap-10' : 'max-w-2xl'
        }`}>
        <form onSubmit={enviar} className="flex flex-1 flex-col gap-5" noValidate>
          <div>
            <h1 className="text-4xl font-extrabold text-marinho-900">Identifique-se</h1>
            <p className="text-xl text-marinho-700">Use sua matrícula e senha.</p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xl font-semibold text-marinho-800">Matrícula</span>
            {/* Toque: inputMode "none" impede o teclado do tablet de abrir por cima do nosso. */}
            <input ref={refMatricula} value={matricula} inputMode={toque ? 'none' : 'numeric'} autoComplete="off" maxLength={TAMANHO_MATRICULA}
              enterKeyHint="next" onFocus={() => setCampo('matricula')} onKeyDown={enterNaMatricula}
              onChange={(e) => setMatricula(limparMatricula(e.target.value))}
              className={classeCampo('matricula')} placeholder="4 dígitos" disabled={desabilitado} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xl font-semibold text-marinho-800">Senha</span>
            <div className="relative">
              {/* Enter aqui envia o formulário (login). */}
              <input ref={refSenha} value={senha} type={verSenha ? 'text' : 'password'} inputMode={toque ? 'none' : 'text'}
                autoComplete="off" enterKeyHint="go"
                onFocus={() => setCampo('senha')} onChange={(e) => setSenha(e.target.value)}
                className={`${classeCampo('senha')} pr-20`} disabled={desabilitado} />
              <button type="button" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}
                className="absolute right-2 top-1/2 flex size-16 -translate-y-1/2 items-center justify-center rounded-xl text-marinho-700 active:bg-marinho-50"
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                {verSenha ? <EyeOff className="size-8" /> : <Eye className="size-8" />}
              </button>
            </div>
          </label>

          {bloqueio.bloqueado ? (
            <div role="alert" className="flex items-center gap-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-red-900">
              <Timer className="size-10 shrink-0" aria-hidden />
              <p className="text-xl">
                <strong>Acesso bloqueado temporariamente</strong> após {MAX_TENTATIVAS} tentativas incorretas. Tente novamente em{' '}
                <strong className="tabular-nums">{bloqueio.segundosRestantes}s</strong>.
              </p>
            </div>
          ) : (
            erro && <MensagemErro grande>{erro}</MensagemErro>
          )}

          <button type="submit" disabled={desabilitado}
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-marinho-800 text-2xl font-bold text-white active:bg-marinho-700 disabled:opacity-50">
            {bloqueio.bloqueado ? <Lock className="size-8" aria-hidden /> : <LogIn className="size-8" aria-hidden />}
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="flex items-start gap-2 text-base text-marinho-700">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-marinho-600" aria-hidden />
            O acesso é registrado conforme a LGPD (Lei 13.709/2018).
          </p>

          {!toque && !tecladoVisivel && <BotaoMostrarTeclado visivel={false} aoAlternar={() => setTecladoEscolhido(true)} />}
        </form>

        {tecladoVisivel && (
          <div className="flex flex-1 flex-col justify-center rounded-3xl bg-marinho-50 p-4 portrait:p-6">
            <p className="mb-3 text-center text-lg font-semibold text-marinho-700 portrait:mb-5 portrait:text-xl">
              Digitando: <span className="text-marinho-950">{campo === 'matricula' ? 'Matrícula' : 'Senha'}</span>
            </p>
            <TecladoVirtual
              modo={campo === 'matricula' ? 'numerico' : 'alfanumerico'}
              desabilitado={desabilitado}
              onTecla={(c) => setValor((v) => (campo === 'matricula' ? limparMatricula(v + c) : v + c))}
              onApagar={() => setValor((v) => v.slice(0, -1))}
              onLimpar={() => setValor('')}
              onConfirmar={() => (campo === 'matricula' ? avancarParaSenha() : enviar())}
              rotuloConfirmar={campo === 'matricula' ? 'Próximo' : 'Entrar'}
            />
            {!toque && (
              <div className="mt-4 flex justify-center">
                <BotaoMostrarTeclado visivel aoAlternar={() => setTecladoEscolhido(false)} />
              </div>
            )}
          </div>
        )}
      </main>
      <p className="sr-only">O totem bloqueia o acesso por {BLOQUEIO_SEGUNDOS} segundos após {MAX_TENTATIVAS} tentativas incorretas.</p>
    </div>
  )
}
