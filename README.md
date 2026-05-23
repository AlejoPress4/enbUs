# Documentación del MVP - enbUs

## 1. Listado de Funcionalidades del Sistema

### Gestión de Identidad y Acceso
* **Registro Institucional:** Creación de cuenta restringida exclusivamente a correos con dominio `@ucaldas.edu.co`.
* **Doble Factor de Autenticación (MFA):** Envío de enlace de verificación al correo electrónico mediante Azure Notification Hubs para activar la cuenta.
* **Autenticación Segura:** Inicio de sesión con correo y contraseña, generando un token JWT con vigencia de 24 horas.

### Motor QR Temporal (Core)
* **Generación de QR Cifrado:** Creación de un token único de un solo uso que contiene el ID del usuario y datos de validación.
* **Temporalidad y Seguridad (Redis):** Asignación de un Tiempo de Vida (TTL) de 5 minutos al token generado, gestionado directamente en memoria caché (Redis) para garantizar su expiración automática.
* **Interfaz de Cuenta Regresiva:** Visualización del QR en la app del estudiante con un reloj de cuenta regresiva en tiempo real.

### Gestión Dinámica de Cupos
* **Consulta de Políticas Externas:** Comunicación con una API de la institución para consultar dinámicamente el límite de usos mensuales asignado al perfil del estudiante.
* **Alta Disponibilidad (Circuit Breaker):** Sistema de respaldo que lee la cuota almacenada en caché local en caso de que el servicio externo de la institución falle o tarde en responder.

### Módulo Piloto de Escáner (Admin / Conductor)
* **Lector QR Web:** Interfaz que utiliza la cámara del dispositivo móvil para escanear el código generado por el estudiante.
* **Validación en Tiempo Real:** Verificación ultrarrápida del token contra Redis para aprobar o rechazar el viaje.
* **Feedback Multimedia:** Emisión de un sonido (bip) y cambio de color en pantalla (verde/rojo) para confirmar al conductor el estado de la validación sin necesidad de leer la pantalla detalladamente.
* **Modo Offline Básico:** Registro local de intentos fallidos por pérdida de señal para sincronización posterior (conductor gestiona cobro manual mientras tanto).

### Trazabilidad y Datos (Preparación para Data/Python)
* **Registro de Viajes:** Almacenamiento automático en la base de datos (PostgreSQL) del ID del usuario, la `BUSETA` y la `RUTA` correspondiente en cada validación exitosa.
* **Control de Uso:** Prevención y registro de actividad inusual si se intenta escanear un QR ya utilizado o expirado.

### Dashboard y Estadísticas del Estudiante
* **Resumen en Tiempo Real:** Visualización de cupos restantes del mes y ahorro acumulado en pesos colombianos (COP).
* **Historial de Validaciones:** Listado detallado de viajes anteriores filtrable por resultado (Aprobados, Rechazados, Mes actual).

### Sistema de Notificaciones (Azure)
* **Alertas Push:** Envio de codigo de verificacion al correo.

---

## 2. Historias de Usuario (Gherkin)

### Epic 1: Autenticación y Registro

```gherkin
Feature: Registro e inicio de sesión del estudiante
  Como estudiante universitario
  Quiero registrarme y acceder con mi correo institucional
  Para hacer uso del beneficio de la tarifa diferencial de transporte

  Scenario: Registro exitoso con correo institucional válido
    Given que el estudiante ingresa a la app enbUs por primera vez
    And tiene un correo con dominio "@ucaldas.edu.co"
    When completa el formulario con nombre, correo y contraseña
    And presiona el botón "Crear cuenta nueva"
    Then el sistema valida el dominio contra la tabla Institucion
    And crea un nuevo registro en la tabla Usuario con estado "INACTIVO"
    And envía un correo de verificación al estudiante vía Azure
    And muestra el mensaje "Revisa tu correo para activar tu cuenta"

  Scenario: Registro fallido con correo no institucional
    Given que el estudiante intenta registrarse
    When ingresa un correo con dominio "@gmail.com"
    And presiona "Crear cuenta nueva"
    Then el sistema rechaza el registro
    And muestra el mensaje "Solo se permiten correos institucionales"

  Scenario: Inicio de sesión exitoso
    Given que el estudiante tiene cuenta activa en enbUs
    When ingresa su correo institucional y contraseña correctos
    And presiona "Entrar"
    Then el sistema genera un SesionToken JWT con expiración de 24 horas
    And redirige al estudiante al Dashboard principal
    And actualiza el campo ultimoAcceso del Usuario

### Epic 2: Generacion y gestion QR 

Feature: Generación de código QR con límites dinámicos
  Como estudiante autenticado
  Quiero generar un código QR desde la app
  Para acceder a la tarifa diferencial, sujeto a las políticas de la institución

  Scenario: Generación exitosa con validación de límite dinámico
    Given que el estudiante está autenticado en la app
    And el sistema consulta la API de la Institucion para obtener el limiteUsos actual
    And los usosRealizados del mes son menores al limiteUsos
    When presiona el botón "Generar código QR"
    Then el sistema crea un CodigoQR temporal cifrado
    And asigna un TTL de 300 segundos (5 minutos)
    And almacena el token en Redis
    And muestra el QR en pantalla con el contador regresivo
    And registra el uso provisional en CuotaMensual

  Scenario: Generación fallida por límite mensual alcanzado
    Given que el estudiante está autenticado
    When presiona el botón "Generar código QR"
    Then el sistema detecta que el estudiante alcanzó el limiteUsos
    And el sistema no genera ningún CodigoQR
    And muestra el mensaje "Has alcanzado el límite de usos asignado por tu institución"
    And envía una Notificacion de tipo "CUPO_AGOTADO"

  Scenario: Falla de operabilidad en el servicio de cupos externo
    Given que el estudiante presiona "Generar código QR"
    When el sistema no puede comunicarse con la API de la Institucion (timeout > 2s)
    Then el sistema lee el último limiteUsos almacenado en la caché local
    And permite la generación del QR si hay cupo local disponible
    And encola una sincronización asíncrona

  Scenario: Código QR expira sin ser escaneado
    Given que el estudiante generó un CodigoQR con estado "ACTIVO"
    When transcurren 300 segundos sin ser escaneado
    Then Redis elimina el token automáticamente
    And la app muestra el mensaje "Tu código ha expirado, genera uno nuevo"

### Epic 3: Validacion y Trazabilidad
Feature: Validación del código QR en la buseta
  Como administrador/conductor con el lector QR piloto
  Quiero verificar el token del estudiante
  Para autorizar la tarifa diferencial y registrar la trazabilidad del viaje

  Scenario: Validación exitosa — QR vigente
    Given que el LectorQR está activo y conectado
    And el estudiante presenta un CodigoQR "ACTIVO" generado hace menos de 5 min
    When el lector escanea el QR
    Then el backend verifica la vigencia del token en Redis
    And registra una Validacion "APROBADO" vinculando Usuario, Buseta y Ruta en la tabla SERVICIO
    And elimina el token de Redis
    And el lector reproduce un sonido de confirmación ("bip")
    And la pantalla del lector se ilumina de verde

  Scenario: Validación fallida — QR expirado o manipulado
    Given que el estudiante presenta un CodigoQR cuyo TTL venció en Redis
    When el lector escanea el QR
    Then el backend no encuentra el token en Redis
    And registra una Validacion con resultado "RECHAZADO" y motivo "Token expirado"
    And la pantalla del lector muestra señal roja
    And el sistema notifica al estudiante que debe generar un nuevo QR

  Scenario: Validación fallida — Intento de doble escaneo
    Given que un CodigoQR ya fue validado exitosamente
    When el lector intenta escanear el mismo QR por segunda vez
    Then el backend rechaza la solicitud (token no existe en Redis)
    And registra el evento como actividad inusual
    And la pantalla del lector muestra señal roja


### Flujo Lógico del Sistema (System Flow)

* **Flujo de Generación (Estudiante):**
App (Client) -> Controller (API) -> Service (Validar Cupo en DB) -> Repository (Update Cuota) -> Redis (Set Token con TTL) -> Response (QR Payload).

* **Flujo de Validación (Admin/Buseta):**
Scanner Component -> Service (Get User by ID) -> Check Redis (¿Existe el token?) -> Update Service (Registrar Viaje + Ruta + Bus) -> Trigger Sound (Web Audio API) -> Push Notification (Azure Hubs).

* **Flujo de Trazabilidad (Data Analytics):**
Cada validación exitosa escribe en la tabla SERVICIO con los campos bus_id y ruta_id, permitiendo que el Microservicio Python consuma esta tabla mediante una réplica de lectura o un proceso ETL.


### Flujo Operativo del Sistema (System Flow)
Este es el camino que recorre la información desde que el estudiante interactúa hasta que los datos llegan a tu microservicio de Python.

* **Flujo A: El Ciclo del Beneficio (Estudiante)**
    * Registro: El usuario ingresa correo  AuthService valida dominio  Se crea registro en Usuario como "INACTIVO"  Se dispara notificación vía Azure Hubs.
    * Generación QR: El estudiante solicita QR  QrService consulta CuotaRepository  Si hay cupos, genera token  Se guarda en Redis (con TTL 300s) y se registra en DB  El Frontend muestra el QR con cuenta regresiva.
* **Flujo B: El Ciclo de Validación (Admin/Buseta)**
    * Escaneo: El Admin usa la cámara  El sistema extrae el ID del usuario  Envía al ValidationService.
    * Verificación: El Service consulta Redis  Si existe, busca en la DB para validar estado de usuario y cupo  Actualiza tabla SERVICIO con buseta_id y ruta_id.
    * Feedback: Si es exitoso: Se activa el sonido de éxito en el móvil + Notificación Push al estudiante. Si falla (expirado/usado): Se activa el sonido de error.
* **Trazabilidad:** La tabla SERVICIO queda actualizada con la métrica de uso, lista para que tu Microservicio Python realice el conteo de ventas por empresa y rutas más usadas.


###Alineación con Normas ISO 25100 & SOLID
Disponibilidad (Availability): Uso de Redis para asegurar que la validación sea ultra rápida incluso si la base de datos principal tiene alta carga. Implementación de un "Modo Offline" local en el scanner.
Operabilidad (Operability): Interfaz intuitiva con feedback auditivo (sonido éxito/error) y visual (colores verde/rojo) para conductores.
Comportamiento Temporal (Temporal Behavior): Gestión estricta de la expiración mediante TTL en Redis, garantizando que un QR no sea reutilizable después de 5 minutos.
SOLID:
Single Responsibility: Los Repositories solo tocan la DB; los Services solo calculan lógica.
Dependency Inversion: El Controller depende de una interfaz de Service, no de una implementación concreta.


### Arquitectura del Proyecto

enbUs/
├── components/              # Componentes visuales reutilizables (Presentación)
├── pages/                   # Pantallas y rutas de la aplicación (Navegación)
├── server/                  # Backend 100% aislado y seguro (Motor Nitro)
├── prisma/                  # Modelado y migraciones de PostgreSQL (ORM)
├── composables/             # Hooks reactivos de Vue para el cliente
├── stores/                  # Estado global de la aplicación (Pinia)
├── utils/                   # Funciones de ayuda (Helpers) para el Frontend

### Diagrama de Clases

``````mermaid
erDiagram
  USUARIO ||--|{ SERVICIO : "1 a N (adquiere)"
  USUARIO }|--|| INSTITUCION : "N a 1 (pertenece_a)"
  USUARIO ||--|{ CUOTA_MENSUAL : "1 a N (tiene)"
  SERVICIO }|--|| BUSETA : "N a 1 (se_implementa_en)"
  BUSETA }|--|| EMPRESA_TRANSPORTE : "N a 1 (pertenece_a)"
  BUSETA ||--|| LECTOR_QR : "1 a 1 (equipa)"
  
  %% Relación intermedia
  BUSETA ||--|{ BUSETA_RUTA : "1 a N (asignada_a)"
  RUTA ||--|{ BUSETA_RUTA : "1 a N (incluye)"

  USUARIO {
    uuid id PK
    string nombre
    string apellido
    string correo_institucional
    string contrasena_hash
    uuid institucion_id FK
    timestamp fecha_registro
    enum estado
    int cuota_restante_mes
  }

  INSTITUCION {
    uuid id PK
    string nombre
    string dominio_correo
    boolean activa
    timestamp fecha_registro
  }

  SERVICIO {
    uuid id PK
    uuid usuario_id FK
    uuid buseta_id FK
    string token_cifrado
    timestamp fecha_generacion
    timestamp fecha_expiracion
    timestamp fecha_hora_validacion
    enum estado
    enum resultado_validacion
    string motivo_rechazo
  }

  CUOTA_MENSUAL {
    uuid id PK
    uuid usuario_id FK
    int mes
    int anio
    int usos_realizados
    int limite_usos
  }

  BUSETA {
    uuid id PK
    uuid empresa_id FK
    string placa
    string numero_interno
    boolean activa
  }

  LECTOR_QR {
    uuid id PK
    uuid buseta_id FK
    string numero_serie
    enum estado
    timestamp ultima_sincronizacion
  }

  EMPRESA_TRANSPORTE {
    uuid id PK
    string nombre
    string nit
    string contacto
    boolean activa
  }

  RUTA {
    uuid id PK
    string nombre
    string origen
    string destino
    boolean activa
  }

  BUSETA_RUTA {
    uuid id PK
    uuid buseta_id FK
    uuid ruta_id FK
    timestamp fecha_asignacion
    boolean activa
  }
``````