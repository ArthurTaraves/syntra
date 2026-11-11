// Popula o Firestore e o Firebase Auth com os dados FICTÍCIOS de src/data/seed.ts.
//
// Uso:  npm run seed
// Requer no .env:
//   VITE_FIREBASE_PROJECT_ID=<id do projeto>
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json   (chave de conta de serviço)
//
// Usa o Admin SDK (ignora as regras de segurança), por isso roda só no seu computador,
// nunca no navegador. É idempotente: rodar de novo sobrescreve os mesmos registros.

import { existsSync } from 'node:fs'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, type WriteBatch } from 'firebase-admin/firestore'
import { CONTAS_DEMO, gerarSeed, SENHA_DEMO } from '../src/data/seed'

if (existsSync('.env')) process.loadEnvFile('.env')

const projectId = process.env.VITE_FIREBASE_PROJECT_ID
if (!projectId) {
  console.error('✖ Defina VITE_FIREBASE_PROJECT_ID no arquivo .env.')
  process.exit(1)
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error(
    '✖ Chave de conta de serviço não encontrada.\n' +
      '  Console do Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada.\n' +
      '  Salve como serviceAccount.json na raiz e defina GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json no .env.',
  )
  process.exit(1)
}

initializeApp({ credential: applicationDefault(), projectId })
const db = getFirestore()
// Campos opcionais aninhados (ex.: documentoId de um curso) podem vir como undefined.
db.settings({ ignoreUndefinedProperties: true })
const auth = getAuth()

async function gravarEmLotes<T extends { id: string }>(colecao: string, itens: T[]) {
  let lote: WriteBatch = db.batch()
  let n = 0
  for (const { id, ...dados } of itens) {
    // O Firestore não aceita `undefined`.
    const limpo = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== undefined))
    lote.set(db.collection(colecao).doc(id), limpo)
    if (++n % 400 === 0) {
      await lote.commit()
      lote = db.batch()
    }
  }
  await lote.commit()
  console.log(`  ✔ ${colecao}: ${itens.length}`)
}

async function main() {
  console.log(`Populando o projeto "${projectId}" com dados fictícios…`)
  const dados = gerarSeed()

  for (const u of CONTAS_DEMO) {
    const email = `${u.matricula}@syntra.local`
    try {
      await auth.updateUser(u.uid, { email, password: SENHA_DEMO, displayName: u.nome })
    } catch {
      await auth.createUser({ uid: u.uid, email, password: SENHA_DEMO, displayName: u.nome })
    }
  }
  console.log(`  ✔ contas de demonstração: ${CONTAS_DEMO.length} (senha: ${SENHA_DEMO})`)

  await gravarEmLotes('usuarios', dados.usuarios.map(({ uid, ...u }) => ({ ...u, id: uid })))
  await gravarEmLotes('servidores', dados.servidores)
  await gravarEmLotes('documentos', dados.documentos)
  await gravarEmLotes('processos', dados.processos)
  await gravarEmLotes(
    'logs',
    dados.logs.map((l) => ({ ...l, registradoEm: new Date(l.data) })),
  )
  await gravarEmLotes('solicitacoes', dados.solicitacoes)
  console.log('Pronto!')
}

main().catch((e) => {
  console.error('✖ Falha ao popular o Firestore:', e)
  process.exit(1)
})
