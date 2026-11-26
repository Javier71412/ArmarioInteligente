# Decisiones de arquitectura (ADR)

Cada ADR recoge **una** decisión con su porqué. No se borran: si una decisión cambia, se escribe un ADR nuevo que «sustituye a» el anterior.
Ciclo de vida: `Propuesto` → `Aceptado` → (`Sustituido por NNNN` o `Obsoleto`). Un ADR `Propuesto` espera al dueño o a un *spike*.

## Índice

| Nº | Decisión | Estado |
|---|---|---|
| [0001](0001-stack-expo-typescript.md) | Stack: Expo SDK 58 + TypeScript | Aceptado |
| [0002](0002-acceso-sqlite-sql-a-mano.md) | Acceso a SQLite: SQL a mano tras un puerto propio; tests con `node:sqlite` | Aceptado |
| [0003](0003-estado-hooks-propios-sobre-repositorios.md) | Estado: repositorios con caché en memoria + hooks con `useSyncExternalStore` | Aceptado |
| [0004](0004-formato-copia-zip-sqlite-fflate.md) | Copia: ZIP sin comprimir (fflate) con la base SQLite, las fotos y un manifiesto | Aceptado |
| [0005](0005-e2e-maestro.md) | Tests E2E en Android con Maestro | Aceptado |
| [0006](0006-fronteras-eslint-boundaries.md) | Fronteras: eslint-plugin-boundaries + `no-restricted-imports` en `domain/` | Aceptado |
| [0007](0007-procesado-fotos-y-pixeles.md) | Fotos: expo-image-manipulator; píxeles con Skia o el módulo nativo (decide el *spike*) | Propuesto |
| [0008](0008-modulo-nativo-tagging-native.md) | Módulo nativo local `modules/tagging-native` (Expo Modules API, Kotlin) | Aceptado |

## Plantilla

Archivo: `docs/adr/NNNN-titulo-en-kebab.md`. En español; los nombres de código, en inglés (glosario de `SPEC.md`).

```markdown
# NNNN. Título corto de la decisión

- **Estado:** Propuesto | Aceptado | Sustituido por NNNN | Obsoleto
- **Fecha:** AAAA-MM-DD

## Contexto
Qué problema hay, qué requisitos de la spec mandan (con enlace) y qué restricciones aplican (0 €, datos solo en el móvil, Android primero sin cerrar la web).

## Opciones consideradas
### A) …
- Pros: …
- Contras: …
### B) …
### C) … (opcional)

## Decisión
La opción elegida y el porqué en 2-4 frases. Si es «Propuesto», la pregunta para el dueño o lo que debe confirmar el spike.

## Consecuencias
- Qué se gana y qué se paga.
- **Riesgo principal** (abogado del diablo) y cómo se mitiga.
- Lo **SIN VERIFICAR**.

## Fuentes
- URL de la documentación oficial (fecha de lectura).
```
