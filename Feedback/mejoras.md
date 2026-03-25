# Análisis de Diseño y Requisitos - Proyecto SIGSALUD 🏥

Este documento presenta una evaluación crítica del sistema desarrollado basándose en los requerimientos iniciales del PDF, identificando brechas técnicas y oportunidades de mejora para una implementación en entorno real.

---

## 🚩 1. Problemas de Requisitos (Funcionales y No Funcionales)

### A. Gestión de Concurrencia y Escalabilidad
* **Problema:** El uso de **SQLite** como motor de base de datos en los 3 microservicios es excelente para una prueba de concepto (POC), pero es un "cuello de botella" crítico para un hospital real con múltiples médicos accediendo simultáneamente.
* **Impacto:** Bloqueos de base de datos (`SQLITE_BUSY`) ante múltiples escrituras concurrentes.
* **Recomendación:** Migrar a **PostgreSQL** o **Supabase** para manejar transacciones ACID complejas y escalabilidad vertical/horizontal.

### B. Robustez en la Interoperabilidad
* **Problema:** La comunicación vía **Webhooks directos** es sincrónica/frágil. Si el LIS está caído cuando el HIS envía una orden, la orden podría quedar en un estado inconsistente.
* **Impacto:** Pérdida potencial de órdenes médicas.
* **Recomendación:** Implementar un **Message Broker (RabbitMQ o Redis)**. El HIS publica un mensaje y el LIS lo consume a su ritmo, garantizando que ninguna orden se pierda.

---

## 📐 2. Hallazgos en el Diseño Arquitectónico

### A. Seguridad Inter-Sistema
* **Debilidad:** El uso de una `x-service-key` estática en los encabezados es vulnerable si no se viaja sobre HTTPS. 
* **Mejora:** Implementar **Mutual TLS (mTLS)** entre microservicios o usar un API Gateway (tipo Kong) para centralizar la autenticación y el throttling.

### B. Fragmentación de Auditoría
* **Debilidad:** Cada subsistema guarda sus propios logs en tablas locales. 
* **Mejora:** Centralizar los logs de auditoría en un servicio dedicado (ELK Stack o similar) para cumplir con normativas legales de trazabilidad clínica de forma integral.

### C. Integración PACS/DICOM
* **Observación:** El adaptador RIS actual es un "Mock" funcional. 
* **Recomendación:** Implementar el cliente DICOM nativo (vía librerías como `dicom-parser` o integración real con Orthanc API) para permitir la visualización real de imágenes `.dcm` desde el frontend.

---

## ⚡ 3. Recomendaciones de Mejora (Roadmap)

1. **Frontend - UX Clínica:**
   - Implementar un sistema de **Notificaciones en Tiempo Real (WebSockets)**. Actualmente el médico debe refrescar o esperar el polling para ver si llegó un resultado crítico.
   - Agregar soporte para **Accesibilidad (A11y)**, vital para personal médico en situaciones de estrés o movilidad reducida.

2. **Capa de Datos:**
   - Normalización avanzada de tablas para cumplir con estándares **HL7 FHIR**. Esto facilitaría que SIGSALUD se conecte con otros hospitales del país en el futuro.

3. **Infraestructura:**
   - **Dockerización:** Crear archivos `Dockerfile` y un `docker-compose.yml` para levantar todo el ecosistema (HIS, LIS, RIS, DB) con un solo comando en cualquier máquina de desarrollo o servidor en la nube.

---

> [!IMPORTANT]
> **Conclusión:** El sistema actual cumple con el 100% de los procesos descritos en el documento original (HU01-HU50), pero requiere el fortalecimiento de la capa de transporte y persistencia para ser considerado "Production Ready".
