# 0003. Estado y datos reactivos: repositorios con caché + `useSyncExternalStore`

- **Estado:** Aceptado
- **Fecha:** 2026-11-26

## Contexto
Criterio de éxito 1: con 60 prendas y la app ya en memoria, los 3 outfits se ven en **< 1 s** (en frío, < 2,5 s). El motor tarda < 100 ms con 300 prendas. La UI debe enterarse de los cambios: confirmar un outfit mueve prendas al cesto, «lavado» las vuelve limpias, la agenda cambia el plan de hoy. Todo es local: no hay servidor ni datos remotos (salvo el clima). Datos pequeños: ≤ 300 prendas, una semana tipo y una previsión.

## Opciones consideradas
### A) Hooks propios: cada repositorio guarda una caché en memoria y la expone con `useSyncExternalStore`
- Pros: 0 dependencias; API oficial de React para «suscribir un componente a un almacén externo». Lectura síncrona desde memoria, así que la pantalla Hoy no espera a SQLite al volver a primer plano. El repositorio es lógica normal y se prueba en Node.
- Contras: hay que escribir bien la suscripción (snapshot inmutable y `subscribe` estable, o hay bucles infinitos según la doc). Sin *devtools*.
### B) Zustand
- Pros: muy pequeño, MIT, selectores, patrón conocido.
- Contras: dependencia nueva; duplicaría lo que ya hace el repositorio (habría dos fuentes de verdad: el *store* y SQLite). Compatibilidad con React 19.3 / RN 0.88 **SIN VERIFICAR** (su web de documentación dio 404 y el README no lo dice).
### C) TanStack Query
- Pros: caché, invalidación y estados de carga hechos; «designed to work out of the box with React Native».
- Contras: está pensado para datos asíncronos remotos (sus ejemplos usan `fetch`, *refetch* al recuperar foco o red). Aquí no hay servidor: añade conceptos (claves, *stale time*, `onlineManager`) que no se necesitan. Solo encajaría para el clima, y ese caso ya lo cubre la caché de `weather`.

## Decisión
**A) Hooks propios.** Patrón único para todos los módulos:
- El repositorio (`data/`) carga sus filas una vez, guarda un **snapshot inmutable** y expone `subscribe(listener)` y `getSnapshot()`.
- Toda escritura pasa por el repositorio: SQL → nuevo snapshot → aviso a los suscriptores. No se usa `addDatabaseChangeListener` (sí existe, incluso en web) para que el aviso sea explícito, ordenado y fácil de probar sin SQLite nativo.
- Cada módulo publica hooks en su `index.ts` (`useGarments()`, `useLaundryBasket()`…) hechos con `useSyncExternalStore`.
- El estado efímero de pantalla (outfits propuestos, candados) vive en `useReducer` dentro de `today`.
- Las operaciones que cruzan módulos (`confirmOutfit`) se hacen en una sola `inTransaction` y se publican los snapshots **después** del *commit*.

Es la opción más simple que cumple: los outfits salen de datos ya en memoria (motor < 100 ms), sin esperar a la base.

## Consecuencias
- Arranque en frío: se cargan prendas, cesto, agenda y último clima en paralelo antes de pintar Hoy. Con ≤ 300 filas debería caber en el presupuesto de 2,5 s. **SIN VERIFICAR**: se mide en el Redmi Note 15 Pro 5G en el primer hito.
- **Riesgo principal:** que la caché y SQLite se desincronicen (una escritura que falla a mitad pero ya avisó). Mitigación: el snapshot nuevo solo se publica tras el *commit*, y un test de repositorio fuerza un fallo y comprueba que el snapshot no cambia.
- Segundo riesgo: selectores que devuelven objetos nuevos en cada render (bucle infinito). Mitigación: un helper común `createStore<T>()` en `storage` (lo usan todos los repositorios) con test, en vez de que cada módulo lo reescriba.
- Si aparece mucha lógica repetida o hacen falta *devtools*, se reevalúa B con un ADR nuevo.

## Fuentes (leídas el 2026-11-26)
- https://react.dev/reference/react/useSyncExternalStore (firma; «repeated calls to `getSnapshot` must return the same value»; `subscribe` estable)
- https://tanstack.com/query/latest/docs/framework/react/react-native
- https://github.com/pmndrs/zustand (MIT; sin datos de versión de React)
- https://docs.expo.dev/versions/latest/sdk/sqlite/ (`addDatabaseChangeListener`, `enableChangeListener`, también en web)
