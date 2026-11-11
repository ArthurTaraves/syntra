import { Building2, Database, ShieldCheck } from 'lucide-react'
import { Logo } from '../components/Logo'

/**
 * Mostrada quando o site é publicado com VITE_DATA_PROVIDER=sharepoint antes de a integração
 * existir: em vez de quebrar, explica o que está previsto (docs/SHAREPOINT.md).
 */
export default function SharePointPrevisto() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-marinho-900 p-4 text-white sm:p-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 text-marinho-950 shadow-2xl sm:p-10">
        <div className="mb-6 rounded-2xl bg-marinho-900 p-4"><Logo tamanho="md" /></div>
        <h1 className="text-3xl font-extrabold text-marinho-900">Integração com SharePoint prevista para a implantação na PRF</h1>
        <p className="mt-3 text-lg text-marinho-800">
          Este endereço foi configurado para usar o Microsoft SharePoint como fonte de dados, mas a integração
          ainda não está ligada. Nenhum dado foi acessado.
        </p>
        <ul className="mt-6 flex flex-col gap-4 text-base text-marinho-900">
          <li className="flex gap-3">
            <Building2 className="mt-0.5 size-6 shrink-0 text-marinho-700" aria-hidden />
            <span>Na implantação, os dados ficarão no Microsoft 365 da instituição, com login pela conta Microsoft institucional.</span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-6 shrink-0 text-marinho-700" aria-hidden />
            <span>Os dois níveis de acesso continuam os mesmos: Policial (só a própria ficha) e RH / Gestão (todas as unidades).</span>
          </li>
          <li className="flex gap-3">
            <Database className="mt-0.5 size-6 shrink-0 text-marinho-700" aria-hidden />
            <span>
              Para usar o protótipo agora, publique com <code className="rounded bg-marinho-50 px-1.5 py-0.5 text-sm">VITE_DATA_PROVIDER=local</code> (demonstração)
              ou <code className="rounded bg-marinho-50 px-1.5 py-0.5 text-sm">firebase</code>.
            </span>
          </li>
        </ul>
        <p className="mt-6 text-sm text-marinho-700">Detalhes técnicos: docs/SHAREPOINT.md no repositório do projeto.</p>
      </div>
    </main>
  )
}
