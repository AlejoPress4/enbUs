import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')
const frontendDir = join(root, 'frontend')
const distDir = join(frontendDir, 'dist')
const publicDir = join(root, 'public')
const serverAssetsDir = join(root, 'server', 'assets')

console.log('📦 Instalando dependencias del frontend...')
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' })

console.log('⚙️  Compilando React...')
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' })

// Limpiar build anterior
if (existsSync(join(publicDir, 'assets'))) {
  rmSync(join(publicDir, 'assets'), { recursive: true })
}

// Copiar assets (JS/CSS) a public/assets/
console.log('📂 Copiando assets a public/...')
mkdirSync(join(publicDir, 'assets'), { recursive: true })
cpSync(join(distDir, 'assets'), join(publicDir, 'assets'), { recursive: true })

// Copiar index.html a server/assets/ para que Nitro lo empaquete
console.log('📄 Copiando index.html a server/assets/...')
mkdirSync(serverAssetsDir, { recursive: true })
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8')
writeFileSync(join(serverAssetsDir, 'index.html'), indexHtml)

console.log('✅ Frontend compilado e integrado con Nuxt.')
