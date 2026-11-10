import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Carregando } from './components/Estados'
import { RotaProtegida } from './components/RotaProtegida'
import { TotemLogado } from './components/totem/TotemLogado'
import { TotemShell } from './components/totem/TotemShell'
import { AuthProvider } from './hooks/useAuth'
import BuscaAvancada from './pages/totem/BuscaAvancada'
import BuscaProcesso from './pages/totem/BuscaProcesso'
import BuscaServidor from './pages/totem/BuscaServidor'
import Descanso from './pages/totem/Descanso'
import DetalheDocumento from './pages/totem/DetalheDocumento'
import LoginTotem from './pages/totem/LoginTotem'
import MenuTotem from './pages/totem/MenuTotem'
import EnviarAtualizacao from './pages/totem/EnviarAtualizacao'
import MeusDocumentos from './pages/totem/MeusDocumentos'
import MinhaFicha from './pages/totem/MinhaFicha'

// O painel (e o recharts) só é baixado quando alguém abre /admin: o totem fica leve.
const PainelLayout = lazy(() => import('./components/painel/PainelLayout').then((m) => ({ default: m.PainelLayout })))
const LoginPainel = lazy(() => import('./pages/admin/LoginPainel'))
const Inicio = lazy(() => import('./pages/admin/Inicio'))
const Documentos = lazy(() => import('./pages/admin/Documentos'))
const FormDocumento = lazy(() => import('./pages/admin/FormDocumento'))
const Servidores = lazy(() => import('./pages/admin/Servidores'))
const FichaServidor = lazy(() => import('./pages/admin/FichaServidor'))
const Processos = lazy(() => import('./pages/admin/Processos'))
const DetalheProcesso = lazy(() => import('./pages/admin/DetalheProcesso'))
const Relatorios = lazy(() => import('./pages/admin/Relatorios'))
const Logs = lazy(() => import('./pages/admin/Logs'))
const Usuarios = lazy(() => import('./pages/admin/Usuarios'))
const Solicitacoes = lazy(() => import('./pages/admin/Solicitacoes'))
const Indicadores = lazy(() => import('./pages/admin/Indicadores'))
const Talentos = lazy(() => import('./pages/admin/Talentos'))
const Privacidade = lazy(() => import('./pages/Privacidade'))
const NaoEncontrada = lazy(() => import('./pages/NaoEncontrada'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Carregando />}>
          <Routes>
            <Route path="/" element={<Navigate to="/totem" replace />} />

            {/* ---------- Modo totem ---------- */}
            <Route path="/totem" element={<TotemShell />}>
              <Route index element={<Descanso />} />
              <Route path="login" element={<LoginTotem />} />
              <Route element={<RotaProtegida login="/totem/login"><TotemLogado /></RotaProtegida>}>
                <Route path="menu" element={<MenuTotem />} />
                <Route path="busca/processo" element={<BuscaProcesso />} />
                <Route path="busca/servidor" element={<BuscaServidor />} />
                <Route path="busca/avancada" element={<BuscaAvancada />} />
                <Route path="meus-documentos" element={<MeusDocumentos />} />
                <Route path="minha-ficha" element={<MinhaFicha />} />
                <Route path="minha-ficha/enviar" element={<EnviarAtualizacao />} />
                <Route path="documento/:id" element={<DetalheDocumento />} />
              </Route>
            </Route>

            {/* ---------- Painel administrativo (gestor e admin) ---------- */}
            <Route path="/admin/login" element={<LoginPainel />} />
            <Route path="/admin" element={<RotaProtegida login="/admin/login" perfis={['gestor', 'admin']}><PainelLayout /></RotaProtegida>}>
              <Route index element={<Inicio />} />
              <Route path="documentos" element={<Documentos />} />
              <Route path="documentos/novo" element={<RotaProtegida login="/admin/login" perfis={['admin']}><FormDocumento /></RotaProtegida>} />
              <Route path="documentos/:id/editar" element={<RotaProtegida login="/admin/login" perfis={['admin']}><FormDocumento /></RotaProtegida>} />
              <Route path="servidores" element={<Servidores />} />
              <Route path="servidores/:matricula" element={<FichaServidor />} />
              <Route path="processos" element={<Processos />} />
              <Route path="processos/:id" element={<DetalheProcesso />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="solicitacoes" element={<Solicitacoes />} />
              <Route path="indicadores" element={<Indicadores />} />
              <Route path="talentos" element={<Talentos />} />
              <Route path="logs" element={<RotaProtegida login="/admin/login" perfis={['admin']}><Logs /></RotaProtegida>} />
              <Route path="usuarios" element={<RotaProtegida login="/admin/login" perfis={['admin']}><Usuarios /></RotaProtegida>} />
            </Route>

            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
