// tests/backend-flow.ts
import { authService } from '../server/services/auth.service'
import { qrService } from '../server/services/qr.service'
import { validationService } from '../server/services/validation.service'
import { reportService } from '../server/services/report.service'
import { userRepository } from '../server/repositories/user.repository'
import { cache } from '../server/utils/redis'
import { prisma } from '../server/utils/prisma'

// Mock useRuntimeConfig para que funcione fuera de Nuxt durante la prueba CLI
;(global as any).useRuntimeConfig = () => ({});

// Mock createError para que funcione fuera de Nuxt
;(global as any).createError = (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as any;
  err.statusCode = opts.statusCode;
  err.statusMessage = opts.statusMessage;
  return err;
};


async function runTests() {
  console.log('🧪 ============================================================')
  console.log('🧪 INICIANDO PRUEBAS DE INTEGRACIÓN DEL BACKEND ENBUS (SOLID)')
  console.log('🧪 ============================================================\n')

  let testCount = 0
  let passedCount = 0

  function assert(condition: boolean, message: string) {
    testCount++
    if (condition) {
      passedCount++
      console.log(`✅ [TEST ${testCount}] PASÓ: ${message}`)
    } else {
      console.error(`❌ [TEST ${testCount}] FALLÓ: ${message}`)
    }
  }

  try {
    // -------------------------------------------------------------
    // PASO 1: Registro de Estudiante
    // -------------------------------------------------------------
    console.log('👉 [Fase 1] Registrando estudiante con dominio institucional ucaldas.edu.co...')
    const correoTest = `maria.sanchez@ucaldas.edu.co`
    
    // Limpiar si el usuario ya existe de ejecuciones previas
    const usuarioPrevio = await userRepository.findByCorreo(correoTest)
    if (usuarioPrevio) {
      await prisma.servicio.deleteMany({ where: { usuarioId: usuarioPrevio.id } })
      await prisma.cuotaMensual.deleteMany({ where: { usuarioId: usuarioPrevio.id } })
      await prisma.usuario.delete({ where: { id: usuarioPrevio.id } })
    }

    const regResult = await authService.register(
      'María',
      'Sánchez',
      correoTest,
      'ContrasenaSegura456!'
    )
    assert(regResult.message.includes('Revisa tu correo'), 'El registro de dominio válido debe retornar un mensaje de activación.')

    const maria = await userRepository.findById(regResult.userId)
    assert(maria?.estado === 'INACTIVO', 'El estudiante registrado debe iniciar en estado INACTIVO.')

    // Registro fallido por dominio incorrecto
    try {
      await authService.register('Fraude', 'Perez', 'fraude@gmail.com', 'Clave123!')
      assert(false, 'El sistema debió rechazar el registro con dominio @gmail.com.')
    } catch (e: any) {
      assert(e.statusCode === 403, 'Rechaza dominios no autorizados con código de estado 403.')
    }

    // -------------------------------------------------------------
    // PASO 2: Verificación MFA (Activación de Cuenta)
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 2] Simulando verificación MFA de correo...')
    const actResult = await authService.activateAccount(maria!.id)
    assert(actResult.message.includes('Cuenta activada'), 'El endpoint de verificación debe retornar confirmación de activación.')

    const mariaActiva = await userRepository.findById(maria!.id)
    assert(mariaActiva?.estado === 'ACTIVO', 'El estado del usuario debe pasar a ACTIVO.')
    assert(mariaActiva?.cuotaRestanteMes === 5, 'El usuario activado debe inicializar con su cuota de 5 pasajes.')

    // -------------------------------------------------------------
    // PASO 3: Login de Estudiante
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 3] Intentando inicio de sesión con token de sesión en caché...')
    const loginResult = await authService.login(correoTest, 'ContrasenaSegura456!')
    assert(!!loginResult.token, 'El inicio de sesión exitoso debe proveer un token de sesión.')
    assert(loginResult.usuario.correo === correoTest, 'Los datos devueltos corresponden al correo autenticado.')

    // -------------------------------------------------------------
    // PASO 4: Generación de QR Temporal
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 4] Estudiante solicita generación de código QR...')
    const qrResult = await qrService.generateQr(maria!.id)
    assert(!!qrResult.token, 'Se debe emitir un token cifrado para renderizar el QR.')
    assert(qrResult.expiraEnSegundos === 300, 'El TTL del token temporal debe ser de 300 segundos (5 minutos).')

    // Verificar existencia del token en la caché temporal
    const cacheVal = await cache.get(`qr:token:${qrResult.token}`)
    assert(cacheVal === maria!.id, 'El token temporal debe estar guardado en la caché vinculando al ID del estudiante.')

    // -------------------------------------------------------------
    // PASO 5: Validación del Escaneo (Éxito)
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 5] Conductor/Lector escanea código QR en el bus...')
    // Usamos el serial SR-999-A que corresponde a la Buseta 1 de Autobuses Manizales en el Seed
    const valResult = await validationService.validateQr(qrResult.token, 'SR-999-A')
    
    assert(valResult.success === true, 'La validación del token vigente debe retornar éxito.')
    assert(valResult.status === 'APROBADO', 'El estado de la respuesta debe ser APROBADO.')
    assert(valResult.color === 'green' && valResult.sound === 'bip', 'Debe emitir feedback visual verde y sonoro "bip" para el conductor.')
    assert(valResult.cuotaRestante === 4, 'La cuota restante del estudiante debe decrementar a 4.')

    // Verificar borrado inmediato de caché (Prevención de Doble Escaneo)
    const tokenExCache = await cache.get(`qr:token:${qrResult.token}`)
    assert(tokenExCache === null, 'El token verificado debe eliminarse de la caché temporal inmediatamente.');

    // -------------------------------------------------------------
    // PASO 6: Doble Escaneo (Intento de fraude o reuso)
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 6] Conductor escanea el mismo código por segunda vez...')
    const doubleResult = await validationService.validateQr(qrResult.token, 'SR-999-A')
    assert(doubleResult.success === false, 'El doble escaneo debe ser rechazado.')
    assert(doubleResult.status === 'RECHAZADO', 'El estado devuelto debe ser RECHAZADO.')
    assert(doubleResult.color === 'red' && doubleResult.sound === 'error', 'El feedback emitido debe ser rojo y emitir alerta de error.')

    // -------------------------------------------------------------
    // PASO 7: Agotamiento de Cupo (Consumir pasajes)
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 7] Estudiante consume los 4 pasajes restantes uno por uno...')
    
    // Viaje 2 (Quedan 3)
    const qr2 = await qrService.generateQr(maria!.id)
    await validationService.validateQr(qr2.token, 'SR-999-A')
    
    // Viaje 3 (Quedan 2)
    const qr3 = await qrService.generateQr(maria!.id)
    await validationService.validateQr(qr3.token, 'SR-999-A')
    
    // Viaje 4 (Quedan 1)
    const qr4 = await qrService.generateQr(maria!.id)
    await validationService.validateQr(qr4.token, 'SR-999-A')
    
    // Viaje 5 (Quedan 0)
    const qr5 = await qrService.generateQr(maria!.id)
    const v5 = await validationService.validateQr(qr5.token, 'SR-999-A')
    
    assert(v5.cuotaRestante === 0, 'La cuota mensual del estudiante debe llegar exactamente a 0.')

    // -------------------------------------------------------------
    // PASO 8: Bloqueo de Generación por Límite Alcanzado
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 8] Estudiante intenta generar un 6to pasaje sin cupo...')
    try {
      await qrService.generateQr(maria!.id)
      assert(false, 'El sistema debió rechazar la generación al no contar con pasajes restantes.')
    } catch (e: any) {
      assert(e.statusCode === 400, 'Rechaza la generación retornando código 400.')
      assert(e.statusMessage.includes('límite de usos'), 'El mensaje debe indicar que alcanzó el límite de usos.')
    }

    // -------------------------------------------------------------
    // PASO 9: Consolidación de Reportes para Stakeholders
    // -------------------------------------------------------------
    console.log('\n👉 [Fase 9] Alcaldía y Empresas consultan el Dashboard consolidado...')
    const reporte = await reportService.getConsolidatedReport()
    
    assert(reporte.resumenGlobal.totalPasajesDiferencialesHistóricos >= 5, 'El reporte cuenta correctamente todos los viajes autorizados.')
    assert(reporte.empresasTransporte.length > 0, 'El reporte detalla las estadísticas agrupadas por empresa.')
    
    const empresa1 = reporte.empresasTransporte.find(emp => emp.nombre.includes('Autobuses Manizales'))
    assert(empresa1 !== undefined && empresa1.totalVentasDia >= 5, 'Registra de manera precisa las ventas diarias en Autobuses Manizales.')

    console.log('\n============================================================')
    console.log('📊 RESUMEN AGREGADO DEL REPORTE DE STAKEHOLDERS:')
    console.log(`- Viajes hoy: ${reporte.resumenGlobal.totalPasajesHoy}`)
    console.log(`- Ventas por Empresa:`)
    reporte.empresasTransporte.forEach(emp => {
      console.log(`  * ${emp.nombre}: ${emp.totalVentasDia} ventas hoy (${emp.totalHistorico} histórico)`)
    })
    console.log('============================================================\n')

    // -------------------------------------------------------------
    // RESULTADOS FINALES
    // -------------------------------------------------------------
    console.log('🧪 ============================================================')
    console.log('🧪 SIMULACIÓN Y PRUEBAS CONCLUIDAS')
    console.log(`🧪 PASARON: ${passedCount} / ${testCount} PRUEBAS`)
    console.log('🧪 ============================================================')

    if (passedCount === testCount) {
      console.log('\n🌟 ¡EL BACKEND SOLID DE ENBUS FUNCIONA PERFECTAMENTE! 🌟\n')
    } else {
      console.error('\n⚠️ Hay fallas en algunos de los tests. Revisa los logs.\n')
    }

  } catch (error) {
    console.error('❌ EXCEPCIÓN DURANTE LA EJECUCIÓN DE PRUEBAS:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Conexión de base de datos cerrada.')
  }
}

runTests()

