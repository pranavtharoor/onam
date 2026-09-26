// Ensures a server is running for QA/perf scripts. Reuses one if already up.
import { spawn } from 'node:child_process'

async function reachable(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok } catch { return false }
}

/**
 * `page` selects another page of the site, e.g. '3d' → <server>/3d/.
 * @param {{ url?: string, mode?: 'dev' | 'preview', port?: number, page?: string }} opts
 * @returns {Promise<{ url: string, stop: () => void }>}
 */
export async function ensureServer({ page, ...opts } = {}) {
  const server = await startServer(opts)
  if (page && page !== true) server.url = new URL(`${String(page).replace(/^\/|\/$/g, '')}/`, server.url).href
  return server
}

async function startServer({ url, mode = 'dev', port } = {}) {
  if (url) {
    if (!(await reachable(url))) throw new Error(`No server responding at ${url}`)
    return { url, stop() {} }
  }
  port ??= mode === 'dev' ? 5173 : 4173
  const base = `http://localhost:${port}/`
  if (await reachable(base)) return { url: base, stop() {} }

  const args = mode === 'dev' ? ['vite', '--port', String(port)] : ['vite', 'preview', '--port', String(port)]
  const child = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'], detached: true })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  const stop = () => { try { process.kill(-child.pid) } catch {} }
  process.on('exit', stop)

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (await reachable(base)) return { url: base, stop }
    if (child.exitCode !== null) break
    await new Promise((r) => setTimeout(r, 300))
  }
  stop()
  throw new Error(`Server did not start (${mode}).\n${log}`)
}
