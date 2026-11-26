# 0002. Acceso a SQLite: SQL a mano tras un puerto propio

- **Estado:** Aceptado
- **Fecha:** 2026-11-26

## Contexto
[`almacen-local`](../../spec/SPEC-almacen-local.md) exige: una base con versión de esquema y migraciones ordenadas al abrir; una migración que falla se deshace y deja la base en N−1 (test); utilidad de transacción; cada módulo define sus tablas en su `data/`. La estrategia de tests de SPEC.md pide **repositorios contra SQLite en tests** (Jest en Node, fuera del móvil). La web (V2) no debe quedar cerrada. El esquema es pequeño: unas 8-10 tablas, ≤ 300 prendas.

## Opciones consideradas
### A) SQL a mano sobre `expo-sqlite`, detrás de un puerto `SqlDatabase`
- Pros: 0 dependencias nuevas. Migraciones con `PRAGMA user_version`, el patrón que muestra la propia doc de expo-sqlite. En tests, el mismo SQL corre sobre `node:sqlite`, que viene con Node ≥ 22.13 sin flag. `expo-sqlite` funciona en web (wasm + COOP/COEP). Se aprende SQL de verdad (valor DAW).
- Contras: tipos de las filas escritos a mano (se mitiga con un `mapRow` por tabla y tests de repositorio); más código repetido.
### B) Drizzle ORM con su driver `expo-sqlite`
- Pros: esquema en TypeScript con tipos inferidos; `drizzle-kit generate` crea las migraciones; `useLiveQuery` reactivo (usa el *change listener* de expo-sqlite); la doc de Expo lo menciona.
- Contras: la guía oficial instala `drizzle-orm@rc` y `expo-sqlite@next`, o sea, una versión candidata, no estable. Migraciones con `useMigrations` (un *hook* de React, mal encaje con «domain/data sin React»), y exige `babel-plugin-inline-import` y `.sql` en Metro. La guía no habla de web. Para Jest habría que usar otro driver (p. ej. better-sqlite3) con el mismo esquema: **SIN VERIFICAR** que se comporte igual.
### C) Otro ORM o *query builder* (Kysely, TypeORM…)
- No evaluados a fondo: no hay guía oficial de Expo para ellos y añaden lo mismo que B sin el respaldo de la doc de Expo. **SIN VERIFICAR.**

## Decisión
**A) SQL a mano.** `storage` expone un puerto mínimo, el único que ven los demás módulos:
```ts
interface SqlDatabase {
  run(sql: string, params?: SqlParam[]): Promise<{ changes: number; lastInsertRowId: number }>;
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
}
inTransaction<T>(fn: (db: SqlDatabase) => Promise<T>): Promise<T>;
```
Dos adaptadores: `expo-sqlite` (app) y `node:sqlite` (tests). Las migraciones son una lista global numerada (`{ version, module, up(db) }`) que cada módulo aporta con `registerMigrations()`. El *runner* aplica cada una en su transacción y sube `user_version` dentro de ella. Con un esquema tan pequeño, B añade más configuración y riesgo (versión RC) que lo que ahorra.

## Consecuencias
- Los tests de repositorio y de migración (N−1 → N, fallo → sigue en N−1) corren en Node sin emulador.
- `inTransaction` usa `withTransactionAsync`, que **no es exclusivo** según la doc: otra consulta asíncrona puede colarse dentro. Por eso `storage` serializa las escrituras con una cola (*mutex*). No se usa `withExclusiveTransactionAsync`: abre otra conexión (pierde `PRAGMA foreign_keys = ON`) y no existe en web.
- **Riesgo principal:** el SQLite de `node:sqlite` y el de `expo-sqlite` son versiones distintas. Un SQL que pase en Node podría fallar en el móvil. Mitigación: solo SQL estándar (nada de extensiones), el E2E de [0005](0005-e2e-maestro.md) ejecuta las migraciones reales y se anota `SELECT sqlite_version()` de ambos.
- **SIN VERIFICAR (spike de 1 h):** que Jest 30 con `jest-expo` resuelva `node:sqlite` (es un módulo solo con prefijo `node:`, en estado *experimental*/*release candidate*). Plan B: `sql.js` (SQLite en wasm, sin compilar en Windows), que sería una dependencia de desarrollo nueva y se pediría al dueño.
- Dos ramas pueden reclamar el mismo número de migración. Un test comprueba que las versiones registradas son únicas y consecutivas; el conflicto se resuelve al integrar, renumerando la de la rama que llega después.
- Si en V2 el esquema crece mucho, se puede pasar a Drizzle estable con un ADR que sustituya a este.

## Fuentes (leídas el 2026-11-26)
- https://docs.expo.dev/versions/latest/sdk/sqlite/ (`PRAGMA user_version`, `withTransactionAsync` no exclusivo, `withExclusiveTransactionAsync` sin web y sin las PRAGMA, configuración web, mención de Drizzle)
- https://orm.drizzle.team/docs/connect-expo-sqlite (`drizzle-orm@rc`, `driver: 'expo'`, `useMigrations`, `babel-plugin-inline-import`, `useLiveQuery`)
- https://nodejs.org/api/sqlite.html (sin flag desde v22.13.0; *release candidate* desde v25.7.0; `prepare().run/all/get`)
- https://docs.expo.dev/develop/unit-testing/ (Jest 30 con `jest-expo` en SDK 58)
