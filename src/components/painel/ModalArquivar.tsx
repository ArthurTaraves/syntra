import { Archive } from 'lucide-react'
import { useState } from 'react'
import { mensagemDeErro } from '../../hooks/useCarregar'
import { servicos, type Contexto } from '../../services'
import type { Documento } from '../../types'
import { Aviso, Botao, Campo, Entrada, Modal } from './ui'

export function ModalArquivar({ doc, ctx, aoFechar, aoConcluir }: { doc: Documento; ctx: Contexto; aoFechar: () => void; aoConcluir: () => void }) {
  const [local, setLocal] = useState(doc.localizacaoFisica.startsWith('Arquivo Central') ? doc.localizacaoFisica : 'Arquivo Central – Caixa  – Prateleira ')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const confirmar = async () => {
    if (local.trim().length < 5) return setErro('Informe onde o documento físico ficará guardado.')
    setSalvando(true)
    try {
      await servicos.documentos.arquivar(doc.id, local.trim(), ctx)
      aoConcluir()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <Modal titulo="Arquivar documento" aoFechar={aoFechar}>
      <p className="mb-4 text-sm text-marinho-800">
        <strong>{doc.titulo}</strong> passará para o status <strong>Arquivado</strong> com a data de hoje.
      </p>
      <Campo rotulo="Nova localização física" dica="Ex.: Arquivo Central – Caixa 14 – Prateleira B">
        <Entrada value={local} onChange={(e) => setLocal(e.target.value)} autoFocus />
      </Campo>
      {erro && <div className="mt-3"><Aviso tipo="alerta">{erro}</Aviso></div>}
      <div className="mt-6 flex justify-end gap-2">
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={confirmar} disabled={salvando}><Archive className="size-4" /> {salvando ? 'Arquivando…' : 'Arquivar'}</Botao>
      </div>
    </Modal>
  )
}
