import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Carregando } from './components/Estados'
import { RotaProtegida } from './components/RotaProtegida'
import { ExigePerfil } from './components/totem/ExigePerfil'
import { TotemLogado } from './components/totem/TotemLogado'
import { TotemShell } from './components/totem/TotemShell'
import { AuthProvider } from './hooks/useAuth'
import SharePointPrevisto from './pages/SharePointPrevisto'
import { integracaoSharePointPendente } from './services'
import BuscaServidor from './pages/totem/BuscaServidor'
import Descanso from './pages/totem/Descanso'
import DetalheDocumento from './pages/totem/DetalheDocumento'
import EnviarAtualizacao from './pages/totem/EnviarAtualizacao'
import FichaTotem from './pages/totem/FichaTotem'
import ImprimirExtrato from './pages/totem/ImprimirExtrato'
import LoginTotem from './pages/totem/LoginTotem'
import MenuTotem from './pages/totem/MenuTotem'
import MeusDocumentos from './pages/totem/MeusDocumentos'
import MinhaFicha from './pages/totem/MinhaFicha'
import MinhasSolicitacoes from './pages/totem/MinhasSolicitacoes'
import PedidosTotem from './pages/totem/PedidosTotem'

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
const Verificar = lazy(() => import('./pages/Verificar'))
const NaoEncontrada = lazy(() => import('./pages/NaoEncontrada'))

export default function App() {
  // VITE_DATA_PROVIDER=sharepoint antes da integração existir: tela explicativa em vez de erro
  // (nenhuma rota é montada, então nada chama o provedor).
  if (integracaoSharePointPendente) return <SharePointPrevisto />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Carregando />}>
          <Routes>
            <Route path="/" element={<Navigate to="/totem" replace />} />

            {/* ---------- TOTEM (mesmo site, tela de toque) ----------
                Policial: só a própria ficha. RH / Gestão: o mesmo menu + fichas de todos, pedidos e painel. */}
            <Route path="/totem" element={<TotemShell />}>
              <Route index element={<Descanso />} />
              <Route path="login" element={<LoginTotem />} />
              <Route element={<RotaProtegida login="/totem/login"><TotemLogado /></RotaProtegida>}>
                <Route path="menu" element={<MenuTotem />} />
                <Route path="minha-ficha" element={<MinhaFicha />} />
                <Route path="minha-ficha/enviar" element={<EnviarAtualizacao />} />
                <Route path="meus-documentos" element={<MeusDocumentos />} />
                <Route path="solicitacoes" element={<MinhasSolicitacoes />} />
                <Route path="extrato" element={<ImprimirExtrato />} />
                <Route path="documento/:id" element={<DetalheDocumento />} />
                {/* Só RH / Gestão; o Policial volta ao menu (a proteção real está nos serviços e no firestore.rules). */}
                <Route path="fichas" element={<ExigePerfil perfis={['admin']}><BuscaServidor /></ExigePerfil>} />
                <Route path="ficha/:matricula" element={<ExigePerfil perfis={['admin']}><FichaTotem /></ExigePerfil>} />
                <Route path="pedidos" element={<ExigePerfil perfis={['admin']}><PedidosTotem /></ExigePerfil>} />
                {/* Qualquer rota antiga ou desconhecida do totem (buscas antigas etc.) volta ao menu. */}
                <Route path="*" element={<Navigate to="/totem/menu" replace />} />
              </Route>
            </Route>

            {/* ---------- PAINEL COMPLETO (/admin): só RH / Gestão, todas as unidades ---------- */}
            <Route path="/admin/login" element={<LoginPainel />} />
            <Route path="/admin" element={<RotaProtegida login="/admin/login" perfis={['admin']}><PainelLayout /></RotaProtegida>}>
              <Route index element={<Inicio />} />
              <Route path="documentos" element={<Documentos />} />
              <Route path="documentos/novo" element={<FormDocumento />} />
              <Route path="documentos/:id/editar" element={<FormDocumento />} />
              <Route path="servidores" element={<Servidores />} />
              <Route path="servidores/:matricula" element={<FichaServidor />} />
              <Route path="processos" element={<Processos />} />
              <Route path="processos/:id" element={<DetalheProcesso />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="solicitacoes" element={<Solicitacoes />} />
              <Route path="indicadores" element={<Indicadores />} />
              <Route path="talentos" element={<Talentos />} />
              <Route path="logs" element={<Logs />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>

            {/* ---------- Páginas públicas ---------- */}
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/verificar" element={<Verificar />} />
            <Route path="/verificar/:codigo" element={<Verificar />} />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
