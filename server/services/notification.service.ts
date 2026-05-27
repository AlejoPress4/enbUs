// server/services/notification.service.ts
import crypto from 'node:crypto'

export class NotificationService {
  /**
   * Genera el encabezado de autorización HMAC-SHA256 requerido para firmar
   * de forma nativa peticiones HTTP directas a Azure Communication Services.
   */
  private generateAcsSignature(
    host: string,
    uriPathAndQuery: string,
    verb: string,
    dateStr: string,
    bodyJson: string,
    accessKey: string
  ): { authorization: string; contentHash: string } {
    // 1. Obtener hash SHA-256 en Base64 del cuerpo JSON
    const contentHash = crypto
      .createHash('sha256')
      .update(bodyJson)
      .digest('base64')

    // 2. Construir la cadena que se va a firmar (string-to-sign)
    // El orden y los campos deben coincidir exactamente con los SignedHeaders
    const stringToSign = `${verb}\n${uriPathAndQuery}\n${dateStr};${host};${contentHash}`

    // 3. Firmar usando HMAC-SHA256 con la llave de acceso decodificada desde Base64
    const keyBuffer = Buffer.from(accessKey, 'base64')
    const signature = crypto
      .createHmac('sha256', keyBuffer)
      .update(stringToSign)
      .digest('base64')

    // 4. Retornar el header estructurado
    const authorization = `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`
    return { authorization, contentHash }
  }

  /**
   * Envía un correo con el código/enlace de activación MFA utilizando Azure Communication Services.
   */
  async sendMfaNotification(correo: string, enlaceActivacion: string): Promise<void> {
    const connectionString = process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING
    const senderEmail = process.env.AZURE_COMMUNICATION_SERVICE_SENDER_EMAIL

    const token = enlaceActivacion.split('=')[1] || ''
    const subject = 'Activa tu cuenta de enbUs (Doble Factor)'
    const bodyText = `Hola, para activar tu tarifa preferencial estudiantil en enbUs, haz clic en el siguiente enlace de verificación:
http://localhost:3000${enlaceActivacion}

Tu código de activación/token es: ${token}`

    if (connectionString && senderEmail) {
      try {
        console.log(`✉️ [NOTIFICACIÓN ACS] Enviando correo MFA a través de Azure Communication Services...`)
        
        // Parsear Connection String de ACS
        // endpoint=https://<resource>.communication.azure.com/;accesskey=<key>
        const parts = connectionString.split(';')
        let endpoint = ''
        let accessKey = ''

        for (const part of parts) {
          const trimmed = part.trim()
          if (trimmed.toLowerCase().startsWith('endpoint=')) {
            endpoint = trimmed.substring(9)
          }
          if (trimmed.toLowerCase().startsWith('accesskey=')) {
            accessKey = trimmed.substring(10)
          }
        }

        endpoint = endpoint.replace(/\/$/, '') // Remover diagonal final si existe
        const host = endpoint.replace('https://', '')
        
        const uriPathAndQuery = '/emails/:send?api-version=2023-03-31'
        const url = `${endpoint}${uriPathAndQuery}`
        const dateStr = new Date().toUTCString()

        // Construir el cuerpo de petición de ACS Email API
        const requestBody = {
          senderAddress: senderEmail,
          content: {
            subject: subject,
            plainText: bodyText,
          },
          recipients: {
            to: [
              {
                address: correo,
              },
            ],
          },
        }

        const bodyJson = JSON.stringify(requestBody)
        const { authorization, contentHash } = this.generateAcsSignature(
          host,
          uriPathAndQuery,
          'POST',
          dateStr,
          bodyJson,
          accessKey
        )

        // Enviar petición POST nativa sin dependencias pesadas de SDK
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'x-ms-date': dateStr,
            'x-ms-content-sha256': contentHash,
            'host': host,
            'Authorization': authorization,
            'Content-Type': 'application/json',
          },
          body: bodyJson,
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errText}`)
        }

        console.log(`✅ [NOTIFICACIÓN ACS] Correo MFA enviado exitosamente a ${correo}.`)
        return
      } catch (err: any) {
        console.warn(`⚠️ Error al comunicarse con Azure Communication Services Email:`, err.message)
        console.log(`Fallback: Usando el simulador de consola...`)
      }
    }

    // Fallback: Simulador de Consola
    console.log(`\n======================================================`)
    console.log(`✉️ [AZURE COMMUNICATION SERVICES EMAIL SIMULATOR]`)
    console.log(`Para: ${correo}`)
    console.log(`Asunto: ${subject}`)
    console.log(`Cuerpo:\n${bodyText}`)
    console.log(`======================================================\n`)
  }

  /**
   * Envía una notificación confirmando la validación del pasaje estudiantil al correo del estudiante.
   */
  async sendTripNotification(correo: string, busetaNumero: string, pasajesRestantes: number): Promise<void> {
    const connectionString = process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING
    const senderEmail = process.env.AZURE_COMMUNICATION_SERVICE_SENDER_EMAIL

    const subject = 'enbUs - ¡Viaje Aprobado exitosamente!'
    const messageText = `¡Viaje aprobado! Tu tarifa diferencial estudiantil ha sido aplicada de forma exitosa en la Buseta #${busetaNumero}.\n\nPasajes restantes para este mes: ${pasajesRestantes}`

    if (connectionString && senderEmail) {
      try {
        console.log(`🔔 [NOTIFICACIÓN ACS] Enviando confirmación de viaje a través de Azure Communication Services...`)
        
        const parts = connectionString.split(';')
        let endpoint = ''
        let accessKey = ''

        for (const part of parts) {
          const trimmed = part.trim()
          if (trimmed.toLowerCase().startsWith('endpoint=')) {
            endpoint = trimmed.substring(9)
          }
          if (trimmed.toLowerCase().startsWith('accesskey=')) {
            accessKey = trimmed.substring(10)
          }
        }

        endpoint = endpoint.replace(/\/$/, '')
        const host = endpoint.replace('https://', '')
        
        const uriPathAndQuery = '/emails/:send?api-version=2023-03-31'
        const url = `${endpoint}${uriPathAndQuery}`
        const dateStr = new Date().toUTCString()

        const requestBody = {
          senderAddress: senderEmail,
          content: {
            subject: subject,
            plainText: messageText,
          },
          recipients: {
            to: [
              {
                address: correo,
              },
            ],
          },
        }

        const bodyJson = JSON.stringify(requestBody)
        const { authorization, contentHash } = this.generateAcsSignature(
          host,
          uriPathAndQuery,
          'POST',
          dateStr,
          bodyJson,
          accessKey
        )

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'x-ms-date': dateStr,
            'x-ms-content-sha256': contentHash,
            'host': host,
            'Authorization': authorization,
            'Content-Type': 'application/json',
          },
          body: bodyJson,
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errText}`)
        }

        console.log(`✅ [NOTIFICACIÓN ACS] Correo de viaje enviado exitosamente a ${correo}.`)
        return
      } catch (err: any) {
        console.warn(`⚠️ Error al enviar confirmación de viaje a Azure Communication Services Email:`, err.message)
        console.log(`Fallback: Usando el simulador de consola...`)
      }
    }

    // Fallback: Simulador de Consola
    console.log(`\n======================================================`)
    console.log(`🔔 [AZURE COMMUNICATION SERVICES EMAIL SIMULATOR]`)
    console.log(`Para estudiante: ${correo}`)
    console.log(`Mensaje: ${messageText}`)
    console.log(`======================================================\n`)
  }
}

export const notificationService = new NotificationService()
