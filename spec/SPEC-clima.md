# Spec de módulo: `clima` — V1

Depende de: `almacen-local` · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
Saber qué tiempo hará **en las horas que vas a pasar fuera**, no solo «hoy».

## Requisitos
- **Ubicación:** GPS en primer plano (expo-location, `requestForegroundPermissionsAsync`). Sin permiso, se usa una ciudad elegida a mano (búsqueda de ciudad: **SIN VERIFICAR**, candidata la API de geocodificación de Open-Meteo).
- **Previsión horaria** de Open-Meteo (sin clave): `temperature_2m`, `apparent_temperature`, `precipitation_probability`, `wind_speed_10m`, en la zona horaria local.
- **Resumen de franja** (lógica pura): dada una franja horaria, calcula sensación mínima y máxima, probabilidad máxima de lluvia, viento máximo y un aviso de cambio (por ejemplo, «baja 8 °C por la tarde»).
- **Caché:** se guarda la última previsión con su fecha. Hay que refrescar si tiene más de 3 h y hay red.
  - Sin red, se usa la caché si es de menos de 24 h.
  - Si no, se devuelve «sin datos» y `motor-outfits` decide según la estación, con aviso.
- La **atribución** «Weather data by Open-Meteo.com» (con enlace) aparece junto a los datos de clima, como exige CC BY 4.0.
- Solo se envían las coordenadas, redondeadas a 2 decimales.

## Interfaz pública
`obtenerPrevision() → Prevision | SinDatos`, `resumenFranja(prevision, franja) → ResumenFranja` (pura).

## Criterios de aceptación
- Tests de `resumenFranja` con previsiones de prueba: franja que cruza el mediodía, lluvia solo por la tarde, franja fuera del rango de la previsión.
- Test de caché: sin red y caché de 2 h → la usa; sin red y caché de 30 h → «sin datos».
- No se hacen más de unas pocas llamadas al día por uso normal (muy por debajo del límite de 10 000 de Open-Meteo).

## Fuera de alcance
Alertas meteorológicas, índice UV y previsión de varios días para viajes (eso será `maleta`).
