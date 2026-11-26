# Spec de módulo: `agenda` — V1

Depende de: `almacen-local`, `app-base` · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
Que la app sepa qué haces hoy y cuántas horas vas a estar fuera, sin tener que decírselo cada mañana.

## Requisitos
- **Tipos de plan** predefinidos, cada uno con su formalidad y franja por defecto, todo editable:
  - Clase: informal, 8:00–15:00.
  - Trabajo: arreglado, 9:00–18:00.
  - Quedada: informal, 18:00–23:00.
  - Deporte: deportivo, 1 h.
  - Evento formal: formal.
  - Casa: no hace falta outfit, se ofrece «ropa cómoda».
- Se pueden **añadir tipos propios** (nombre, icono, formalidad y franja).
- **Semana tipo:** a cada día de la semana se le asigna un plan, o ninguno. Se configura en el primer arranque (asistente de menos de 1 min) y en Ajustes.
- **Plan de hoy:** sale de la semana tipo, y se puede cambiar el plan o la franja con un toque, solo para hoy (hoja inferior).
- V1 maneja **un plan por día**. Varios planes en un mismo día quedan para la V2.

## Interfaz pública
`planDeHoy(fecha) → PlanDelDia { tipo, formalidad, franja }`, `cambiarPlanDeHoy(...)`, `semanaTipo`, y la hoja inferior «Plan de hoy» para `manana`.

## Criterios de aceptación
- Test: un cambio para hoy no altera la semana tipo, y mañana vuelve al valor de la semana tipo.
- Test: franjas que cruzan la medianoche (quedada de 22:00 a 2:00).
- Asistente inicial completable en < 60 s.

## Fuera de alcance
Calendario de Google (`calendario`, V2) y varios planes por día.
