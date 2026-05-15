# ENTREGABLE 3: Comparación Spec vs Implementación

## 1. Tabla Comparativa de Gaps (Brechas)
| Elemento | Especificación esperada | Implementación real | Gap identificado |
| :--- | :--- | :--- | :--- |
| **Arquitectura** | Monolito o sistema simple | Microservicios distribuidos | Exceso de complejidad para un proyecto académico de este nivel. |
| **Base de Datos** | Relacional (PostgreSQL) | PostgreSQL con librería pg | Falta de scripts de migración; configuración manual requerida. |
| **Autenticación** | Seguridad por sesiones | JWT (JSON Web Tokens) | No explica cómo renovar tokens o su tiempo de expiración. |
| **Frontend** | Interfaz reactiva | SSR con EJS y Bootstrap | Mezcla de lógica de negocio y presentación. |
| **API** | RESTful documentada | Endpoints en Express | Falta documentación formal (Swagger/Postman). |

## 2. Tabla de Deuda Técnica
| Problema | Descripción | Impacto | Severidad |
| :--- | :--- | :--- | :--- |
| **Error de conexión BD** | El código falla si la clave de Postgres no es exacta (28P01). | El sistema no inicia. | Alta |
| **Hardcoding de URLs** | Las URLs de los servicios están fijas en el código. | Dificulta el despliegue en la nube o en otras PCs. | Media |
| **Falta de .env.example** | No hay guía de qué variables de entorno se necesitan. | El desarrollador debe "adivinar" la configuración. | Alta |