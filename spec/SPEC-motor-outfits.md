# Spec de módulo: `motor-outfits` — V1

Depende de: `armario`, `lavanderia`, `clima`, `agenda` (solo sus tipos) · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
El corazón de la app: elegir 3 outfits buenos, distintos y explicados. Es **lógica pura en TypeScript** (sin React, sin Expo, sin red), determinista con una semilla, y reutilizable el día que llegue la web.

## Entrada y salida
```ts
generarOutfits(entrada: {
  prendasLimpias: Prenda[];             // ya filtradas por lavanderia
  resumenClima: ResumenFranja | SinDatos;
  plan: PlanDelDia;
  historial: UsoReciente[];             // últimos 14 días
  bloqueadas: PrendaId[];               // candados
  yaMostrados: FirmaOutfit[];           // para no repetir al regenerar
  fecha: Date; semilla: number;
}): { outfits: Outfit[]; avisos: Aviso[] }  // Outfit = prendas + puntuación + explicación
```

## Reglas V1
1. **Composición:** superior + inferior, o pieza única, + calzado. Se añade **abrigo** si la sensación mínima de la franja es < 16 °C o la probabilidad de lluvia es ≥ 50 %. El umbral es configurable y está en los tests.
2. **Abrigo térmico:** el nivel total de abrigo del outfit debe encajar con la sensación de la franja. La tabla de temperatura a nivel se fija en el plan y se puede ajustar.
3. **Formalidad:** todas las prendas compatibles con la formalidad del plan (se admite un escalón de diferencia como máximo).
4. **Color:** como mucho un color saturado dominante; los neutros combinan con todo. Hay una lista de choques que se evitan y una de combinaciones que puntúan.
5. **Lluvia:** se penalizan las prendas delicadas y se avisa.
6. **Variedad:** se penalizan las prendas usadas en los últimos 3 días. Los 3 outfits no comparten más de 1 prenda no bloqueada.
7. **Candado:** las prendas bloqueadas aparecen en los 3 outfits. Regenerar cambia solo las demás y no repite una firma ya mostrada.
8. **Explicación** por plantillas, 1–2 frases con la razón principal. Por ejemplo: «Abrigo fino: a las 19:00 la sensación baja a 11 °C» o «Tonos neutros para la clase; los vaqueros llevan 2 días de descanso».
9. **Escasez:** si no hay combinaciones válidas, se relajan las reglas en este orden: variedad → color → formalidad. Se avisa de qué se ha relajado. Nunca se relaja «solo prendas limpias».
10. **Sin clima:** se usa la temperatura típica de la estación y del mes, con aviso.

## Criterios de aceptación
- **Test con propiedades** (entradas aleatorias): ninguna salida contiene prendas que no estén en `prendasLimpias`; las bloqueadas están siempre presentes; la composición es siempre válida.
- Determinista: la misma entrada y la misma semilla dan la misma salida.
- Rendimiento: 300 prendas → 3 outfits en < 100 ms (test).
- Tests por regla con casos concretos, incluido cada paso de la escasez.
- Ningún import de React, Expo ni red en el módulo (regla de lint).

## Fuera de alcance
Aprender de valoraciones (`valoraciones`), reglas personales (`reglas-estilo`) y accesorios.
