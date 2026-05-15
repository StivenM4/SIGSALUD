# ADR-002: Estrategia de Mitigación de Brechas de Arquitectura

## Estado
Aceptado

## Contexto
Durante la auditoría, se encontraron 5 brechas críticas, destacando la complejidad de los microservicios distribuidos sin una orquestación formal (como Docker) y el uso de puertos fijos que causan colisiones.

## Decisión
Se decide documentar formalmente cada brecha (Gap) categorizándola por impacto y severidad. En lugar de refactorizar el código ajeno, la decisión es **documentar la Deuda Técnica** para alertar sobre la inestabilidad del sistema en el despliegue manual.

## Consecuencias
* Positivo: Se proporciona una hoja de ruta clara para el equipo autor sobre qué corregir (ej. implementar Swagger).
* Positivo: Se evita el crash del sistema al identificar que el error `28P01` de PostgreSQL es una brecha de documentación de credenciales.