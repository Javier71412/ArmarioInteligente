# 0006. Fronteras entre módulos: eslint-plugin-boundaries + `no-restricted-imports` en `domain/`

- **Estado:** Aceptado
- **Fecha:** 2026-11-26

## Contexto
SPEC.md › Estructura: «un módulo solo importa el `index.ts` de los módulos de los que depende en el mapa. ESLint lo comprueba». Además, `domain/` es lógica pura **sin React ni Expo** (para Jest en Node y para la futura web). La comprobación debe correr dentro de `npx expo lint` / `npm run check` y fallar el PR. Dependencias permitidas (mapa → glosario):

| Módulo | Puede importar |
|---|---|
| `core`, `storage` | — |
| `wardrobe` | `storage`, `core` |
| `tagging` | `wardrobe`, `modules/tagging-native` |
| `laundry` | `wardrobe`, `storage`, `core` |
| `weather` | `storage` |
| `schedule` | `storage`, `core` |
| `outfit-engine` | `wardrobe`, `laundry`, `weather`, `schedule` |
| `backup` | `storage`, `wardrobe`, `laundry` |
| `today` | `outfit-engine`, `laundry`, `schedule`, `weather`, `core` |
| `app/` (rutas) | el `index.ts` de cualquier módulo |

## Opciones consideradas
### A) eslint-plugin-boundaries (v7)
- Pros: MIT, pensado justo para esto: se declaran «elementos» (`src/modules/*` con el nombre capturado) y una política `boundaries/dependencies` con `default: "disallow"` y la tabla de arriba como lista de permitidos. La regla también limita los archivos importables (`fileInternalPath` → solo `index.ts`) y los módulos externos. Lista ESLint 9 y TypeScript. Corre dentro de `npx expo lint`.
- Contras: dos dependencias de desarrollo nuevas (`eslint-plugin-boundaries`, `eslint-import-resolver-typescript`, que su guía exige en TS). Las reglas `entry-point` y `external` están obsoletas en v7: hay que usar solo `dependencies`.
### B) `no-restricted-imports` de ESLint (sin dependencias)
- Pros: regla del núcleo; con bloques `files` por carpeta (flat config) se pueden prohibir patrones (`group`/`regex`).
- Contras: trabaja sobre el texto del import, no sobre el archivo resuelto: `../../laundry/data/x` y el alias `@/modules/laundry/...` necesitan patrones distintos. Expresar la tabla exige ~10 bloques de *regex*, frágiles y difíciles de revisar.
### C) dependency-cruiser
- Pros: MIT; reglas `forbidden` con `from`/`to` por ruta; además dibuja el grafo (luce en el portfolio).
- Contras: CLI aparte, no es un plugin de ESLint: no sale en el editor y hay que añadir otro paso a `npm run check`.

## Decisión
**A) eslint-plugin-boundaries para el grafo entre módulos + B) `no-restricted-imports` solo para la pureza de `domain/`**:
- Elementos: `module` = `src/modules/<name>`, `native` = `modules/tagging-native`, `route` = `app/**`. Política `boundaries/dependencies` con `default: "disallow"`, la tabla de arriba y, entre módulos distintos, solo el archivo `index.ts`. Dentro del mismo módulo, libre.
- Bloque `files: ["src/modules/*/domain/**"]` con `no-restricted-imports` para `react`, `react-native`, `expo`, `expo-*`, `@expo/*`, `@shopify/*` y `../ui/*`, `../data/*`. Es la regla más simple y está verificada; no hace falta el selector externo de boundaries.
- `boundaries/no-unknown-files` activado para que un archivo nuevo fuera de la estructura avise.
- Un test de la propia configuración: un archivo «trampa» por cada regla en `eslint-fixtures/` que debe dar error.

## Consecuencias
- La tabla vive en `eslint.config.js`; cambiar el mapa de capacidades obliga a cambiarla (y a una spec delta).
- **Riesgo principal:** que la regla no resuelva bien los alias de TypeScript y deje pasar imports prohibidos en silencio. Mitigación: los archivos trampa en `npm run check` detectan un falso «verde».
- **SIN VERIFICAR:** que `eslint-config-expo` de SDK 58 use ESLint 9 (npm devolvió 403; la doc de Expo no lo dice); la sintaxis exacta de `fileInternalPath` en v7 (se fija al escribir la configuración, con la doc de jsboundaries.dev).
- El conflicto detectado en el mapa (faltaban `laundry` → `storage`, `core`; `today` → `core`; `backup` → `laundry`) quedó resuelto el 2026-11-26: el dueño aprobó añadir esas dependencias y la tabla de arriba ya las incluye.

## Fuentes (leídas el 2026-11-26)
- https://www.jsboundaries.dev/ (v7.4.5, ESLint 9, TypeScript) · https://www.jsboundaries.dev/docs/rules/ (`dependencies`, `no-unknown-files`; `entry-point`/`external` obsoletas; `fileInternalPath`, `checkAllOrigins`)
- https://www.jsboundaries.dev/docs/guides/typescript-support/ (`eslint-import-resolver-typescript`)
- https://github.com/javierbrea/eslint-plugin-boundaries (MIT)
- https://eslint.org/docs/latest/rules/no-restricted-imports (`patterns` con `group`/`regex`, `message`)
- https://eslint.org/docs/latest/use/configure/configuration-files (`files` por glob)
- https://github.com/sverweij/dependency-cruiser (MIT, `forbidden`, CLI)
- https://docs.expo.dev/guides/using-eslint/ (flat config desde SDK 53, `eslint-config-expo/flat`)
