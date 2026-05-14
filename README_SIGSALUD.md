# SIGSALUD Integrado - Versión Beta

SIGSALUD es una plataforma académica y demostrativa para simular la integración de tres sistemas de información en salud:

- **HIS**: Hospital Information System.
- **LIS**: Laboratory Information System.
- **RIS**: Radiology Information System.

El proyecto también incluye un servicio central de autenticación llamado **Auth/Login**, encargado de validar usuarios, roles, permisos y redirigir al sistema correspondiente.

Esta versión es una **beta funcional**, orientada a pruebas académicas, validación de arquitectura, integración API REST y simulación de flujos clínicos. No debe usarse en producción sin ajustes de seguridad, auditoría, cifrado, hardening, pruebas y validación normativa.

---

## 1. Servicios del proyecto

El paquete contiene cuatro servicios Node.js independientes:

| Servicio           | URL                         |
| ------------------ | --------------------------- |
| Auth/Login central | http://localhost:8007/login |
| HIS                | http://localhost:8001       |
| LIS                | http://localhost:8002       |
| RIS                | http://localhost:8003       |

Cada sistema funciona de forma independiente y tiene su propia base de datos PostgreSQL.

---

## 2. Arquitectura general

SIGSALUD usa una arquitectura híbrida:

1. El HIS crea la orden médica.
2. El HIS envía la orden por API REST a LIS o RIS.
3. LIS o RIS recibe la orden y la procesa en su propia base de datos.
4. LIS o RIS valida el resultado o informe.
5. LIS o RIS envía el resultado validado al HIS por API REST.
6. HIS guarda una copia clínica en `resultados_diagnosticos`.
7. HIS muestra esa copia desde la historia clínica.
8. Opcionalmente, HIS puede consultar por API REST el detalle actualizado en LIS o RIS.

Esta arquitectura evita que HIS dependa en tiempo real de LIS o RIS para mostrar resultados ya validados, pero mantiene la comunicación entre sistemas mediante API REST.

---

## 3. Bases de datos

El proyecto utiliza cuatro bases de datos separadas:

| Base de datos   | Uso                                                               |
| --------------- | ----------------------------------------------------------------- |
| `sigsalud_auth` | Usuarios, roles, permisos y sistemas                              |
| `sigsalud_his`  | Pacientes, historia clínica, órdenes, resultados y notificaciones |
| `sigsalud_lis`  | Órdenes de laboratorio, muestras, resultados y validaciones       |
| `sigsalud_ris`  | Órdenes radiológicas, agenda, estudios, PACS e informes           |

No se deben hacer consultas directas entre bases de datos. La integración debe hacerse por API REST.

---

## 4. Requisitos previos

Antes de instalar el proyecto, asegúrate de tener:

- Node.js 18 o superior.
- npm.
- PostgreSQL 14 o superior.
- Visual Studio Code o editor similar.
- Orthanc, opcional para pruebas RIS/PACS.

Para verificar Node.js:

```bash
node -v
npm -v
```

Para verificar PostgreSQL en Windows:

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

La ruta puede cambiar según la versión instalada de PostgreSQL.

---

## 5. Instalación de dependencias Node.js

Desde la raíz del proyecto:

```bash
npm install
```

---

## 6. Configuración del archivo `.env`

El proyecto incluye un archivo llamado:

```txt
.env.example
```

Debes copiarlo y renombrarlo como:

```txt
.env
```

En Windows:

```powershell
copy .env.example .env
```

Luego edita el archivo `.env` y cambia las contraseñas de PostgreSQL según tu instalación:

```env
AUTH_DB_PASSWORD=postgres
HIS_DB_PASSWORD=postgres
LIS_DB_PASSWORD=postgres
RIS_DB_PASSWORD=postgres
```

Si tu contraseña de PostgreSQL no es `postgres`, reemplázala por la correcta.

---

## 7. Archivo `.env` recomendado

```env
# ============================================================
# SIGSALUD - VARIABLES DE ENTORNO
# Versión beta académica / demostrativa
# ============================================================
# Este archivo contiene la configuración principal para ejecutar
# los cuatro servicios del sistema:
#
# Auth/Login  -> http://localhost:8007/login
# HIS         -> http://localhost:8001
# LIS         -> http://localhost:8002
# RIS         -> http://localhost:8003
#
# IMPORTANTE:
# 1. Copia este archivo y renómbralo como .env
# 2. Cambia las contraseñas de PostgreSQL según tu instalación
# 3. No subas el archivo .env real a GitHub
# ============================================================

# ============================================================
# PUERTOS DE LOS SERVICIOS
# ============================================================

AUTH_PORT=8007
HIS_PORT=8001
LIS_PORT=8002
RIS_PORT=8003

# ============================================================
# URLS LOCALES DE LOS SERVICIOS
# ============================================================

AUTH_URL=http://localhost:8007/login

HIS_PUBLIC_URL=http://localhost:8001
LIS_PUBLIC_URL=http://localhost:8002
RIS_PUBLIC_URL=http://localhost:8003

HIS_API_URL=http://localhost:8001/api
LIS_API_URL=http://localhost:8002/api
RIS_API_URL=http://localhost:8003/api

# ============================================================
# SEGURIDAD
# ============================================================
# JWT_SECRET:
# Se usa para firmar los tokens de inicio de sesión.
# Debe ser igual en Auth, HIS, LIS y RIS.
#
# INTERNAL_API_TOKEN:
# Se usa para comunicación interna entre sistemas por API REST.
# Ejemplo:
# HIS -> LIS
# HIS -> RIS
# LIS -> HIS
# RIS -> HIS
# ============================================================

JWT_SECRET=CAMBIAR_ESTE_SECRETO_SIGSALUD_2026
JWT_EXPIRES_IN=1h

INTERNAL_API_TOKEN=CAMBIAR_TOKEN_INTERNO_SIGSALUD

# ============================================================
# BASE DE DATOS AUTH / LOGIN
# ============================================================

AUTH_DB_HOST=localhost
AUTH_DB_PORT=5432
AUTH_DB_NAME=sigsalud_auth
AUTH_DB_USER=postgres
AUTH_DB_PASSWORD=postgres

# ============================================================
# BASE DE DATOS HIS
# ============================================================

HIS_DB_HOST=localhost
HIS_DB_PORT=5432
HIS_DB_NAME=sigsalud_his
HIS_DB_USER=postgres
HIS_DB_PASSWORD=postgres

# ============================================================
# BASE DE DATOS LIS
# ============================================================

LIS_DB_HOST=localhost
LIS_DB_PORT=5432
LIS_DB_NAME=sigsalud_lis
LIS_DB_USER=postgres
LIS_DB_PASSWORD=postgres

# ============================================================
# BASE DE DATOS RIS
# ============================================================

RIS_DB_HOST=localhost
RIS_DB_PORT=5432
RIS_DB_NAME=sigsalud_ris
RIS_DB_USER=postgres
RIS_DB_PASSWORD=postgres

# ============================================================
# ORTHANC / PACS
# ============================================================
# Orthanc NO viene incluido en este proyecto.
# Debe instalarse por separado en el equipo que actuará como PACS.
#
# Para pruebas locales, el RIS espera Orthanc en:
# http://localhost:8043
#
# El RIS usa Orthanc principalmente para:
# - Buscar estudios DICOM
# - Consultar imágenes
# - Relacionar imágenes con estudios radiológicos
# ============================================================

ORTHANC_URL=http://localhost:8043
ORTHANC_VIEWER_BASE=http://localhost:8043

# Si Orthanc tiene usuario y contraseña, configúralos aquí.
# Si no tiene autenticación, deja estos campos vacíos.

ORTHANC_USERNAME=
ORTHANC_PASSWORD=
```

---

## 8. Crear bases de datos

Puedes crear las bases desde pgAdmin o desde consola.

### Opción por consola

Abre PostgreSQL:

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

Ejecuta:

```sql
CREATE DATABASE sigsalud_auth;
CREATE DATABASE sigsalud_his;
CREATE DATABASE sigsalud_lis;
CREATE DATABASE sigsalud_ris;
```

Salir de PostgreSQL:

```sql
\q
```

---

## 9. Ejecutar SQL en Windows

Ejecuta los scripts desde la raíz del proyecto.

### Auth/Login

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_auth -f database/auth/01_schema.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_auth -f database/auth/02_initial_data.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_auth -f database/auth/03_patch_hybrid_permissions.sql
```

### HIS

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_his -f database/his/01_schema.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_his -f database/his/01_seed_his_masivo.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_his -f database/his/03_patch_his_hybrid_views.sql
```

### LIS

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_lis -f database/lis/01_schema.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_lis -f database/lis/02_seed_lis_masivo.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_lis -f database/lis/03_patch_lis_workflows.sql
```

### RIS

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_ris -f database/ris/01_schema.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_ris -f database/ris/03_seed_ris_masivo.sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sigsalud_ris -f database/ris/04_patch_ris_workflows.sql
```

---

## 10. Levantar los servicios

Puedes iniciar los servicios de forma individual, usando una terminal por cada servicio:

```bash
npm run auth
npm run his
npm run lis
npm run ris
```

También puedes usar el script general si el proyecto tiene configurado `start-all.js`:

```bash
npm run dev
```

Si `npm run dev` genera un error relacionado con `concurrently` o `cmd.exe`, inicia los servicios por separado.

---

Usa:

```bash
npm run dev
```

para levantar todo junto, o abre cuatro terminales y ejecuta:

```bash
npm run auth
npm run his
npm run lis
npm run ris
```

---

## 12. Acceso al sistema

Abre el navegador en:

```txt
http://localhost:8007/login
```

Contraseña demo para todos los usuarios:

```txt
Admin123*
```

Usuarios principales:

| Usuario                          | Sistema esperado     |
| -------------------------------- | -------------------- |
| `admin@sigsalud.com`             | HIS, LIS y RIS       |
| `medico@sigsalud.com`            | HIS                  |
| `bacteriologo@sigsalud.com`      | LIS                  |
| `laboratorio@sigsalud.com`       | LIS operativo        |
| `medico.radiologia@sigsalud.com` | RIS médico/radiólogo |
| `radiologia@sigsalud.com`        | RIS tecnólogo        |

---

## 13. Rutas principales

### HIS

| Ruta                              | Función                                |
| --------------------------------- | -------------------------------------- |
| `/historias`                      | Consulta general de historias clínicas |
| `/historias/paciente/:pacienteId` | Historia clínica de un paciente        |
| `/resultados`                     | Todos los resultados recibidos         |
| `/resultados/lis`                 | Resultados de laboratorio              |
| `/resultados/ris`                 | Informes radiológicos                  |
| `/notificaciones`                 | Centro de notificaciones               |
| `/auditoria`                      | Auditoría HIS                          |

### LIS

| Ruta                       | Función                                           |
| -------------------------- | ------------------------------------------------- |
| `/validacion`              | Lista de órdenes pendientes o listas para validar |
| `/validaciones/:id`        | Detalle completo de la muestra y resultados       |
| `/reportes`                | Reportes de laboratorio                           |
| `/pacientes`               | Pacientes del LIS                                 |
| `/pacientes/:id/historial` | Historial de laboratorio del paciente             |
| `/auditoria`               | Auditoría LIS                                     |

### RIS

| Ruta                       | Función                                |
| -------------------------- | -------------------------------------- |
| `/agenda`                  | Agenda radiológica                     |
| `/agenda/crear`            | Crear programación radiológica         |
| `/ejecucion`               | Ejecución tecnológica del estudio      |
| `/informes`                | Creación y gestión de informes médicos |
| `/informes/:id/validar`    | Validación del informe                 |
| `/pacientes`               | Pacientes RIS                          |
| `/pacientes/:id/historial` | Historial radiológico del paciente     |
| `/auditoria`               | Auditoría RIS                          |

---

## 14. Flujo de integración HIS - LIS

1. El médico ingresa al HIS.
2. Crea una orden diagnóstica de laboratorio.
3. HIS guarda la orden en `ordenes_diagnosticas`.
4. HIS envía la orden al LIS por API REST.
5. LIS crea su propia orden en `ordenes_laboratorio`.
6. LIS genera muestras y códigos de muestra.
7. LIS registra resultados.
8. Bacteriólogo valida.
9. LIS envía el resultado validado al HIS.
10. HIS guarda el resultado en `resultados_diagnosticos`.
11. HIS muestra el resultado en la historia clínica.

---

## 15. Flujo de integración HIS - RIS

1. El médico ingresa al HIS.
2. Crea una orden diagnóstica de radiología.
3. HIS guarda la orden en `ordenes_diagnosticas`.
4. HIS envía la orden al RIS por API REST.
5. RIS crea la orden radiológica y el estudio.
6. El estudio entra como admitido.
7. El tecnólogo ejecuta el estudio.
8. RIS consulta o vincula imágenes desde Orthanc.
9. El médico/radiólogo crea el informe.
10. El médico/radiólogo valida el informe.
11. RIS envía el informe definitivo al HIS.
12. HIS guarda el informe en `resultados_diagnosticos`.
13. HIS muestra el informe en la historia clínica.

---

## 16. Flujo RIS de estados

El flujo radiológico maneja los siguientes estados:

| Código | Estado                              |
| ------ | ----------------------------------- |
| `A`    | Admitido                            |
| `I`    | Imágenes disponibles                |
| `E`    | Ejecutado por tecnólogo             |
| `IG`   | Informe guardado                    |
| `D`    | Definitivo firmado y enviado al HIS |

Nota: se recomienda usar `IG` para “Informe guardado”, porque ya existe `I` para “Imágenes disponibles”. Así se evita ambigüedad en base de datos y código.

---

## 17. Orthanc / PACS

Orthanc es una aplicación externa. No viene incluida dentro del proyecto SIGSALUD.

Debe instalarse por separado en el equipo que actuará como servidor PACS.

Para pruebas locales, el RIS espera Orthanc en:

```txt
http://localhost:8043
```

El RIS realiza búsquedas en Orthanc usando:

```txt
POST http://localhost:8043/tools/find
```

Variables relacionadas:

```env
ORTHANC_URL=http://localhost:8043
ORTHANC_VIEWER_BASE=http://localhost:8043
ORTHANC_USERNAME=
ORTHANC_PASSWORD=
```

Si Orthanc tiene usuario y contraseña, configura `ORTHANC_USERNAME` y `ORTHANC_PASSWORD`.

Si Orthanc está sin autenticación, deja esos campos vacíos.

---

## 18. Permisos importantes

El sistema separa permisos por módulo.

Ejemplos:

| Permiso                | Uso                               |
| ---------------------- | --------------------------------- |
| `HIS_ACCESS`           | Ingresar al HIS                   |
| `HIS_RESULTS`          | Ver resultados en HIS             |
| `HIS_VIEW_LIS_RESULTS` | Ver resultados LIS dentro del HIS |
| `HIS_VIEW_RIS_RESULTS` | Ver informes RIS dentro del HIS   |
| `LIS_ACCESS`           | Ingresar al LIS                   |
| `LIS_VALIDATE`         | Validar resultados de laboratorio |
| `RIS_ACCESS`           | Ingresar al RIS                   |
| `RIS_EXECUTION`        | Ejecutar estudios como tecnólogo  |
| `RIS_REPORTS`          | Crear informes radiológicos       |
| `RIS_VALIDATE`         | Validar informes radiológicos     |

Importante:

Para ver resultados de LIS o RIS dentro del HIS no se debe exigir `LIS_ACCESS` ni `RIS_ACCESS`.

El HIS debe usar:

```txt
HIS_VIEW_LIS_RESULTS
HIS_VIEW_RIS_RESULTS
```

---

## 19. Recomendaciones para pruebas

Se recomienda probar en este orden:

1. Iniciar sesión como `admin@sigsalud.com`.
2. Verificar acceso a HIS, LIS y RIS.
3. Iniciar sesión como `medico@sigsalud.com`.
4. Crear o consultar una orden desde HIS.
5. Revisar resultados en `/resultados`.
6. Iniciar sesión como `bacteriologo@sigsalud.com`.
7. Validar una muestra en LIS.
8. Verificar que se envíe al HIS.
9. Iniciar sesión como `medico.radiologia@sigsalud.com`.
10. Crear o validar informe RIS.
11. Verificar que el informe aparezca en HIS.

---

## 20. Errores comunes

### Error: `Cannot GET /ruta`

Puede indicar que:

- La ruta no existe en el módulo.
- No se está ejecutando el servidor correcto.
- No se aplicó el parche SQL correspondiente.
- La vista EJS no existe o no está enlazada.

### Error: permiso denegado

Después de modificar permisos en base de datos, debes cerrar sesión y volver a iniciar sesión.

El JWT guarda los permisos al momento del login.

### Error de conexión a PostgreSQL

Verifica:

- Nombre de la base.
- Usuario.
- Contraseña.
- Puerto.
- Que el servicio PostgreSQL esté iniciado.

### Error de Orthanc

Verifica que Orthanc esté activo:

```txt
http://localhost:8043
```

---

## 21. Nota de seguridad

Esta versión es beta y demostrativa.

Antes de usar en un entorno real se requiere:

- Cifrado de datos sensibles.
- Gestión robusta de contraseñas.
- HTTPS.
- Hardening de APIs internas.
- Validación estricta de formularios.
- Logs centralizados.
- Auditoría normativa.
- Control de sesiones.
- Backups automáticos.
- Pruebas de carga.
- Pruebas de seguridad.
- Revisión normativa para datos clínicos.
