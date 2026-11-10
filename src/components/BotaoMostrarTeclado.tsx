import { Keyboard } from 'lucide-react'

/** Botão discreto para alternar o teclado virtual quando se usa teclado físico (computador). */
export function BotaoMostrarTeclado({ visivel, aoAlternar }: { visivel: boolean; aoAlternar: () => void }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={aoAlternar} aria-expanded={visivel}
      className="inline-flex items-center gap-2 self-center rounded-lg px-3 py-2 text-base font-medium text-marinho-700 underline-offset-4 hover:bg-marinho-50 hover:underline">
      <Keyboard className="size-5" aria-hidden />
      {visivel ? 'Esconder teclado da tela' : 'Mostrar teclado na tela'}
    </button>
  )
}
