# Prompt Maestro: Replicación Identica SIGSALUD 🏥

Este prompt está diseñado para ser entregado a un asistente de IA codificador (como Antigravity/Cursor/Claude) para reconstruir el ecosistema SIGSALUD desde cero con todos los refinamientos funcionales de esta sesión.

---

## 🚀 PROMPT PARA EL ASISTENTE

"Actúa como un Arquitecto de Software Fullstack Senior. Necesito replicar un sistema hospitalario integrado llamado **SIGSALUD**. El sistema debe ser funcional, seguir principios SOLID, ISP y patrones Clean Architecture.

### 1. ARQUITECTURA Y CREDENCIALES
- **Estructura:** 3 Microservicios en Node.js + Frontend React.
- **Seguridad:** JWT (`Authorization: Bearer <token>`) para Auth y `x-service-key: sigsalud-internal` para Webhooks.
- **Credenciales Maestras:**
  - **Administrador:** `admin` / `Admin1234!` (Acceso total).
  - **Médico:** `medico` / `admin123` (Rol: `MEDICO`).
  - **Técnico Lab:** `tec_lab` / `admin123` (Rol: `TECNICO_LAB`).
  - **Radiólogo:** `radiologo` / `admin123` (Rol: `RADIOLOGO`).

### 2. ESPECIFICACIONES DE LOS MÓDULOS

#### A. HIS (Sistema Principal - Puerto 3001)
- **Login:** Implementar `AuthController` con persistencia en `localStorage`. Al loguear, redirigir según el rol del JWT.
- **Registro de Paciente:** Modal o Prompt que pida Nombre y CC. Al crear, permitir seleccionar de una lista maestra a la izquierda.
- **Flujo Médico:** 
  1. Seleccionar paciente → Ver historial central.
  2. Botón **'Nueva Consulta'** → Crea registro en `clinical_records`.
  3. Botones **'Orden Lab/Rad'** → Envía JSON al puerto 3003 o 3002 usando un `IntegrationService` asíncrono (`setImmediate`).

#### B. LIS (Laboratorio - Puerto 3003)
- **Flujo de Trabajo:**
  1. Bandeja de órdenes recibidas (`status: RECIBIDA`).
  2. Botón 'Registrar Muestra' → Cambia estado a `MUESTRA_TOMADA`.
  3. Botón 'Simular Analizador' → Genera valor aleatorio (ej. Leucocitos). 
  4. **Lógica Crítica:** Si el valor está fuera de rango (ej. > 11.0), marcar automáticamente un flag `is_critical`.
  5. Botón 'Validar' → Genera PDF (mock) y notifica al HIS mediante un `webhook` POST.

#### C. RIS (Radiología - Puerto 3002)
- **Flujo de Trabajo:**
  1. Recepción de orden → Confirmación inmediata de vuelta al HIS.
  2. Botón 'Agendar' → Guardar en `schedules` verificando que la sala no esté ocupada en ese `scheduled_at`.
  3. Botón 'Realizar Estudio' → Integrar con **Orthanc PACS** (usar `127.0.0.1:8042` y Auth Basic). Guardar el ID de estudio de Orthanc.
  4. Botón 'Redactar Informe' → Radiólogo escribe Hallazgos y Conclusión.
  5. Botón 'Validar' → El informe pasa a ser inmutable y se envía vía webhook al HIS.

#### D. Frontend (Diseño y Flujos)
- **Estética Glassmorphism:** Fondo oscuro con gradientes azul/cian. Dashboards usando `glass-panel` con `background: rgba(255, 255, 255, 0.05)` y `backdrop-filter: blur(12px)`.
- **Navegación:** `App.jsx` debe usar `PrivateRoute` para proteger rutas. 
- **Icons:** Usar `Activity`, `Beaker`, `Image`, `User`, `LogOut` de Lucide-React.
- **Unificación:** Un solo proyecto de React que, al detectar el rol, renderiza el componente `PatientDashboard` (HIS), `LabDashboard` (LIS) o `RadiologyDashboard` (RIS).


### 3. REGLAS DE NEGOCIO Y REQUISITOS CLAVE (HU)

#### A. Integridad y Auditoría (HU18, HU31, HU49)
- Cada microservicio debe registrar en una tabla `audit_logs` cada acción crítica: login, creación de orden, validación de resultados y acceso a datos sensibles (ISP).
- El log debe incluir: `action`, `entity_id`, `performed_by` y `timestamp`.

#### B. Lógica de Laboratorio (LIS)
- **HU28 (Inmutabilidad):** Una vez que un resultado es validado por el bacteriólogo, el sistema DEBE bloquear cualquier intento de edición (Read-only).
- **HU32 (Alertas Críticas):** Durante el registro de resultados, si un valor excede el `reference_range`, el sistema debe marcar la orden como `is_critical` y notificar visualmente al médico en el HIS (HU09).

#### C. Lógica de Radiología (RIS)
- **HU39 (Conflictos):** Al agendar una cita, el sistema debe consultar la tabla `schedules` y prohibir el registro si la misma `room` (sala) ya tiene una cita que se traslape en horario.
- **HU46/47 (PACS):** Generar una URL tipo WADO (`/preview`) para que el médico en el HIS pueda ver la miniatura de la radiografía sin salir de la historia clínica.

#### D. Notificaciones HIS (HU09)
- El HIS debe tener un sistema de polling o notificación que avise al médico inmediatamente cuando una orden de Lab o Rad pase a estado `COMPLETADA` o `VALIDADA`.

### 4. CONFIGURACIÓN DE RED Y SEGURIDAD (CRÍTICO)
- Todos los servicios deben escuchar en `0.0.0.0` para evitar problemas de resolución en Windows.
- La comunicación inter-sistema debe usar `127.0.0.1` en vez de `localhost`.
- Sincronizar la `INTERNAL_SERVICE_KEY: sigsalud-internal` en todos los archivos `.env`.

### 4. ENTREGABLES ESPERADOS
1. Estructura de carpetas: `/his`, `/lis`, `/ris`, `/frontend`.
2. Archivos `.env` configurados para interoperabilidad inmediata.
3. Repositories y Services separados para cada lógica de negocio.
4. Un archivo `test_integration.js` en la raíz para validar el flujo completo mediante scripts."

---

## 📂 Archivos Clave a Incluir (Contexto adicional):
Para una precisión del 100%, entrega también los esquemas de base de datos definidos en los `initDb.js` y las variables CSS definidas en el `index.css` de esta sesión.
