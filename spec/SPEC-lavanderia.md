# Spec de módulo: `lavanderia` — V1

Depende de: `armario`, `almacen-local` (sus tablas), `app-base` (pantalla Cesto) · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
No volver a perder la cuenta: saber en todo momento qué está limpio, qué está en el cesto y qué toca lavar.

## Requisitos
- Cada prenda tiene `usosTotales`, `usosDesdeLavado`, `ultimoUso` y `estado` (`limpia` o `en-cesto`).
- **Umbral de usos** antes de lavar: valor por defecto según el tipo, editable por tipo en Ajustes y por prenda en su ficha.
  - Valores de partida: camiseta 1, camisa 1, polo 1, jersey 3, sudadera 3, vaquero 5, pantalón 3, falda 3, abrigo 10, chaqueta 6.
  - El **calzado** no va al cesto: solo cuenta usos.
- **Registrar uso** (lo llama `manana` al confirmar): `usos + 1`. Si `usosDesdeLavado ≥ umbral`, la prenda pasa a `en-cesto`.
- **Deshacer** el último registro del día: restaura exactamente el estado anterior.
- **Manual:** «al cesto ya» y «sigue limpia» desde la ficha o el cesto.
- **Pantalla Cesto:** prendas sucias agrupadas en **Normal** y **Delicada (lavar aparte o a mano)**.
  - Selección múltiple y «Lavado» → `limpia` y `usosDesdeLavado = 0`.
  - Insignia con el número de prendas en la pestaña.
- **Historial de usos** (fecha y prendas) para `motor-outfits` y futuras estadísticas.

## Interfaz pública
`estadoLavado(prendaId)`, `prendasLimpias()`, `registrarUsos(prendas, fecha) → idRegistro`, `deshacerRegistro(id)`, `marcarLavadas(ids)`, `historialUsos(desde)`, `umbralDe(prenda)` y la pantalla Cesto.

## Criterios de aceptación
- Tests de dominio: umbral alcanzado → cesto; calzado nunca al cesto; deshacer restaura el estado exacto; lavar pone a 0.
- Registrar los usos de un outfit es atómico: todas las prendas o ninguna (transacción).
- Cambiar un umbral no mueve prendas de estado de golpe. Se aplica en el siguiente uso, y se avisa si alguna ya lo supera.

## Fuera de alcance
Planificar lavadoras, tipos de lavado y avisos de «toca poner lavadora».
