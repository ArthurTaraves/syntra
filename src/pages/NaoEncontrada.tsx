import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export default function NaoEncontrada() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-marinho-900 p-8 text-center text-white">
      <Logo />
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-marinho-100">O endereço acessado não existe.</p>
      <div className="flex gap-3">
        <Link to="/totem" className="rounded-xl bg-destaque-500 px-5 py-3 font-bold text-marinho-950">Ir para o totem</Link>
        <Link to="/admin" className="rounded-xl bg-marinho-700 px-5 py-3 font-semibold">Painel administrativo</Link>
      </div>
    </div>
  )
}
