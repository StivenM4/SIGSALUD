# SIGSALUD - Plataforma Hospitalaria

Plataforma integrada para la gestión hospitalaria que incluye sistemas de información para HIS, RIS y LIS, junto con integración de PACS mediante Orthanc.

## Requisitos

Para ejecutar este proyecto, asegúrate de tener instalado:

- **Node.js** (versión 16 o superior recomendada)
- **Docker** y **Docker Compose** (para el servidor de imágenes PACS - Orthanc)
- **Base de Datos:** El sistema utiliza PostgreSQL (pg) y SQLite3 según el módulo.

## Instalación

1.  Clona el repositorio y navega a la carpeta del proyecto:
    ```bash
    cd SIGSALUD
    ```

2.  Instala las dependencias de Node.js:
    ```bash
    npm install
    ```

3.  Configura las variables de entorno:
    - Crea un archivo `.env` en la raíz de `SIGSALUD/` siguiendo los ejemplos necesarios para la conexión a la base de datos y JWT.

## Ejecución de Infraestructura (PACS)

Para levantar el servidor Orthanc (PACS), utiliza Docker Compose:

```bash
docker-compose up -d
```
- **Interfaz Web (Orthanc):** http://localhost:8042
- **DICOM Port:** 4242

## Ejecución del Sistema

El proyecto está dividido en tres módulos principales. Puedes ejecutarlos de forma independiente:

### HIS (Hospital Information System)
```bash
npm run start:his  # Producción
npm run dev:his    # Desarrollo (Nodemon)
```

### RIS (Radiology Information System)
```bash
npm run start:ris  # Producción
npm run dev:ris    # Desarrollo (Nodemon)
```

### LIS (Laboratory Information System)
```bash
npm run start:lis  # Producción
npm run dev:lis    # Desarrollo (Nodemon)
```

## Estructura del Proyecto

- `src/his`: Lógica y servidor del Sistema de Información Hospitalaria.
- `src/ris`: Lógica y servidor del Sistema de Información de Radiología.
- `src/lis`: Lógica y servidor del Sistema de Información de Laboratorio.
- `docs/`: Documentación técnica y guías del proyecto.
- `docker-compose.yml`: Configuración del servidor PACS Orthanc.
