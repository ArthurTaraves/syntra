import { UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Carregando, MensagemErro } from '../../components/Estados'
import { Aviso, Botao, CabecalhoPagina, Campo, Entrada, Modal, Selecao, Tabela } from '../../components/painel/ui'
import { useContextoAcesso } from '../../hooks/useAuth'
import { mensagemDeErro, useCarregar } from '../../hooks/useCarregar'
import { limparMatricula, MSG_MATRICULA_INVALIDA, PADRAO_MATRICULA, TAMANHO_MATRICULA } from '../../lib/texto'
import { ROTULO_PERFIL, servicos, type NovoUsuario } from '../../services'
import { LOTACOES, PERFIS, type Perfil } from '../../types'

function FormNovoUsuario({ aoFechar, aoCriar }: { aoFechar: () => void; aoCriar: () => void }) {
  const ctx = useContextoAcesso('painel')
  const [f, setF] = useState<NovoUsuario>({ nome: '', matricula: '', perfil: 'servidor', unidade: LOTACOES[0], senha: '' })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (f.nome.trim().split(' ').length < 2) return setErro('Informe o nome completo.')
    if (!PADRAO_MATRICULA.test(f.matricula)) return setErro(MSG_MATRICULA_INVALIDA)
    if (f.senha.length < 6) return setErro('A senha inicial precisa ter pelo menos 6 caracteres.')
    setSalvando(true)
    try {
      await servicos.usuarios.criar(f, ctx)
      aoCriar()
    } catch (err) {
      setErro(mensagemDeErro(err))
      setSalvando(false)
    }
  }

  return (
    <Modal titulo="Novo usuário" aoFechar={aoFechar}>
      <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
        <Campo rotulo="Nome completo"><Entrada value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoFocus /></Campo>
        <Campo rotulo="Matrícula" dica="Exatamente 4 dígitos.">
          <Entrada value={f.matricula} inputMode="numeric" maxLength={TAMANHO_MATRICULA} placeholder="0000"
            onChange={(e) => setF({ ...f, matricula: limparMatricula(e.target.value) })} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Perfil">
            <Selecao value={f.perfil} onChange={(e) => setF({ ...f, perfil: e.target.value as Perfil })}>
              {PERFIS.map((p) => <option key={p} value={p}>{ROTULO_PERFIL[p]}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Unidade">
            <Selecao value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value as NovoUsuario['unidade'] })}>
              {LOTACOES.map((l) => <option key={l}>{l}</option>)}
            </Selecao>
          </Campo>
        </div>
        <Campo rotulo="Senha inicial" dica="Mínimo de 6 caracteres. Oriente o usuário a trocá-la no primeiro acesso.">
          <Entrada type="password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="new-password" />
        </Campo>
        {erro && <Aviso tipo="alerta">{erro}</Aviso>}
        <div className="mt-2 flex justify-end gap-2">
          <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" disabled={salvando}>{salvando ? 'Criando…' : 'Criar usuário'}</Botao>
        </div>
      </form>
    </Modal>
  )
}

export default function Usuarios() {
  const ctx = useContextoAcesso('painel')
  const [criando, setCriando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'alerta' | 'sucesso'; texto: string } | null>(null)
  const { dados, carregando, erro, recarregar } = useCarregar(() => servicos.usuarios.listar(ctx), [ctx])

  const alterar = async (uid: string, nome: string, perfil: Perfil) => {
    if (!confirm(`Alterar o perfil de ${nome} para "${ROTULO_PERFIL[perfil]}"?`)) return
    try {
      await servicos.usuarios.alterarPerfil(uid, perfil, ctx)
      setMsg({ tipo: 'sucesso', texto: `Perfil de ${nome} alterado para ${ROTULO_PERFIL[perfil]}.` })
      recarregar()
    } catch (e) {
      setMsg({ tipo: 'alerta', texto: mensagemDeErro(e) })
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Usuários" descricao="Contas com acesso ao totem e ao painel, e seus perfis."
        acoes={<Botao variante="destaque" onClick={() => setCriando(true)}><UserPlus className="size-4" /> Novo usuário</Botao>} />
      {msg && <div className="mb-4"><Aviso tipo={msg.tipo}>{msg.texto}</Aviso></div>}
      <Aviso>
        <strong>Servidor</strong>: vê os próprios documentos e os de nível público interno. <strong>Gestor</strong>: vê os documentos da sua unidade e acessa o painel.{' '}
        <strong>Administrador</strong>: acesso total, cadastro de documentos, logs e usuários.
      </Aviso>
      <div className="mt-4">
        {carregando ? <Carregando /> : erro ? <MensagemErro>{erro}</MensagemErro> : (
          <Tabela>
            <thead><tr><th>Nome</th><th>Matrícula</th><th>Unidade</th><th>Perfil</th></tr></thead>
            <tbody>
              {dados?.map((u) => (
                <tr key={u.uid}>
                  <td className="font-medium">{u.nome}</td>
                  <td className="font-mono">{u.matricula}</td>
                  <td>{u.unidade}</td>
                  <td>
                    {u.uid === ctx.usuario.uid ? (
                      <span title="Você não pode alterar o próprio perfil">{ROTULO_PERFIL[u.perfil]} (você)</span>
                    ) : (
                      <Selecao aria-label={`Perfil de ${u.nome}`} value={u.perfil} onChange={(e) => alterar(u.uid, u.nome, e.target.value as Perfil)} className="max-w-44">
                        {PERFIS.map((p) => <option key={p} value={p}>{ROTULO_PERFIL[p]}</option>)}
                      </Selecao>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </div>
      {criando && (
        <FormNovoUsuario aoFechar={() => setCriando(false)}
          aoCriar={() => { setCriando(false); setMsg({ tipo: 'sucesso', texto: 'Usuário criado.' }); recarregar() }} />
      )}
    </>
  )
}
