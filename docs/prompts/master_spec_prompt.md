# Master Spec Prompt - Auditoría SIGSALUD

## Prompt Principal
> "Actúa como arquitecto senior de software. Analiza este repositorio de SIGSALUD basándote en su estructura de carpetas, dependencias (package.json) y archivos de configuración. Identifica la arquitectura del sistema, las tecnologías clave utilizadas y detecta posibles puntos de falla o brechas (gaps) entre lo que la estructura del código implementa y lo que se esperaría de un sistema hospitalario interoperable."

## Propósito
El objetivo de este prompt fue obtener una visión panorámica y técnica del proyecto sin sesgos, permitiendo realizar ingeniería inversa sobre la arquitectura de microservicios para evaluar su viabilidad técnica.

## Alcance de la Revisión
* Análisis de la jerarquía de servicios (Auth, HIS, LIS, RIS).
* Identificación de dependencias críticas de Node.js.
* Evaluación de la estrategia de comunicación entre módulos.