# eslint-fixtures

Archivos trampa: cada uno viola **una** regla del suelo de `CONSTRAINTS.md` §0 y debe dar error.
Los que empiezan por `clean` o `*-with-description` son el caso limpio y deben pasar.
Los comprueba `config-tests/eslint-floor.test.ts`. `npx expo lint` los ignora (están en `ignores`).
