# ADR-001: Adopción de Spec-Driven Development para la Auditoría de SIGSALUD

## Estado
Aceptado

## Contexto
El proyecto SIGSALUD carece de una documentación técnica centralizada que permita a nuevos desarrolladores desplegar el sistema de forma autónoma. Se requiere un marco de trabajo que priorice la especificación antes que la ejecución para identificar fallos de trazabilidad.

## Decisión
Hemos decidido aplicar la metodología **Spec-Driven Development (SDD)**. Esto implica que la validación del sistema no se basa en si el código "corre", sino en si el código cumple con lo definido en la especificación inicial (Manual Técnico y Requerimientos).

## Consecuencias
* Positivo: Identificación temprana de la falta de un archivo `.env.example`.
* positivo: Detección de la brecha entre el Frontend prometido (React) y el implementado (EJS).
* Negativo: El proceso de auditoría es más lento ya que requiere contrastar cada línea de código con el documento de arquitectura.