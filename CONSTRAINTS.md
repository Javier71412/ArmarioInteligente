# Listón de calidad (CONSTRAINTS.md)

Última revisión: 2026-11-26, aprobado por el dueño (Javier71412).

Este archivo es un **contrato**: define qué significa «suficientemente bueno para fusionar». Lo leen todos los agentes antes de escribir código.
**No se rebaja para que un cambio pase.** Si una regla estorba, se arregla el código o se pide una excepción (tabla del final).

Nivel actual: **escrito** (aún no hay código). Montar cada comprobación es una tarea del hito 0 del plan, y una fila solo cuenta como «aplicada» cuando su comando **falla** con una violación hecha a propósito, **pasa** con un caso limpio y **falla** si el propio escáner da error.

---

## 0. Suelo (siempre activo, bloquea)

| Prohibido | Comprobado por |
|---|---|
| `@ts-ignore`, `@ts-nocheck`; `@ts-expect-error` sin explicación | ESLint `@typescript-eslint/ban-ts-comment` |
| `any` explícito | ESLint `@typescript-eslint/no-explicit-any` |
| Comentarios `eslint-disable…` (las excepciones van en el config con fila en Excepciones) | ESLint `linterOptions.noInlineConfig: true` |
| `istanbul ignore`, `c8 ignore` | `scripts/floor-guard` |
| `.skip`, `.only`, `xit`, `xdescribe`, `test.todo` | `scripts/floor-guard` |
| Borrar un test o quitar `expect` sin motivo en el mensaje del commit | `scripts/floor-guard` |
| `throw new Error("Not implemented")`, `catch {}` vacío, `TODO` en lugar de la implementación | ESLint `no-empty` + `scripts/floor-guard` |
| Claves en el código (ver §4) | gitleaks + `scripts/floor-guard` |
| Rebajar este archivo en el mismo PR que la función que fallaba | `scripts/floor-guard` (compara con la rama base) |

`scripts/floor-guard` se adapta de la referencia de la skill `constraint-driven-development` (`references/floor-guard.md`): mira solo el *diff*, sin dependencias, sale con `0` (bien), `1` (violación) o `2` (error del propio script).

**Por qué:** cuando un agente se atasca, el camino más barato a verde es apagar el aviso. El suelo cierra ese atajo.

---

## 1. TDD con agentes separados (bloquea)

El agente que escribe los tests **no es** el que escribe el código.

1. **Probador:** a partir de la spec del módulo (y nunca del código), escribe los tests y demuestra que fallan **por el motivo correcto** (falta la función o el comportamiento, no un error de sintaxis). Commit `test(<módulo>): …`.
2. **Desarrollador:** escribe el código mínimo para ponerlos en verde. **No puede modificar, borrar ni saltarse los tests del probador.** Commit `feat(<módulo>): …`.
3. Si el desarrollador cree que un test está mal, **para** y lo informa al coordinador; decide el probador (y el dueño si cambia el comportamiento). Nunca lo «arregla» él.
4. Un **revisor** distinto a los dos revisa el PR.

**Comprobado por:** `scripts/floor-guard` en CI: en un PR, los commits `feat`/`fix` no pueden tocar `**/*.test.ts(x)` ni `**/__tests__/**`; solo los commits `test` (del probador). Las definiciones de agentes en `.claude/agents/` (probador y desarrolladores, con herramientas separadas) son una tarea del plan.

**Por qué:** si el mismo agente escribe el test y el código, puede escribir el test a medida de su código (o de su alucinación). Con dos agentes, el test es una opinión independiente basada en la spec.

---

## 2. Reglas con números

| Dimensión | Regla | Comprobado por | Corre en | Por qué este número |
|---|---|---|---|---|
| Tipos | 0 errores | `npx tsc --noEmit` | edición, check, CI | TypeScript strict ya decidido |
| Lint | 0 errores | `npx expo lint` | edición, check, CI | Config del proyecto |
| Arquitectura | 0 imports prohibidos; archivos trampa dan error | eslint-plugin-boundaries + `no-restricted-imports` ([ADR 0006](docs/adr/0006-fronteras-eslint-boundaries.md)) | check, CI | Fronteras del mapa de capacidades |
| Cobertura de dominio | `src/modules/*/domain/**`: líneas ≥ 90 %, ramas ≥ 85 % | Jest `coverageThreshold` por glob | check, CI | Lógica pura escrita con TDD; 100 % obliga a tests absurdos; ramas algo menos por las guardas defensivas |
| Motor: nunca miente | Ninguna salida con prendas fuera de `cleanGarments`; bloqueadas siempre presentes; composición válida | fast-check, `numRuns: 1000` | check, CI | Principio 2 y criterio de éxito 6 |
| Motor: velocidad (guarda) | 300 prendas, mediana de 20 ejecuciones < 50 ms en Node | test de Jest | check, CI | Margen para Hermes, más lento que Node; los 100 ms reales se miden en el móvil (§3) |
| Lavado | Un test por cada caso límite de `spec/SPEC-lavanderia.md` | Jest | check, CI | La spec es la lista de casos |
| Franja de clima | Casos límite de `spec/SPEC-clima.md`, incluidos los cambios de hora de marzo y octubre | Jest | check, CI | Las franjas horarias fallan justo ahí |
| Migraciones | Cada migración N: test N−1 → N con datos y test de fallo (se queda en N−1); versiones únicas y consecutivas; falla si una migración no tiene fixture | Jest + `node:sqlite` ([ADR 0002](docs/adr/0002-acceso-sqlite-sql-a-mano.md)) | check, CI | Perder datos del armario es el peor fallo posible |
| Contraste | Texto ≥ 4,5:1 (grande ≥ 3:1); iconos y bordes de controles ≥ 3:1; tema claro y oscuro | test sobre los tokens | check, CI | WCAG 2.2 AA 1.4.3 y 1.4.11; criterio 9 |
| Zona táctil | ≥ 48 dp; solo los componentes base importan `Pressable`/`Touchable*` | test de los componentes base + `no-restricted-imports` | check, CI | Criterio 9 (más estricto que los 24 px de WCAG 2.5.8) |
| Etiquetas | Los tests de pantalla localizan controles con `getByRole(…, { name })` o `getByLabelText`; `testID` solo para Maestro | Testing Library RN + `scripts/floor-guard` (prohíbe `getByTestId` fuera de `e2e/`) | check, CI | Si un control no tiene rol y nombre, su test no lo encuentra |
| Claves | 0 hallazgos | `gitleaks dir . --redact --no-banner` | CI | Ver §4 |
| Claves (externo) | Push bloqueado si hay secreto | GitHub secret scanning + push protection | cada push | Opinión externa, gratis en repo público |
| Dependencias | Nada alto o crítico en lo que va al APK | `npm audit --omit=dev --audit-level=high` | CI | Por debajo de «alto» casi todo es ruido |

**Presupuesto de `npm run check`:** ≤ 90 s. Si crece, se mueve lo lento a CI; nunca se quita.

### Reglas que se revisan en el PR (revisor)

- WCAG 2.5.7: todo gesto de deslizar o arrastrar tiene también un botón.
- WCAG 1.4.4: con la fuente de Android al 200 % el texto se lee sin cortarse.
- Se respeta el ajuste «Quitar animaciones» del sistema.

---

## 3. En cada hito (manual, en el Redmi Note 15 Pro 5G; el hito no se cierra si falla)

Siempre con la **build de release**, la pantalla a **120 Hz** (como la usa el dueño) y 60 prendas reales. Mediana de 5 medidas, anotada en `docs/rendimiento.md` con la versión de HyperOS.

| Qué | Umbral | Cómo se mide |
|---|---|---|
| Outfits visibles, arranque en frío | ≤ 2,5 s | marca de tiempo propia en logcat, contrastada con `adb shell am start -W` |
| Outfits visibles, app en memoria | ≤ 1 s | igual |
| Motor con 300 prendas | < 100 ms | marca de tiempo en el móvil |
| Animaciones clave (regenerar, candado, confirmar → cesto, transiciones) | **objetivo 120 fps:** ≤ 5 % de frames que no llegan a 8,3 ms; **mínimo obligatorio:** ninguna por debajo de 60 fps (≤ 5 % de frames > 16,7 ms) | `adb shell dumpsys gfxinfo <paquete>` durante un guion fijo |
| Alta de prenda con foto | ≤ 20 s de media | cronómetro, 5 altas |
| Accesibilidad (externo) | 0 avisos de Accessibility Scanner (Google) en cada pantalla, o justificados en Excepciones | app Accessibility Scanner |
| Lector de pantalla | El ciclo de la mañana completo con TalkBack, sin bloqueos | recorrido manual |
| Calidad de los tests (externo al probador) | Mutation score ≥ 60 % en el motor y en lavado; **informativo**, no bloquea | Stryker, `--mutate` solo esos módulos |

**Sobre los 120 Hz:** la animación con Reanimated corre en el hilo de UI y puede ir a la tasa de la pantalla. Si un efecto concreto (Skia, desenfoque) no llega a 120 fps de forma estable, se acepta **solo si cumple el mínimo de 60 fps** y queda anotado en `docs/rendimiento.md`. HyperOS puede bajar la tasa sola cuando la pantalla está quieta: se mide con 120 Hz fijados en los ajustes.

## 4. Nada de claves

- `.env*` en `.gitignore`.
- Prohibidas las variables `EXPO_PUBLIC_*` con `KEY`, `TOKEN` o `SECRET`: Expo las mete dentro del APK y cualquiera puede leerlas.
- La clave de Gemini solo vive en `expo-secure-store`, la escribe el usuario y viene vacía; ningún APK que se comparta lleva una clave.
- `scripts/floor-guard` busca `AIza` (prefijo de las claves de Google) en el *diff*.
- gitleaks siempre con `--redact`: informa de la regla y el archivo, nunca del valor.

---

## Medido, aún no aplicado (trinquetes)

Se mide en el primer hito y después **no puede empeorar**.

| Métrica | Hoy | Dirección |
|---|---|---|
| Cobertura del proyecto fuera de `domain/` | sin medir (no hay código) | no puede bajar más de 0,5 % |
| Tamaño del APK de release | sin medir | no puede crecer > 10 % sin explicación en el PR |

## Dónde corre cada cosa

| Momento | Qué | Presupuesto |
|---|---|---|
| El agente edita | tsc + eslint del archivo | < 10 s |
| `npm run check` (antes de cada commit) | lint + tsc + Jest con cobertura + floor-guard | ≤ 90 s |
| CI en cada PR (sin verde no se fusiona en `main`) | check + gitleaks + npm audit | sin límite |
| Cada hito | §3 en el Redmi + E2E Maestro + Stryker | manual |

## Cómo se protege este archivo

- Solo cambia en su propio PR (`chore(constraints): …`) con la aprobación del dueño; nunca en el PR de la función que fallaba.
- Endurecerlo puede ser silencioso; rebajarlo, nunca.

## Pendiente de verificar en la documentación oficial (al montarlo, hito 0)

- ~~Globs por ruta en `coverageThreshold` de Jest 30.~~ **Verificado (2026-11-26, #3):** se admiten y se evalúan por archivo (https://jestjs.io/docs/configuration#coveragethreshold-object, v30.5). Ojo: la clave se resuelve contra el `cwd` y un glob sin archivos hace fallar Jest; resuelto en `jest.domain-coverage.js` y probado en `config-tests/jest-coverage.test.ts`.
- ~~`linterOptions.noInlineConfig` en la configuración flat de ESLint de `eslint-config-expo` (SDK 58).~~ **Verificado (2026-11-26, #5):** `eslint-config-expo` 58 es flat con ESLint 9 y `noInlineConfig: true` deja sin efecto los `eslint-disable` (https://eslint.org/docs/latest/use/configure/configuration-files); probado en `config-tests/eslint-floor.test.ts`.
- Salida de `dumpsys gfxinfo` en HyperOS a 120 Hz (cómo cuenta los frames lentos).
- Si la acción de gitleaks es gratis para cuentas personales; si no, se usa el binario en CI.

## Excepciones

Cada una con dueño, motivo y caducidad (máximo 90 días).

| ID | Regla | Ruta | Motivo | Dueño | Caduca |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
