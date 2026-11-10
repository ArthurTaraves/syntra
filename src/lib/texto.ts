/** Remove acentos, converte para minúsculas e normaliza espaços — base da busca tolerante. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Mantém apenas os dígitos: "08665.000123/2024-11" e "0866500012320241 1" viram a mesma chave. */
export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

/** Verifica se todos os termos da busca aparecem em algum dos campos (ignorando acentos/maiúsculas). */
export function contemTermos(busca: string, ...campos: (string | undefined)[]): boolean {
  const termos = normalizar(busca).split(' ').filter(Boolean)
  if (termos.length === 0) return true
  const alvo = normalizar(campos.filter(Boolean).join(' '))
  return termos.every((t) => alvo.includes(t))
}

/** Aplica a máscara SEI 00000.000000/0000-00 enquanto o usuário digita. */
export function mascararProcesso(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 17)
  let r = d.slice(0, 5)
  if (d.length > 5) r += '.' + d.slice(5, 11)
  if (d.length > 11) r += '/' + d.slice(11, 15)
  if (d.length > 15) r += '-' + d.slice(15, 17)
  return r
}

export const PADRAO_PROCESSO = /^\d{5}\.\d{6}\/\d{4}-\d{2}$/

/** Garante que nunca se exiba um CPF completo, mesmo que um dado chegue sem máscara. */
export function mascararCpf(cpf: string): string {
  const d = somenteDigitos(cpf)
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
  return cpf.includes('*') ? cpf : '***.***.***-**'
}

const fmtData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza' })
const fmtDataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Fortaleza',
})

/** Formata AAAA-MM-DD (sem fuso) ou ISO completo para dd/mm/aaaa. */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split('-')
    return `${d}/${m}/${a}`
  }
  return fmtData.format(new Date(iso))
}

export function formatarDataHora(iso: string): string {
  return fmtDataHora.format(new Date(iso))
}

/** Só a primeira letra maiúscula: "terça-feira, 10 de novembro" → "Terça-feira, 10 de novembro". */
export function primeiraMaiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function hojeISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
