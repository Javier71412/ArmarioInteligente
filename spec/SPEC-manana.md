# Spec de módulo: `manana` — V1

Depende de: `motor-outfits`, `lavanderia`, `agenda`, `clima`, `app-base` · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
La pantalla **Hoy**: en menos de un minuto, saber qué ponerte y dejarlo apuntado.

## Requisitos
- **Cabecera:** fecha, plan de hoy (chip; un toque abre la hoja «Plan de hoy») y resumen del clima de la franja (por ejemplo, «12–19 °C · lluvia 60 % a las 17:00»), con la atribución de Open-Meteo.
- **3 tarjetas de outfit** con las fotos de sus prendas compuestas y la explicación. El paso de una a otra se hace con gesto fluido.
- **Candado:** tocar una prenda la fija o la suelta, con háptica y una animación breve. El candado se ve en los 3 outfits.
- **Regenerar:** cambia las prendas no bloqueadas. La animación se puede interrumpir y no bloquea otra regeneración.
- **Confirmar («Me lo pongo»):** 1 toque → `lavanderia.registrarUsos`. Las prendas que van al cesto hacen una animación hacia la pestaña Cesto, y aparece un toast con «Deshacer».
- **Si ya hay un outfit confirmado hoy**, se muestra ese outfit con «Cambiar», que deshace y vuelve a proponer.
- **Plan Casa:** propuesta de «ropa cómoda», o se puede omitir.
- **Estados especiales:**
  - Pocas prendas: estado vacío que guía al alta.
  - Sin clima: aviso y propuesta según la estación.
  - Avisos del motor visibles («solo te quedan 2 pantalones limpios»).
- **Recordatorio diario** local (expo-notifications, disparador diario, sin servidor):
  - Por defecto, 30 min antes del inicio de la franja del plan de hoy; los días sin plan, a la hora fija configurada.
  - Texto con el resumen: «Hoy: Clase · 12–19 °C, lluvia por la tarde». Al tocarlo se abre Hoy.
  - Se activa en Ajustes, con su canal de Android y el permiso en Android 13+. Se reprograma al cambiar la semana tipo o el plan de hoy.
  - Riesgo: el ahorro de batería de HyperOS (SPEC.md › Riesgos).
- Al abrir, se muestra al instante lo último calculado y se recalcula en segundo plano si cambian el clima o los datos.

## Criterios de aceptación
- Outfits visibles en < 1 s con la app ya en memoria y < 2,5 s en arranque en frío (SPEC.md, criterio 1).
- Confirmar en ≤ 2 toques desde que se ve el outfit.
- Test de componente: confirmar → se llama a `registrarUsos` con las prendas exactas; Deshacer → `deshacerRegistro`.
- Las animaciones de regenerar, candado y confirmar van a 60 fps en el móvil de referencia (Redmi Note 15 Pro 5G) (comprobación manual en la demo del hito).
- Test: cambiar el plan de hoy reprograma el recordatorio; si está desactivado, no se programa nada.
- Todo se puede hacer con lector de pantalla (etiquetas en tarjetas, candados y botones).

## Fuera de alcance
Valorar outfits, compartir el outfit como imagen y widget de pantalla de inicio.
