# Plan de implementación: ArmarioInteligente V1

- **Estado:** **Aprobado** por el dueño (2026-11-26). Issues de H0 (#2-#15) y H1 (#16-#25) creadas; milestones H0-H6 creados. Las issues de H2-H6 se crean al empezar cada hito. **Progreso H0 (2026-11-26):** T0.1-T0.9 (#2-#10) hechas y fusionadas (PR #27-#36; `check` ~45 s; CI con gitleaks por binario oficial; `main` protegida). **(2026-11-27):** T0.10 (#11, PR #40), T0.14 (#15, PR #41) y T0.11 (#12, PR #42: 10 agentes + hook `scripts/agent-guard.mjs`) hechas; #12 queda abierta hasta la prueba en seco en una sesión nueva. Siguiente: prueba en seco, luego T0.12 (#13) → T0.13 (#14).
- **Spec de origen:** [SPEC.md](../SPEC.md), [spec/capability-map.md](../spec/capability-map.md) y `spec/SPEC-<id>.md`.
- **Listón:** [CONSTRAINTS.md](../CONSTRAINTS.md). Toda tarea lo cumple, además de sus criterios propios.
- **Dónde se siguen las tareas:** issues de GitHub en https://github.com/Javier71412/ArmarioInteligente, una por tarea, agrupadas en *milestones* (uno por hito). Este archivo es el índice ordenado; cada tarea lleva su número de issue (`#N`) al lado del id. No hay `tasks/todo.md`, para no tener dos listas.

## Visión general

Se construye en 7 hitos (H0-H6) siguiendo el orden del mapa de capacidades. **H0** deja montado el «repo de empresa» y el listón de calidad funcionando de verdad, y despeja los riesgos técnicos con *spikes* antes de escribir funciones. **H1** fija el diseño (aprobado por el dueño) y los cimientos: navegación, componentes base y almacenamiento. Desde **H2** cada hito entrega algo que el dueño puede usar en su Redmi: primero el armario, luego cesto, clima, agenda y etiquetado, después la copia, el motor y, por último, la pantalla Hoy, que une todo.

## Decisiones de planificación

1. **Riesgo primero.** Los *spikes* (node:sqlite en Jest, build Android en Windows con módulo nativo, píxeles del ADR 0007) van en H0: si uno falla, se cambia el ADR antes de construir encima.
2. **El listón se monta antes que las funciones.** Cada comprobación de `CONSTRAINTS.md` solo cuenta como montada cuando se ve **fallar** con una violación hecha a propósito, **pasar** con un caso limpio y **fallar** si el propio escáner da error.
3. **Rebanadas verticales desde H2:** cada tarea de interfaz va de dominio a pantalla (por ejemplo, «dar de alta una prenda sin IA»), no «todo el dominio» y luego «todas las pantallas».
4. **Cada tarea de lógica sigue el TDD con agentes separados** (`CONSTRAINTS.md` §1): commit `test(...)` del probador → commit `feat(...)` del desarrollador → revisión → PR → integrador. Las tareas de H0 que son configuración (no lógica de la app) llevan sus propios tests de «violación a propósito» en lugar de este ciclo, porque los agentes aún no existen.
5. **Una issue = una rama = un PR** (`feat/12-descripcion`), squash merge con CI en verde (permiso permanente del dueño).
6. **Los hitos H2-H6 se detallan al empezar cada uno.** Sus tareas están aquí con criterios resumidos; al abrir el hito, el planificador las afina con la spec del módulo y se crean sus issues. Así no se planifica en detalle sobre suposiciones que los *spikes* pueden cambiar.
7. **Puntos de control del dueño:** al final de cada hito (demo en el Redmi y medidas de `CONSTRAINTS.md` §3 que ya apliquen) y en las puertas de diseño de H1.

## Grafo de dependencias (resumen)

```
H0 repo + listón + CI + spikes + agentes
 └─ H1 diseño aprobado ─┬─ core (tema, navegación, componentes)
                        └─ storage (puerto SQL, migraciones, fotos)
     └─ H2 wardrobe (alta manual, lista, ficha, filtros)
         └─ H3 en paralelo: laundry · weather · schedule · tagging
             └─ H4 backup
                 └─ H5 outfit-engine
                     └─ H6 today + recordatorio + E2E + release
```

---

## H0 · Cimientos: repo de empresa, listón y *spikes*

Objetivo: que sea **imposible** fusionar algo que rompa el listón, y que los riesgos técnicos estén despejados.

### T0.1 (#2) · Crear el proyecto Expo SDK 58
- **Qué:** proyecto Expo con TypeScript `strict` y Expo Router, carpetas vacías de la estructura de `SPEC.md` (`app/`, `src/modules/<carpeta>/{domain,data,ui}`, `index.ts` vacíos) y los scripts de `SPEC.md` › Comandos en `package.json`. Caché de npm en `D:\DevTools`.
- **Criterios:**
  - [ ] Plantilla y versiones comprobadas en la doc oficial de Expo (fuente y fecha en el PR).
  - [ ] `npx expo start` abre una pantalla de prueba en web o Expo Go.
  - [ ] `npx tsc --noEmit` y `npx expo lint` pasan.
- **Depende de:** nada · **Tamaño:** M

### T0.2 (#3) · Jest 30 con jest-expo, Testing Library y cobertura de `domain/`
- **Qué:** configuración de tests con un test de humo y `coverageThreshold` por glob para `src/modules/*/domain/**` (≥ 90 % líneas, ≥ 85 % ramas).
- **Criterios:**
  - [ ] Verificado en la doc que Jest 30 acepta globs por ruta en `coverageThreshold` (pendiente de `CONSTRAINTS.md`).
  - [ ] Con un archivo de dominio sin tests, `npm test` **falla** por cobertura; con su test, pasa.
  - [ ] Un test de pantalla de ejemplo localiza un botón con `getByRole(…, { name })`.
- **Depende de:** T0.1 · **Tamaño:** S

### T0.3 (#4) · *Spike* (1 h): `node:sqlite` dentro de Jest — ADR 0002
- **Qué:** comprobar que Jest 30 + jest-expo resuelve `node:sqlite` y ejecuta `prepare().run/all/get` en memoria. Anotar `sqlite_version()`.
- **Criterios:**
  - [ ] Resultado (funciona / no funciona y por qué) anotado en `docs/adr/0002-…` › Consecuencias.
  - [ ] Si no funciona: parar y pedir al dueño aprobar el plan B (`sql.js`, dependencia de desarrollo nueva).
- **Depende de:** T0.2 · **Tamaño:** XS

### T0.4 (#5) · ESLint: el suelo antitrampas
- **Qué:** configuración flat sobre `eslint-config-expo` con `ban-ts-comment`, `no-explicit-any`, `no-empty`, `linterOptions.noInlineConfig: true`, y Prettier. Archivos trampa en `eslint-fixtures/` (uno por regla) y un test que exige que cada uno dé error.
- **Criterios:**
  - [ ] Verificado en la doc que `eslint-config-expo` de SDK 58 es ESLint 9 flat y admite `noInlineConfig`.
  - [ ] Cada archivo trampa da error; el código limpio pasa; un `// eslint-disable` en código real no tiene efecto.
  - [ ] Si el config de ESLint está roto, el comando falla (no da verde en silencio).
- **Depende de:** T0.1 · **Tamaño:** S

### T0.5 (#6) · Fronteras entre módulos — ADR 0006
- **Qué:** eslint-plugin-boundaries con la tabla del mapa de capacidades (solo `index.ts` entre módulos, `default: disallow`, `no-unknown-files`) y `no-restricted-imports` en `domain/` (sin React, Expo, `../ui`, `../data`). Archivos trampa por regla.
- **Criterios:**
  - [ ] Un import a un módulo no permitido, a un archivo interno de otro módulo y de React en `domain/` dan error.
  - [ ] Los alias de TypeScript se resuelven (un import prohibido con alias también da error).
  - [ ] Un archivo fuera de la estructura avisa.
- **Depende de:** T0.4 · **Tamaño:** M

### T0.6 (#7) · `scripts/floor-guard`
- **Qué:** script sin dependencias, adaptado de la referencia de la skill `constraint-driven-development`, que mira el *diff* contra la rama base: `.skip/.only/xit/xdescribe/test.todo`, `istanbul/c8 ignore`, tests borrados o `expect` quitados sin motivo en el commit, `Not implemented`/`TODO` como implementación, `AIza`, `getByTestId` fuera de `e2e/`, `CONSTRAINTS.md` rebajado junto a código, y **commits `feat`/`fix` que tocan tests** (TDD separado).
- **Criterios:**
  - [ ] Una batería de tests del propio script con un caso que viola y uno limpio **por cada regla**.
  - [ ] Sale con 0 (bien), 1 (violación) y 2 (error del script), y el 2 hace fallar la CI.
- **Depende de:** T0.2 · **Tamaño:** M

### T0.7 (#8) · `npm run check`
- **Qué:** lint + tsc + Jest con cobertura + floor-guard en un solo comando.
- **Criterios:**
  - [ ] Falla si falla cualquiera de las cuatro piezas (probado rompiendo cada una).
  - [ ] Tiempo medido y anotado; ≤ 90 s.
- **Depende de:** T0.4, T0.5, T0.6 · **Tamaño:** XS

### T0.8 (#9) · CI en GitHub Actions
- **Qué:** flujo en cada PR y en `main`: `npm ci`, `npm run check`, `gitleaks dir . --redact --no-banner` y `npm audit --omit=dev --audit-level=high`. Node fijado (≥ 22.13).
- **Criterios:**
  - [ ] Verificado si la acción de gitleaks es gratis en cuenta personal; si no, binario descargado de su release oficial con *checksum*.
  - [ ] Un PR de prueba con una violación a propósito (por ejemplo, `.only` y una clave falsa) sale en **rojo**; corregido, en **verde**. El PR de prueba se cierra sin fusionar.
- **Depende de:** T0.7 · **Tamaño:** S · *Tocar la CI está aprobado al aprobar este plan.*

### T0.9 (#10) · Proteger `main` y activar el escaneo de secretos
- **Qué:** regla (*ruleset*) en `main`: solo por PR, CI obligatoria en verde, sin `push --force` ni borrado, historial lineal (squash). Activar *secret scanning* y *push protection*.
- **Criterios:**
  - [ ] Un `git push` directo a `main` es rechazado.
  - [ ] Un PR con la CI en rojo no se puede fusionar.
  - [ ] *Push protection* activa (comprobado en los ajustes del repo con `gh api`).
- **Depende de:** T0.8 · **Tamaño:** XS

### T0.10 (#11) · Plantillas de issue y PR, etiquetas y *milestones*
- **Qué:** `.github/ISSUE_TEMPLATE/` (tarea, bug, spike) con los campos de este plan (qué, criterios, verificación, depende de, tamaño); `.github/pull_request_template.md` con la lista de `CONSTRAINTS.md` y «Cierra #N»; etiquetas por módulo y tipo; un *milestone* por hito.
- **Criterios:**
  - [ ] Crear una issue desde la web muestra la plantilla de tarea.
  - [ ] La plantilla de PR incluye el recordatorio de TDD separado y de no rebajar el listón.
- **Depende de:** nada · **Tamaño:** S

### T0.11 (#12) · Agentes del equipo en `.claude/agents/`
- **Qué:** definiciones con sus skills precargadas y herramientas separadas (ver «Roles» abajo). Repasar `arquitecto.md`. Cada definición acaba con «entrega siempre el informe final».
- **Criterios:**
  - [ ] El probador no tiene acceso a código de producción para escribir (solo tests); el desarrollador tiene la regla «nunca toques `*.test.ts(x)` ni `__tests__/`; si un test está mal, para y avisa». La garantía dura es `floor-guard` (T0.6).
  - [ ] En una sesión nueva, cada agente se puede llamar por su nombre (prueba en seco: cada uno lee su encargo y responde sin tocar archivos).
  - [ ] Ningún agente llama a otro: solo el coordinador los lanza.
- **Depende de:** T0.6 · **Tamaño:** M · *Abre sesión nueva al terminar (las definiciones se cargan al iniciar).*

### T0.12 (#13) · *Spike*: compilar Android en Windows y módulo nativo «hola mundo» — ADR 0008
- **Qué:** JDK 17, Android SDK (Platform 35, Build-Tools 36) y Gradle en `D:\DevTools`; `npx expo run:android` en emulador y en el Redmi; `create-expo-module --local` en `modules/tagging-native` con una función Kotlin que devuelve un texto.
- **Criterios:**
  - [ ] La app de desarrollo se instala en el Redmi y llama a la función nativa.
  - [ ] Respondido en el ADR 0008: si `expo run:android` enlaza solo los módulos de `modules/`, si el `.web.ts` se genera y si el manifiesto del módulo se fusiona.
  - [ ] Versión de HyperOS y Android del Redmi anotada en `docs/rendimiento.md`.
- **Depende de:** T0.1 · **Tamaño:** M

### T0.13 (#14) · *Spike* (≤ 1 día): fotos y píxeles — ADR 0007
- **Qué:** responder las 4 preguntas del ADR 0007: `readPixels` de Skia desde un archivo local (y su tiempo a 64×64), WebP con transparencia frente a PNG, `resize` con un solo lado, y tiempo foto → recorte → colores en el Redmi. Código del *spike* en una rama que **no se fusiona**.
- **Criterios:**
  - [ ] ADR 0007 pasa a **Aceptado** con la opción elegida (A Skia o B nativo) y las medidas, o vuelve al dueño si ninguna vale.
  - [ ] Si se elige B, se anota en ADR 0008 que `samplePixels` entra en el contrato.
- **Depende de:** T0.12 · **Tamaño:** M

### T0.14 (#15) · Documentación montada en el vault
- **Qué:** `docs/00-Inicio.md` (mapa de la documentación del repo), `docs/rendimiento.md` (plantilla de medidas de §3), registrar el proyecto en `Sistema/proyectos.json` del vault y ejecutar `enlazar-proyectos.ps1`.
- **Criterios:**
  - [ ] En el vault, `Proyectos/ArmarioInteligente/docs` muestra los archivos del repo.
  - [ ] `_Proyecto.md` ↔ `docs/00-Inicio.md` enlazados con *wikilinks*.
- **Depende de:** nada · **Tamaño:** XS

### Punto de control H0
- [ ] Un PR con violaciones a propósito sale rojo en CI por **cada** fila de `CONSTRAINTS.md` §0 y §2 que ya se puede montar (las de contraste, 48 dp, migraciones y motor se montan con su módulo).
- [ ] `main` protegida; plantillas visibles.
- [ ] Los 3 *spikes* cerrados y sus ADR actualizados.
- [ ] Agentes llamables por nombre en una sesión nueva.
- [ ] Revisión con el dueño antes de H1.

**Orden sugerido en H0:** T0.1 → T0.2 → T0.3 (riesgo) → T0.4 → T0.5 → T0.6 → T0.7 → T0.8 → T0.9; T0.10 y T0.14 en cualquier momento; T0.11 tras T0.6; T0.12 → T0.13 en paralelo con T0.4-T0.9 (no tocan los mismos archivos).

---

## H1 · Diseño aprobado y cimientos (`app-base`, `almacen-local`)

Puertas del dueño: nada de interfaz se programa hasta aprobar T1.1-T1.4.

| Tarea | Qué | Criterios clave | Depende | Tamaño |
|---|---|---|---|---|
| T1.1 (#16) | Identidad visual en `docs/diseno/identidad.md` (referencias, paleta clara y oscura, tipografía, tarjetas, iconos) | Aprobada por el dueño | H0 | S |
| T1.2 (#17) | Principios de movimiento y háptica en `docs/diseno/movimiento.md` (muelles, duraciones, reducir movimiento, 120 Hz) | Aprobados por el dueño | T1.1 | S |
| T1.3 (#18) | Tokens W3C en `design/tokens/*.tokens.json` + conversión a TS + **test de contraste** (§2) | Contraste ≥ 4,5:1 / 3:1 en claro y oscuro; un token con mal contraste hace fallar el test | T1.1 | M |
| T1.4 (#19) | Prototipo en Figma de Hoy, Alta de prenda y Cesto | Aprobado por el dueño; enlace en `docs/diseno/` | T1.2, T1.3 | M |
| T1.5 (#20) | Tema (sistema / forzado), navegación de 4 pestañas con estado vacío, *edge-to-edge* y zonas seguras | Se ve en el Redmi en claro y oscuro; *predictive back* funciona | T1.4 | M |
| T1.6 (#21) | Componentes base Botón, Chip y Tarjeta + regla «solo los base importan `Pressable`» + **test de 48 dp** | Test de zona táctil; un `Pressable` fuera de los base da error de lint | T1.5 | M |
| T1.7 (#22) | Hoja inferior, Toast con «Deshacer», Estado vacío y Esqueleto | Interrumpibles; respetan reducir movimiento; etiquetas para TalkBack | T1.6 | M |
| T1.8 (#23) | `storage`: puerto `SqlDatabase`, adaptador `node:sqlite`, *runner* de migraciones (`user_version`) + tests N−1 → N y de fallo | Versiones únicas y consecutivas; una migración sin *fixture* hace fallar el test | T0.3 | M |
| T1.9 (#24) | `storage`: adaptador `expo-sqlite` con cola de escrituras, guardado de fotos (`Paths.document`, redimensionado del ADR 0007) y exportar/importar la base | Funciona en el Redmi; misma batería de tests de repositorio que en Node | T1.8, T0.13 | M |
| T1.10 (#25) | Ajustes mínimos (tema, háptica) guardados | Persisten tras cerrar la app | T1.7, T1.9 | S |

**Punto de control H1:** app en el Redmi con pestañas, tema y ajustes; primera medida del tamaño del APK y de la cobertura fuera de `domain/` (trinquetes de `CONSTRAINTS.md`).

---

## H2 · Armario (`wardrobe`) — primer bloque usable

| Tarea | Qué | Criterios clave | Depende | Tamaño |
|---|---|---|---|---|
| T2.1 | Dominio: vocabulario cerrado y validación de `Garment` | Casos de `SPEC-armario` › Criterios; cobertura de dominio | H1 | S |
| T2.2 | Repositorio + migración de prendas + hook con `useSyncExternalStore` (ADR 0003) | Test N−1 → N; test de repositorio en Node | T2.1 | M |
| T2.3 | Alta con foto (cámara o galería) **sin IA**, atributos con botones, «guardar y añadir otra» | Flujo probado con Testing Library; foto en `Paths.document` | T2.2 | M |
| T2.4 | Lista en cuadrícula con estado vacío | Fluida con 300 prendas (lista virtualizada) | T2.3 | S |
| T2.5 | Ficha con edición en un toque | Cambios persisten; etiquetas para TalkBack | T2.4 | M |
| T2.6 | Borrar con confirmación (referencia «prenda eliminada» preparada para el historial) | No deja fotos huérfanas | T2.5 | S |
| T2.7 | Filtros (categoría, color, formalidad) y búsqueda por nombre | Casos de la spec | T2.4 | S |

**Punto de control H2:** el dueño da de alta sus prendas reales en el Redmi. Medida de alta sin IA (referencia para el ≤ 20 s).

---

## H3 · Cesto, clima, agenda y etiquetado (cuatro líneas en paralelo)

Cada línea toca solo su módulo; se pueden repartir entre desarrolladores a la vez.

| Tarea | Qué | Criterios clave | Depende | Tamaño |
|---|---|---|---|---|
| **L1** | `laundry` dominio: registrar uso, umbral por tipo y prenda, deshacer, lavado, delicadas | **Un test por cada caso límite** de `SPEC-lavanderia` | H2 | M |
| L2 | Repositorio + migración + historial de usos | Test de migración; deshacer restaura exactamente | L1 | M |
| L3 | Pantalla Cesto (Normal / Delicada), «al cesto ya», «sigue limpia», «lavado» | Flujo probado; animación interrumpible | L2 | M |
| L4 | Umbrales en Ajustes y en la ficha de prenda | Persisten; la ficha muestra usos totales y último uso | L3 | S |
| **C1** | `weather` dominio: resumen de franja | Casos límite de `SPEC-clima`, **incluidos los cambios de hora de marzo y octubre** | H1 | S |
| C2 | Cliente de Open-Meteo + caché (refrescar a las 3 h) | Sin red usa la caché o devuelve `NoForecast`; test con respuestas grabadas | C1 | M |
| C3 | Ubicación (GPS o ciudad a mano) en Ajustes + atribución CC BY 4.0 visible | Sin permiso, funciona con ciudad | C2 | S |
| **A1** | `schedule` dominio: tipos de plan, semana tipo, plan de hoy | Casos de `SPEC-agenda` | H1 | S |
| A2 | Repositorio + migración | Test de migración | A1 | S |
| A3 | Asistente de primer arranque (< 1 min) | Se puede saltar y volver desde Ajustes | A2 | M |
| A4 | Hoja «Plan de hoy» (cambio solo para hoy) | 1 toque abre; vuelve a la semana tipo mañana | A3 | S |
| **E1** | `tagging` dominio: `extractColors` sobre RGBA con imágenes sintéticas | Paleta con nombre; colores siempre activos | H2, T0.13 | M |
| E2 | Cadena de proveedores `AttributeSuggester` (errores como valores, umbral 0,6) | Fallo de un proveedor → edición manual; test con *fakes* | E1 | S |
| E3 | Nativo: `segmentSubject` con ML Kit (recorte WebP/PNG según ADR 0007) | En el Redmi; `unavailable` si el modelo se descarga | E2, T0.12 | M |
| E4 | Nativo: `classifyImage` con MediaPipe (versión fija) | Preselecciona tipo; nunca impone | E3 | M |
| E5 | «Toca la prenda» con MediaPipe Interactive Segmenter | Alternativa cuando el recorte es malo | E3 | M |
| E6 | Gemini opcional: clave en `expo-secure-store`, desactivado por defecto | Sin clave no hay llamadas; floor-guard bloquea `AIza` | E2 | M |
| E7 | Integrar sugerencias en el alta sin bloquear la UI | Alta ≤ 20 s de media (5 altas en el Redmi) | E4, T2.3 | S |

**Punto de control H3:** cesto, clima, agenda y alta con IA en el Redmi; primer recorrido con TalkBack y Accessibility Scanner.

---

## H4 · Copia de seguridad (`backup`)

| Tarea | Qué | Criterios clave | Depende | Tamaño |
|---|---|---|---|---|
| B1 | Exportar ZIP sin comprimir (fflate) con base, fotos y manifiesto; compartir con expo-sharing | Archivo `armario-AAAA-MM-DD.*` | H3 | M |
| B2 | Importar: elegir archivo, validar, ver resumen y confirmar | Archivo corrupto o de otra versión → mensaje claro, nada se pierde | B1 | M |
| B3 | Prueba de ida y vuelta en una instalación limpia | Criterio de éxito 8 completo | B2 | S |

---

## H5 · Motor de outfits (`outfit-engine`, lógica pura)

| Tarea | Qué | Criterios clave | Depende | Tamaño |
|---|---|---|---|---|
| M1 | Composición válida solo con prendas limpias | Nunca una prenda sucia | H3 | M |
| M2 | Reglas de clima, formalidad del plan e historial reciente | Casos de `SPEC-motor-outfits` › Reglas | M1 | M |
| M3 | Candado y regenerar con semilla explícita (sin azar oculto) | Bloqueadas siempre presentes; misma semilla → mismo resultado | M2 | S |
| M4 | Explicación por plantillas y avisos (sin clima, pocas prendas) | Textos en el catálogo | M3 | S |
| M5 | Propiedades con fast-check (`numRuns: 1000`) y guarda de velocidad (300 prendas, mediana < 50 ms en Node) | Filas de «Motor» de `CONSTRAINTS.md` §2 en verde | M4 | S |

---

## H6 · Hoy (`today`), recordatorio, E2E y versión 1.0

| Tarea | Qué | Criterios clave | Depende | Tamaño |
|---|---|---|---|---|
| D1 | Cabecera: fecha, chip de plan (abre la hoja) y resumen de clima | Atribución visible; aviso sin clima | H5 | S |
| D2 | 3 tarjetas de outfit con gesto fluido | 120 fps objetivo, 60 mínimo | D1 | M |
| D3 | Candado y regenerar en la UI | Interrumpible; botón además del gesto (WCAG 2.5.7) | D2 | M |
| D4 | Confirmar («Me lo pongo») → usos → animación al cesto; «Cambiar» y deshacer | ≤ 2 toques; deshacer durante el día | D3 | M |
| D5 | Estados especiales y plan Casa | Casos de `SPEC-manana` | D4 | S |
| D6 | Recordatorio diario local (canal de Android) | Llega en el Redmi; guía si HyperOS lo bloquea | D5 | M |
| D7 | E2E con Maestro: mañana, alta sin IA, lavar, exportar/importar; decidir si corre en cada PR o solo en `main` según su tiempo | Verdes en emulador de CI (API 34) | D5 | M |
| D8 | APK de release instalable (comando fijado con la doc oficial) | Se instala en el Redmi sin cuenta de Expo | D7 | S |
| D9 | Medidas completas de `CONSTRAINTS.md` §3 + Stryker (informativo) en `docs/rendimiento.md` | Todos los umbrales bloqueantes cumplidos | D8 | S |
| D10 | 2 semanas de uso real del dueño → versión `v1.0.0` | Criterio de éxito 10; *tag* y notas de versión | D9 | — |

---

## Roles de agentes (T0.11)

| Agente | Hace | Skills precargadas | No puede |
|---|---|---|---|
| `arquitecto` (ya existe) | ADR y contratos | documentation-and-adrs, api-and-interface-design, source-driven-development, doubt-driven-development | Programar |
| `probador` | Tests desde la spec, demostrando que fallan por el motivo correcto | test-driven-development, source-driven-development | Escribir código de producción |
| `dev-dominio` | `domain/` y `data/` (TS puro, repositorios, migraciones) | incremental-implementation, test-driven-development, source-driven-development | Tocar tests |
| `dev-interfaz` | `ui/`, rutas de `app/`, componentes y animaciones | frontend-ui-engineering, incremental-implementation, source-driven-development | Tocar tests |
| `dev-nativo` | `modules/tagging-native` (Kotlin) | incremental-implementation, source-driven-development | Tocar tests |
| `revisor` | Revisión de 5 ejes de cada PR | code-review-and-quality, constraint-driven-development | Editar código |
| `revisor-seguridad` | PR con claves, red, archivos o permisos | security-and-hardening | Editar código |
| `revisor-accesibilidad` | PR con interfaz | accessibility-engineering | Editar código |
| `integrador` | Rama, commits, PR, CI en verde, fusión, cierre de issue | git-workflow-and-versioning, ci-cd-and-automation | Escribir funciones |
| `disenador` | Entregables de `docs/diseno/` y Figma (H1) | frontend-ui-engineering | Programar |

El planificador es la sesión principal con `planning-and-task-breakdown` (no necesita agente propio).

**Cómo se separan las herramientas (hecho en T0.11):** cada agente pasa por el hook `PreToolUse` `scripts/agent-guard.mjs <rol>` (batería en `config-tests/agent-guard.test.ts`): el probador solo escribe tests; los desarrolladores, nunca tests ni el listón y solo su zona; los revisores, nada; Bash solo para comprobar (sin redirecciones). La definición de cada agente se comprueba en `config-tests/agents.test.ts`. La garantía dura sigue siendo `floor-guard` en CI.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| `node:sqlite` no carga en Jest | Medio | *Spike* T0.3 el primero; plan B `sql.js` (pedir al dueño) |
| La build Android falla en Windows (rutas, JDK, caché en C:) | Alto | *Spike* T0.12 antes de cualquier código nativo; todo en `D:\DevTools` |
| Skia no lee píxeles | Medio | *Spike* T0.13; plan B nativo ya contemplado en ADR 0008 |
| Un agente se salta el TDD separado | Alto | `floor-guard` en CI bloquea commits `feat` que tocan tests; el revisor lo comprueba |
| El listón «pasa» en falso (escáner roto) | Alto | Cada check probado con violación a propósito y con error del escáner |
| HyperOS bloquea el recordatorio | Medio | Probar en el Redmi en D6; guía para excluir de ahorro de batería |
| ML Kit beta o modelo sin descargar | Medio | Alta siempre posible a mano; `unavailable` como valor |
| E2E inestables en CI | Medio | Esperas por elemento, nunca por tiempo; decidir en D7 si van solo en `main` |
| Choque de números de migración entre ramas paralelas (H3) | Bajo | Test de versiones consecutivas; renumerar la rama que llega después |

## Decisiones del dueño al aprobar (2026-11-26)

El dueño aprobó el plan con las recomendaciones:

1. **Issues:** milestones de todos los hitos ya; issues solo de H0 y H1 (las de H2-H6, al empezar cada hito, ya afinadas).
2. **Agentes:** reparto de la tabla «Roles»; `revisor-seguridad` y `revisor-accesibilidad` solo en los PR que les toquen.
3. **Prototipo:** en Figma.

## Preguntas abiertas

Ninguna. Las nuevas se anotan aquí.
