// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('🌱 Iniciando semilla de datos de enbUs...')

  // -------------------------------------------------------
  // 0. Limpiar base de datos (orden para respetar FK)
  // -------------------------------------------------------
  await prisma.servicio.deleteMany({})
  await prisma.lectorQR.deleteMany({})
  await prisma.busetaRuta.deleteMany({})
  await prisma.ruta.deleteMany({})
  await prisma.buseta.deleteMany({})
  await prisma.empresaTransporte.deleteMany({})
  await prisma.cuotaMensual.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.institucion.deleteMany({})
  console.log('🗑️ Base de datos limpiada.')

  // -------------------------------------------------------
  // 1. Institución
  // -------------------------------------------------------
  const institucion = await prisma.institucion.create({
    data: {
      nombre: 'Universidad de Caldas',
      dominioCorreo: 'ucaldas.edu.co',
      activa: true,
    },
  })
  console.log(`🏫 Institución creada: ${institucion.nombre}`)

  // -------------------------------------------------------
  // 2. Usuarios: Estudiante (mariana) + Admin (alejandro)
  //    Contraseñas → hasheadas con SHA-256 (igual que auth.service.ts)
  //    Contraseña estudiante: Estudiante123!
  //    Contraseña admin:      Admin123!
  // -------------------------------------------------------
  const ahora = new Date()
  const mes = ahora.getMonth() + 1
  const anio = ahora.getFullYear()

  // -- Estudiante: Mariana García
  const marianaHash = hashPassword('Estudiante123!')
  const mariana = await prisma.usuario.create({
    data: {
      nombre: 'Mariana',
      apellido: 'García',
      correoInstitucional: 'mariana.garcia33537@ucaldas.edu.co',
      contrasenaHash: marianaHash,
      institucionId: institucion.id,
      estado: 'ACTIVO', // Ya activada para pruebas inmediatas
      cuotaRestanteMes: 5,
    },
  })
  await prisma.cuotaMensual.create({
    data: {
      usuarioId: mariana.id,
      mes,
      anio,
      usosRealizados: 0,
      limiteUsos: 5,
    },
  })
  console.log(`🎓 Estudiante creada: ${mariana.correoInstitucional}  (pass: Estudiante123!)`)

  // -- Admin/Conductor: Alejandro Preciado
  const alejandroHash = hashPassword('Admin123!')
  const alejandro = await prisma.usuario.create({
    data: {
      nombre: 'Alejandro',
      apellido: 'Preciado',
      correoInstitucional: 'alejandro.preciado40201@ucaldas.edu.co',
      contrasenaHash: alejandroHash,
      institucionId: institucion.id,
      estado: 'ACTIVO',
      cuotaRestanteMes: 999, // Admin no consume cupos
    },
  })
  await prisma.cuotaMensual.create({
    data: {
      usuarioId: alejandro.id,
      mes,
      anio,
      usosRealizados: 0,
      limiteUsos: 999,
    },
  })
  console.log(`👮 Admin creado: ${alejandro.correoInstitucional}  (pass: Admin123!)`)

  // -------------------------------------------------------
  // 3. Empresas de Transporte
  // -------------------------------------------------------
  const empresa1 = await prisma.empresaTransporte.create({
    data: {
      nombre: 'Autobuses Manizales S.A.',
      nit: '890.123.456-1',
      contacto: 'contacto@autobusesmanizales.com',
      activa: true,
    },
  })
  const empresa2 = await prisma.empresaTransporte.create({
    data: {
      nombre: 'Transportes Sideral S.A.',
      nit: '890.987.654-2',
      contacto: 'soporte@sideral.com',
      activa: true,
    },
  })
  console.log('🚌 Empresas de transporte creadas.')

  // -------------------------------------------------------
  // 4. Busetas
  // -------------------------------------------------------
  const buseta1 = await prisma.buseta.create({
    data: {
      empresaId: empresa1.id,
      placa: 'FTV123',
      numeroInterno: 'BUS-101',
      activa: true,
    },
  })
  const buseta2 = await prisma.buseta.create({
    data: {
      empresaId: empresa2.id,
      placa: 'GHY456',
      numeroInterno: 'BUS-202',
      activa: true,
    },
  })
  console.log('🚐 Busetas registradas.')

  // -------------------------------------------------------
  // 5. Lectores QR (el número de serie es lo que envía el escáner)
  // -------------------------------------------------------
  await prisma.lectorQR.create({
    data: {
      busetaId: buseta1.id,
      numeroSerie: 'SR-999-A',
      estado: 'ACTIVO',
    },
  })
  await prisma.lectorQR.create({
    data: {
      busetaId: buseta2.id,
      numeroSerie: 'SR-888-B',
      estado: 'ACTIVO',
    },
  })
  console.log('📷 Lectores QR vinculados. Series: SR-999-A | SR-888-B')

  // -------------------------------------------------------
  // 6. Rutas
  // -------------------------------------------------------
  const ruta1 = await prisma.ruta.create({
    data: {
      nombre: 'Ruta Centro - Universidad',
      origen: 'Plaza de Bolívar (Centro)',
      destino: 'Campus Palogrande (U. Caldas)',
      activa: true,
    },
  })
  const ruta2 = await prisma.ruta.create({
    data: {
      nombre: 'Ruta Chipre - Milán',
      origen: 'Parque de Chipre',
      destino: 'Zona Rosa Milán',
      activa: true,
    },
  })
  console.log('🛣️ Rutas creadas.')

  // -------------------------------------------------------
  // 7. Asignaciones Buseta ↔ Ruta
  // -------------------------------------------------------
  await prisma.busetaRuta.create({
    data: { busetaId: buseta1.id, rutaId: ruta1.id, activa: true },
  })
  await prisma.busetaRuta.create({
    data: { busetaId: buseta2.id, rutaId: ruta2.id, activa: true },
  })
  console.log('🔗 Busetas vinculadas a sus rutas.')

  console.log(`
✨ ¡Semilla completada exitosamente!

┌──────────────────────────────────────────────────────────┐
│                   CREDENCIALES DE PRUEBA                 │
├──────────────────────────────────────────────────────────┤
│  ESTUDIANTE                                              │
│  Correo:     mariana.garcia33537@ucaldas.edu.co          │
│  Contraseña: Estudiante123!                              │
├──────────────────────────────────────────────────────────┤
│  ADMIN / CONDUCTOR                                       │
│  Correo:     alejandro.preciado40201@ucaldas.edu.co      │
│  Contraseña: Admin123!                                   │
├──────────────────────────────────────────────────────────┤
│  LECTOR QR (para el escáner admin):                      │
│  Buseta BUS-101 (FTV123): lectorSerie = SR-999-A         │
│  Buseta BUS-202 (GHY456): lectorSerie = SR-888-B         │
└──────────────────────────────────────────────────────────┘
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando la semilla:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
