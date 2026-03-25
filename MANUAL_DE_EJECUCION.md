# 🏥 Manual de Ejecución SIGSALUD

Este manual describe paso a paso cómo iniciar y probar localmente la plataforma hospitalaria interconectada **SIGSALUD** (compuesta por los subsistemas HIS, LIS y RIS).

## 1. Requisitos Previos

Asegúrate de tener instalado en tu computadora:

- **Node.js** (Versión 16 o superior). Puedes verificarlo ejecutando `node -v` en tu terminal.
- **Git Bash / PowerShell / Terminal de VS Code**.

El proyecto ya cuenta con las bases de datos SQlite autogeneradas y la dependencia de paquetes en el directorio raíz.

## 2. Instalación de Dependencias

Si aún no has instalado las dependencias del servidor, abre una terminal en la ruta principal del proyecto (`SIGSALUD`) y ejecuta:

```bash
npm install
```

## 3. Ejecutar los Servidores (Interoperabilidad)

El sistema consta de 3 subsistemas que se comunican entre sí. Debes ejecutar **cada uno en una terminal separada**.

Abre tres hiper-terminales / pestañas (por ejemplo, en VS Code haciendo clic en `+` en la consola) y asegúrate de que todas estén ubicadas en la carpeta `SIGSALUD`.

### Terminal 1: Iniciar el HIS (Hospital Information System)
```bash
npm run dev:his
```
*(Deberás ver en la consola: `[HIS] Servidor corriendo en http://localhost:3001`)*

### Terminal 2: Iniciar el RIS (Radiology Information System)
```bash
npm run dev:ris
```
*(Deberás ver en la consola: `[RIS] Servidor corriendo en http://localhost:3002`)*

### Terminal 3: Iniciar el LIS (Laboratory Information System)
```bash
npm run dev:lis
```
*(Deberás ver en la consola: `[LIS] Servidor corriendo en http://localhost:3003`)*

> 💡 **Tip:** Usamos `npm run dev:...` para que si haces algún cambio en el código, el servidor se reinicie automáticamente (nodemon).

---

## 4. Probar el Sistema Completo (Flujo E2E)

He dejado un **script de prueba automático** (`test_integration.js`) que realiza todo el proceso clínico como si un hospital entero estuviera operando al mismo tiempo:

1. El Administrador hace login en el HIS y registra un paciente y un médico.
2. El Médico recibe un token temporal, crea un historial clínico (visita) y manda dos órdenes (una de Lab y otra de Radiología).
3. Automáticamente, el HIS se comunicará en milisegundos con el LIS y el RIS para entregar las órdenes.
4. El script simulará ser el técnico del LIS y el técnico del RIS registrando toma de muestras y ecografías.
5. Los médicos de LIS y RIS escribirán resultados críticos y validarán informes electrónicamente.
6. El LIS y el RIS dispararán *Webhooks HTTP* enviando los dictámenes validados de vuelta al HIS.
7. Finalmente, el HIS confirmará las notificaciones en el buzón del médico tratante.

**Para ver esta magia ocurrir en tu propia consola:**

Abre una **cuarta terminal** en la carpeta `SIGSALUD` (sin detener los otros tres servidores) y ejecuta:

```bash
node test_integration.js
```

Verás paso a paso el viaje de la información. Al mismo tiempo, si miras las terminales del HIS, LIS y RIS notarás cómo reciben los "POST" y "GET" y cómo se cruzan la información entre ellos en tiempo real.

## 5. Pruebas Manuales (Postman / cURL)

Si quieres agregar a un paciente manualmente, puedes abrir herramientas como **Postman** u **Hoppscotch** y golpear directamente el HIS en `localhost:3001`.

Por ejemplo, para revisar el estado general (Health Check) de los servidores desde tu navegador web:

- **Salud del HIS:** [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **Salud del RIS:** [http://localhost:3002/api/health](http://localhost:3002/api/health)
- **Salud del LIS:** [http://localhost:3003/api/health](http://localhost:3003/api/health)

¡Listo! Con estos pasos estás corriendo una arquitectura de microservicios robusta y orientada a eventos.
