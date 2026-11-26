# ArmarioInteligente

App de armario y estilista personal. Proyecto de portfolio, trabajado como en una empresa.

## Estado
Spec, 8 ADR y listón de calidad (`CONSTRAINTS.md`) **aprobados** (2026-11-26). Plan `tasks/plan.md` **aprobado** (2026-11-26): 7 hitos (H0-H6), milestones en GitHub e issues de H0 (#2-#15) y H1 (#16-#25). **H0 en curso:** hechas #2 Expo SDK 58 (PR #27), #3 Jest 30 + cobertura de `domain/` (#28), #4 spike `node:sqlite` en Jest: funciona (#29), #5 suelo de ESLint + Prettier (#30), #6 fronteras ADR 0006 (#31), #7 `scripts/floor-guard` (#34), #8 `npm run check` (#35, ~45 s), #9 CI en GitHub Actions: check + gitleaks + npm audit (#36) y #10 `main` protegida con *ruleset* (solo PR, 3 checks obligatorios, squash, sin force push ni borrado). También hechas #11 plantillas de issue y PR (#40), #15 docs montadas en el vault (#41) y #12 agentes del equipo en `.claude/agents/` con el hook `scripts/agent-guard.mjs` (#42; falta la prueba en seco en una sesión nueva para cerrar #12). Siguiente: **prueba en seco de los agentes** y *spikes* #13 → #14.
Las comprobaciones de configuración viven en `config-tests/` (cada una con su violación a propósito en `config-tests/fixtures/` o `eslint-fixtures/`).
Stack elegido: Expo SDK 58 + TypeScript (ver `SPEC.md` › Tech Stack).

## Fuentes de verdad (lee solo la parte que necesite la tarea)
- `SPEC.md` — visión global, stack, comandos, estructura, límites y criterios de éxito.
- `spec/capability-map.md` — módulos, dependencias y orden; `spec/SPEC-<id>.md` — la spec del módulo en el que trabajes (lee solo esa).
- `docs/adr/` — decisiones de arquitectura con su porqué (índice en `docs/adr/README.md`; lee solo los ADR que toque la tarea).
- `CONSTRAINTS.md` — listón de calidad. **Léelo antes de escribir código. No lo rebajes para que un cambio pase.**
- `tasks/plan.md` — hitos y tareas (índice); las issues de GitHub, cuando existan, llevan el estado de cada tarea.
- Si algo no está en la spec o el plan, no se programa: se propone para V1, V2 o descarte.

## Forma de trabajo
- SDD con las skills de `agent-skills`: definir → planificar → construir (TDD) → verificar → revisar → publicar.
- Comandos siempre con prefijo: `/agent-skills:spec`, `/agent-skills:plan`, `/agent-skills:build`, `/agent-skills:review`… (`/plan`, `/review`, `/ship` sin prefijo son otros).
- Método multiagente por función: la sesión principal coordina y no programa; los roles están en `.claude/agents/` (arquitecto, probador, dev-dominio, dev-interfaz, dev-nativo, revisor, revisor-seguridad, revisor-accesibilidad, integrador, disenador) con sus skills precargadas; el planificador es la sesión principal. Cada uno pasa por el hook `scripts/agent-guard.mjs` (zona de escritura y Bash solo para comprobar). Los agentes no se llaman entre sí (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` en `.claude/settings.json`).
- TDD con agentes separados: el probador escribe los tests desde la spec; el desarrollador no puede tocarlos (si cree que uno está mal, para y avisa). Ver `CONSTRAINTS.md` §1.
- `scripts/floor-guard.mjs` (`npm run floor-guard`) vigila el *diff* contra `origin/main`: commits `feat`/`fix` no tocan tests; borrar un test o quitar un `expect` exige una línea `Motivo-test: …` en el mensaje del commit; `CONSTRAINTS.md` solo se rebaja en su propio PR.
- El usuario es el dueño del producto: aprueba spec, plan, cada bloque visible y la publicación. Ante una decisión técnica, dale 2-3 opciones con pros, contras y una recomendación.

## Cuándo abrir una sesión nueva (el dueño lo pide siempre)
Al terminar cada turno, decide si toca sesión nueva. **Si toca, díselo al dueño y dale el prompt exacto** para pegar en la sesión nueva, en un bloque de código. Si no toca, no digas nada.
Toca sesión nueva cuando:
- se cierra una fase del SDD (spec → ADR → listón de calidad → plan → cada hito);
- se termina una issue o un bloque de issues aprobado y la siguiente es de otra función o módulo;
- se han creado o cambiado definiciones en `.claude/agents/`, skills o `settings.json` (solo se cargan al abrir sesión);
- la conversación es larga o arrastra trabajo ya cerrado.

Antes de proponerla, deja todo guardado: estado en `CLAUDE.md`, `tasks/` y la nota del vault, el árbol de git limpio o el commit pendiente anotado, y las preguntas abiertas escritas.
El prompt debe decir qué leer (solo lo necesario), en qué punto está el proyecto, qué se hace en esa sesión y qué comando o skill usar.

## Comandos
Ver `SPEC.md` › Comandos. Hoy existen: `npm run check` (floor-guard + typecheck + lint + Jest con cobertura; ~45 s medidos, presupuesto 90 s), `npm test`, `npm run test:coverage`, `npm run typecheck` (app + `config-tests`), `npm run lint` (`eslint .`: `npx expo lint` solo mira `src/`, `app/` y `components/`), `npm run floor-guard`, `npx expo start`.

## Git
- **Cuenta de GitHub del proyecto: `Javier71412`** (https://github.com/Javier71412), con el correo personal ya fijado en la identidad local. Commits, repo remoto, PR, issues y CI: todo con esta cuenta, nunca con la otra (`Javi7142`, que es la global del PC).
- Configuración local del repo (ya puesta): `user.name`, `user.email` y `credential.https://github.com.username = Javier71412`. No tocar la configuración global.
- `gh` tiene sesión propia de `Javier71412` (keyring; permisos `repo`, `workflow`, `delete_repo`, `read:org`, `gist`). No uses `GH_TOKEN`. Comprueba con `gh auth status` antes de operar en GitHub.
- Remoto: **https://github.com/Javier71412/ArmarioInteligente** (público), `origin`, rama `main`. `main` protegida (*ruleset* «main protegida»: solo por PR, checks `check`, `gitleaks` y `npm audit` en verde y al día con `main`, solo squash, sin force push ni borrado, sin excepciones ni para el dueño). Escaneo de secretos y *push protection* activos. Plantillas de issue (tarea, error, spike) y de PR en `.github/`. **En los PR, `Closes #N` (en inglés): «Cierra #N» no cierra la issue.**
- Pide confirmación antes de lo que no se puede deshacer: borrar un repo o una rama remota o `push --force`.
- **Fusionar PR en `main`: permiso permanente del dueño (2026-11-26).** Fusiona tú cada PR que abras, sin preguntar; cuando exista CI, en cuanto esté en verde (nunca con CI en rojo ni saltándote `CONSTRAINTS.md`). Squash merge y borra la rama.
- `main` solo recibe cambios por PR. Una rama por issue (`feat/12-descripcion`), Conventional Commits, commits pequeños.
- No hagas commit ni push sin que el usuario lo pida.

## Límites
- Nunca guardes claves API, tokens ni `.env` en el repo.
- Comprueba APIs y versiones en la documentación oficial (source-driven-development), no de memoria.
- Herramientas, cachés y descargas de desarrollo van al disco D: (C: está casi lleno).
- Si el contexto se contradice o falta un requisito, pregunta; no lo inventes.

## Idioma
Responde y documenta en español. El usuario es estudiante de 2.º DAW: explica las decisiones en sencillo.
