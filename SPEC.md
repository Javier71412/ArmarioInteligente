# Spec: ArmarioInteligente — V1

Estado: **aprobada** por el dueño (2026-11-26). Cambios a partir de ahora: spec delta (`SPEC-<cambio>.md`) o, antes de implementar, edición con aprobación.
Índice de módulos: [spec/capability-map.md](spec/capability-map.md) (aprobado). Cada módulo tiene su spec en `spec/SPEC-<id>.md`. Origen del stack: [spec/stack-comparativa.md](spec/stack-comparativa.md).

## Objetivo

App Android personal, de uso diario y rápido, que hace de estilista y de gestor de armario:
- Cada mañana propone **3 outfits explicados** según la ropa limpia, el clima de las horas que vas a pasar fuera y el plan del día.
- Lleva la cuenta de **qué está limpio y qué toca lavar**.

Usuario único: el dueño. Sin cuentas, sin servidor y con 0 € de coste. Debe sentirse una app de 2026: muy pulida, fluida y original, sin sacrificar la rapidez de uso.

**Historia principal:** «Abro la app por la mañana, veo mi plan y el tiempo de mi franja, elijo uno de los 3 outfits (fijando con candado lo que me guste y regenerando el resto), confirmo y la app ya sabe qué va al cesto».

## Principios de producto (deciden los empates)

1. **Rapidez antes que adorno.** Ninguna animación bloquea una acción; todas se pueden interrumpir.
2. **Nunca miente:** nunca propone una prenda sucia, y avisa cuando le faltan datos (sin clima, pocas prendas).
3. **Lo automático se corrige en un toque:** la IA sugiere, el usuario decide.
4. **Todo funciona sin conexión** salvo actualizar el clima y la opción Gemini.
5. **Identidad visual propia:** nada de aspecto de plantilla; el diseño se aprueba antes del código.

## Tech Stack

Versiones verificadas en la documentación oficial el 2026-11-26. Las librerías sin verificar están marcadas.

| Pieza | Versión | Fuente |
|---|---|---|
| Expo SDK | 58 (React Native 0.88, React 19.3, Android 7+, Node ≥ 22.13) | https://docs.expo.dev/versions/latest/ |
| TypeScript | modo `strict`, `extends: expo/tsconfig.base` | https://docs.expo.dev/guides/typescript/ |
| Expo Router | rutas por archivos en `app/`, rutas tipadas | https://docs.expo.dev/router/introduction/ |
| Reanimated | 4.7.x + `react-native-worklets` (New Architecture) | https://docs.expo.dev/versions/latest/sdk/reanimated/ |
| Gesture Handler | 3.3.x | https://docs.expo.dev/versions/latest/sdk/gesture-handler/ |
| React Native Skia | 2.14.x (efectos, lectura de píxeles: **verificar** en spike) | https://docs.expo.dev/versions/latest/sdk/skia/ |
| expo-sqlite | datos locales | https://docs.expo.dev/versions/latest/sdk/sqlite/ |
| expo-file-system | API `File` / `Directory` / `Paths` (no la *legacy*) | https://docs.expo.dev/versions/latest/sdk/filesystem/ |
| expo-image, expo-camera, expo-image-picker | fotos | https://docs.expo.dev/versions/latest/sdk/image/ · …/camera/ · …/imagepicker/ |
| expo-location | ubicación en primer plano | https://docs.expo.dev/versions/latest/sdk/location/ |
| expo-secure-store | clave opcional de Gemini | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| expo-sharing, expo-document-picker | exportar e importar copia | https://docs.expo.dev/versions/latest/sdk/sharing/ · …/document-picker/ |
| expo-haptics, expo-blur, expo-font | acabado | https://docs.expo.dev/versions/latest/sdk/haptics/ · …/blur-view/ · …/font/ |
| MediaPipe Image Classifier | tipo de prenda en el móvil, vía módulo nativo local (Expo Modules) | https://developers.google.com/edge/mediapipe/solutions/vision/image_classifier |
| ML Kit Subject Segmentation | quitar el fondo en el móvil (beta; modelo descargado por Google Play services; API 24+; ~200 ms) | https://developers.google.com/ml-kit/vision/subject-segmentation · …/subject-segmentation/android |
| MediaPipe Interactive Segmenter | alternativa para quitar el fondo tocando la prenda (Android y web) | https://developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter |
| expo-notifications | recordatorio diario local, sin servidor (canal de Android obligatorio) | https://docs.expo.dev/versions/latest/sdk/notifications/ |
| Gemini API (capa gratuita) | etiquetado en la nube, opcional, con la clave del dueño | https://aistudio.google.com/docs/image-understanding · https://aistudio.google.com/docs/terms |
| Open-Meteo | previsión horaria, sin clave, CC BY 4.0 | https://open-meteo.com/en/docs |
| Jest 30 + jest-expo + Testing Library RN | tests | https://docs.expo.dev/develop/unit-testing/ |
| ESLint (`eslint-config-expo`, flat) + Prettier | estilo | https://docs.expo.dev/guides/using-eslint/ |

**Por decidir en ADR (arquitecto, antes del plan):** acceso a SQLite (SQL a mano o un ORM), gestión de estado, formato del archivo de copia y herramienta de tests E2E. Cada opción se verifica contra su documentación oficial.

## Comandos

```bash
npx expo start                 # servidor de desarrollo
npx expo run:android           # compila e instala la build de desarrollo (Windows, sin cuenta Expo)
npm test                       # "test": "jest"            (CI, una pasada)
npm run test:watch             # "test:watch": "jest --watchAll"
npm run lint                   # "lint": "eslint ." (todo el proyecto; `npx expo lint` solo mira src/, app/ y components/)
npm run typecheck              # tsc --noEmit (app + config-tests)
npm run floor-guard            # suelo de CONSTRAINTS.md sobre el diff contra origin/main
npm run check                  # floor-guard + typecheck + lint + jest --coverage (puerta antes de cada commit/PR; ~45 s, máx. 90 s)
```
APK de release para instalar en el móvil: **SIN VERIFICAR**, se fija en la tarea de CI/release con la doc oficial.
Cachés y SDK de Android en `D:\DevTools` (C: está lleno).

## Estructura del proyecto

```
app/                       → rutas de Expo Router (finas: solo montan pantallas de los módulos)
src/modules/<carpeta>/     → un directorio por módulo del mapa (ver glosario: core, wardrobe, laundry…)
  domain/                  → tipos y lógica pura (sin React ni Expo) + *.test.ts
  data/                    → repositorios sobre storage
  ui/                      → pantallas y componentes del módulo + *.test.tsx
  index.ts                 → interfaz pública del módulo: lo único que importan los demás
src/modules/core/design/   → tokens generados, tema, componentes base, movimiento
modules/tagging-native/    → módulo nativo local (Expo Modules, Kotlin): MediaPipe y ML Kit
design/tokens/*.tokens.json → fuente de los tokens (formato W3C Design Tokens 2025.10)
spec/                      → mapa de capacidades y specs por módulo
docs/adr/                  → decisiones de arquitectura
docs/diseno/               → identidad, principios de movimiento, prototipos aprobados
tasks/                     → plan.md y todo.md
```
**Regla de fronteras:** un módulo solo importa el `index.ts` de los módulos de los que depende en el mapa. ESLint lo comprueba (regla por definir en el ADR de estructura).

## Estilo de código

- **Código todo en inglés:** identificadores, nombres de archivo y carpeta, comentarios y mensajes de commit. **Specs, documentación y textos de la app en español.** El glosario de abajo traduce cada término de la spec a su nombre en el código; es obligatorio usarlo.
- Funciones puras en `dominio/`: sin fechas ni azar ocultos. El reloj y la semilla se pasan como parámetro.
- Sin `any`, sin `// @ts-ignore` y sin `eslint-disable` sin justificar en el PR.
- Componentes funcionales; estilos desde tokens, nunca valores sueltos de color, espaciado o duración.
- Textos visibles en un único catálogo por módulo (preparado para traducir).

```ts
// src/modules/laundry/domain/recordWear.ts
export function recordWear(state: LaundryState, wearsBeforeWash: number): LaundryState {
  const wearsSinceWash = state.wearsSinceWash + 1;
  return {
    ...state,
    totalWears: state.totalWears + 1,
    wearsSinceWash,
    status: wearsSinceWash >= wearsBeforeWash ? 'in-basket' : 'clean',
  };
}
```

### Glosario spec → código

| Módulo (id de spec, fijo) | Carpeta de código |
|---|---|
| `app-base` | `src/modules/core` |
| `almacen-local` | `src/modules/storage` |
| `armario` | `src/modules/wardrobe` |
| `etiquetado` | `src/modules/tagging` (+ `modules/tagging-native`) |
| `lavanderia` | `src/modules/laundry` |
| `clima` | `src/modules/weather` |
| `agenda` | `src/modules/schedule` |
| `motor-outfits` | `src/modules/outfit-engine` |
| `copia-seguridad` | `src/modules/backup` |
| `manana` | `src/modules/today` |

| Término de la spec | En el código |
|---|---|
| Prenda · Categoría · Tipo | `Garment` · `Category` · `GarmentType` |
| superior · inferior · pieza única · calzado · abrigo (capa) | `top` · `bottom` · `one-piece` · `footwear` · `outerwear` |
| Corte · Nivel de abrigo · Formalidad · Delicada | `Fit` · `warmth` · `Formality` (`casual`/`smart`/`formal`) · `delicate` |
| Usos totales · usos desde el lavado · umbral de usos | `totalWears` · `wearsSinceWash` · `wearsBeforeWash` |
| limpia · en cesto · cesto · lavado | `clean` · `in-basket` · `LaundryBasket` · `markWashed` |
| Plan del día · tipo de plan · semana tipo · franja | `DayPlan` · `PlanType` · `WeeklyTemplate` · `TimeWindow` |
| Previsión · resumen de franja · sin datos | `Forecast` · `WindowSummary` · `NoForecast` |
| Outfit · candado · regenerar · confirmar · explicación · aviso | `Outfit` · `lockedGarmentIds` · `regenerate` · `confirmOutfit` · `explanation` · `Notice` |
| SugeridorDeAtributos · sugerencia | `AttributeSuggester` · `AttributeSuggestion` |
| Copia de seguridad · exportar · importar | `Backup` · `exportBackup` · `importBackup` |

Los nombres de función e interfaz que aparecen en las specs de módulo describen el contrato; en el código se usan sus equivalentes en inglés según este glosario.

## Estrategia de tests

- **Unitarios (Jest)** de toda la lógica de `dominio/`: motor de outfits, lavado, franja de clima, agenda y migraciones. Cubren los casos límite que listan las specs de módulo.
- **Componentes (Testing Library RN):** flujos de cada pantalla (alta de prenda, confirmar outfit, lavar).
- **Integración de datos:** repositorios contra SQLite en tests (mecanismo en el ADR de datos).
- **E2E en el móvil o emulador:** el ciclo de la mañana completo. La herramienta se elige en un ADR.
- **Rendimiento y accesibilidad:** comprobación manual guiada en el móvil real en cada hito, con los umbrales de «Criterios de éxito».
- TDD: el test que falla va antes del código (skill test-driven-development), y lo escribe un agente **distinto** del que programa.
- Umbrales, herramientas y dónde corre cada comprobación: [CONSTRAINTS.md](CONSTRAINTS.md) (aprobado el 2026-11-26).

## Diseño (fase previa a cualquier pantalla, dentro de `app-base`)

Entregables en `docs/diseno/`, aprobados por el dueño **antes** de programar la interfaz:
1. Identidad: referencias, paleta clara y oscura, tipografía propia, forma de tarjetas, iconos e ilustraciones.
2. Principios de movimiento: animaciones con muelles (*springs*), duraciones, qué se anima y qué no, y retroalimentación háptica.
3. Tokens en formato W3C Design Tokens (primera versión estable 2025.10: https://www.designtokens.org/).
4. Prototipo de las pantallas Hoy, Alta de prenda y Cesto (Figma).

Obligaciones de plataforma verificadas:
- *Edge-to-edge* forzado al apuntar a SDK 35+, así que hay que usar zonas seguras (https://developer.android.com/develop/ui/views/layout/edge-to-edge, https://docs.expo.dev/develop/user-interface/system-bars/).
- *Predictive back* activo por defecto (https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture).
- Tema claro y oscuro automático (https://docs.expo.dev/develop/user-interface/color-themes/).

Referencia de estilo: **Material 3 Expressive, SIN VERIFICAR** (su web no se pudo leer). Se consulta en la fase de diseño como inspiración, no como plantilla.

## Límites

- **Siempre:**
  - cumplir [CONSTRAINTS.md](CONSTRAINTS.md) y pasar `npm run check` antes de cada commit;
  - una rama por issue y PR hacia `main`;
  - estilos desde tokens;
  - mostrar la atribución de Open-Meteo junto a los datos de clima;
  - comprobar APIs en la documentación oficial;
  - textos y documentación en español.
- **Preguntar antes:**
  - añadir una dependencia que no esté en esta spec;
  - cambiar el esquema de datos sin migración;
  - tocar la CI;
  - cualquier cosa que no esté en la spec o el plan;
  - activar cualquier servicio externo nuevo.
- **Nunca:**
  - guardar claves o `.env` en el repo;
  - enviar datos fuera del móvil, salvo la consulta de clima (solo coordenadas) y Gemini si el usuario lo activa;
  - proponer una prenda sucia;
  - usar servicios de pago;
  - borrar o saltarse tests para llegar a verde;
  - usar la API *legacy* de expo-file-system.

## Criterios de éxito (V1 terminada)

1. Con 60 prendas reales, al abrir la app ya en memoria los 3 outfits se ven en **< 1 s**. En arranque en frío, **< 2,5 s**. *(Medido en el móvil de referencia, Redmi Note 15 Pro 5G.)*
2. El motor genera 3 outfits con 300 prendas en **< 100 ms** (test de rendimiento).
3. Del outfit visible a confirmado: **≤ 2 toques**. Deshacer está disponible durante el día.
4. Dar de alta una prenda con foto lleva **≤ 20 s** de media.
5. Las animaciones clave (regenerar, candado, confirmar → cesto, transiciones) van a **120 fps** (pantalla a 120 Hz) sin tirones visibles en el móvil de referencia (Redmi Note 15 Pro 5G); mínimo obligatorio, 60 fps. Medida exacta en `CONSTRAINTS.md` §3.
6. Ninguna propuesta incluye una prenda en el cesto (test con propiedades sobre el motor).
7. Sin conexión: la app abre, propone outfits (con el último clima guardado o avisando) y gestiona el cesto.
8. Exportar y luego importar en una instalación limpia recupera todas las prendas, fotos, usos, cesto y agenda.
9. Accesibilidad: objetivos táctiles de ≥ 48 dp (más estricto que los 24 px de WCAG 2.2), contraste de texto ≥ 4,5:1 en tema claro y oscuro, y etiquetas para lector de pantalla en todos los controles.
10. El dueño usa la app 2 semanas seguidas y el cesto coincide con la realidad.

## Fuera de alcance (V2 y siguientes)

| Qué | Por qué se aplaza |
|---|---|
| `reglas-estilo` | Necesita el motor V1 estable sobre el que añadir reglas |
| `valoraciones` | Necesita semanas de datos de uso para aprender |
| `estadisticas` | Se alimenta del historial que crea la V1 |
| `me-lo-compro` | Extra, depende del armario completo |
| `rescate-olvidadas` | Extra, depende del historial |
| `accesorios-fragancias` | Amplía el modelo de outfit |
| `maleta` | Extra para viajes |
| `calendario` | Pide permisos; la semana tipo cubre la V1 |
| `web-pc` | Más adelante; el stack lo permite |

## Decisiones del dueño (2026-11-26, cierran las preguntas abiertas)

1. **Gemini en V1 y se usa.** El dueño asume para su uso personal la cláusula del EEE de los términos («You may use only Paid Services when making API Clients available to users in the European Economic Area», https://aistudio.google.com/docs/terms) y que la capa gratuita usa el contenido para mejorar productos. En el código sigue **desactivado por defecto** y con la clave introducida por el usuario: ningún APK que se comparta (portfolio) lleva una clave.
2. **Código todo en inglés** (ver glosario). Specs, documentación y textos de la app en español.
3. **Recordatorio diario en V1** (ver `spec/SPEC-manana.md`).
4. **Atributo formalidad aprobado.**
5. **Quitar el fondo de las fotos en V1** (ver `spec/SPEC-etiquetado.md`).
6. **Móvil de referencia: Xiaomi Redmi Note 15 Pro 5G.** Todos los umbrales de rendimiento se miden en él. La versión de Android/HyperOS se anota en la primera demo.

## Riesgos conocidos

- **Batería agresiva en Xiaomi/HyperOS:** puede retrasar o anular las notificaciones programadas. **SIN VERIFICAR**; se comprueba en el móvil real y, si pasa, se guía al usuario para excluir la app del ahorro de batería.
- **ML Kit Subject Segmentation está en beta** y su modelo lo descarga Google Play services la primera vez. Hay alternativa (MediaPipe Interactive Segmenter) y la foto original se guarda siempre.

## Preguntas abiertas

Ninguna. Las nuevas dudas se anotan aquí.
