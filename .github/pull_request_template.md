<!-- Título en Conventional Commits: feat(módulo): …, fix(…), test(…), chore(…), docs(…), ci(…) -->

Closes #<!-- número de la issue. La palabra tiene que ser en inglés (Closes, Fixes o Resolves): «Cierra» no cierra la issue. -->

## Qué

-

## Cómo se ha verificado

<!-- Criterios de la issue uno a uno. Si se verifica una API, fuente oficial y fecha. -->

- [ ]

## Lista del listón (`CONSTRAINTS.md`)

- [ ] **TDD con agentes separados** (§1): si es lógica de la app, el commit `test(...)` del probador va antes que el `feat(...)`/`fix(...)` del desarrollador, y el desarrollador no ha tocado ningún test.
- [ ] **El listón no se rebaja:** sin `@ts-ignore`, `any`, `eslint-disable`, tests saltados, `expect` quitados ni stubs. Si `CONSTRAINTS.md` cambia, va en su propio PR `chore(constraints)` con la aprobación del dueño.
- [ ] Borrar un test o quitar un `expect` lleva `Motivo-test: …` en el mensaje del commit.
- [ ] `npm run check` en verde en local; la CI (check, gitleaks, npm audit) en verde.
- [ ] Nada de claves, tokens ni `.env` (§4).
- [ ] Si hay interfaz: roles y nombres accesibles, ≥ 48 dp y un botón para cada gesto (revisor de accesibilidad).
- [ ] Docs, ADR o `tasks/plan.md` actualizados si cambia una decisión.

## Revisión

<!-- Quién revisa (un agente distinto al probador y al desarrollador) y qué ha encontrado. -->
