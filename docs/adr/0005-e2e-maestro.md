# 0005. Tests E2E en Android: Maestro

- **Estado:** Aceptado
- **Fecha:** 2026-11-26

## Contexto
SPEC.md › Estrategia de tests pide un E2E en móvil o emulador del **ciclo de la mañana completo** (abrir → ver 3 outfits → candado/regenerar → confirmar → cesto). Condiciones: Expo SDK 58 / React Native 0.88 / New Architecture; el dueño desarrolla en **Windows**; coste 0; CI en GitHub Actions. La build es local con `npx expo run:android` (sin EAS de pago).

## Opciones consideradas
### A) Maestro
- Pros: la doc de Expo lo recomienda para E2E (en la guía de tests unitarios y en la de EAS Workflows). Flujos en YAML que leen la pantalla como un usuario (texto, `testID`/accesibilidad), sin tocar el código de la app ni depender de la versión de React Native. CLI open source (Apache-2.0). Se instala **nativo en Windows** (zip + `PATH`; WSL solo «si es estrictamente necesario»). Requiere Java 17+, que ya pide Android.
- Contras: la QuickStart dice que soporta las API de Android **29, 30, 31, 33 y 34**, con 35/36 «planificadas para el Q2 2026». El Redmi Note 15 Pro 5G llevará Android 15/16 (API 35/36): soporte actual **SIN VERIFICAR**. Menos control fino que una herramienta *gray-box* (no espera a que JS esté ocioso).
### B) Detox
- Pros: *gray-box*: se sincroniza con el hilo de JS, tests en TypeScript con Jest.
- Contras: soporta oficialmente RN **0.77-0.84**; RN 0.88 no está en la lista. Para Expo: «There is no special support for Expo projects in Detox». Su guía de entorno está orientada a macOS. Requiere tocar la build nativa.
### C) Solo pruebas manuales guiadas
- Pros: coste 0 de herramientas.
- Contras: no cumple la estrategia de tests ni protege el ciclo de la mañana ante regresiones.

## Decisión
**A) Maestro (CLI)**, sin Maestro Cloud ni EAS Workflows (ambos de pago o fuera del 0 €; no se usan).
- Flujos en `e2e/` (`e2e/morning-cycle.yaml`, …). Los controles llevan `testID` estables en inglés y etiquetas de accesibilidad (que ya exige el criterio 9).
- **Local (Windows):** `npx expo run:android` en el emulador → `maestro test e2e/`.
- **CI (GitHub Actions):** `ubuntu-latest` con KVM + `reactivecircus/android-emulator-runner@v2` (Apache-2.0), imagen **API 34** (la más alta soportada según la doc de Maestro), build de Gradle y `maestro test`. En repos públicos los runners estándar son gratis; en privado hay 12 $/mes de cómputo incluido y se bloquea al agotarse, nunca se cobra sin método de pago.
- Datos de prueba: un *seed* de prendas que se carga en la build de E2E (no en la de release).

## Consecuencias
- Los E2E no sustituyen a los unitarios: cubren 2-4 flujos críticos (mañana, alta de prenda sin IA, lavar, exportar/importar).
- El emulador de CI no tiene modelos de ML Kit ni cámara: el alta E2E usa una foto de la galería del emulador y acepta «sin sugerencia».
- **Riesgo principal:** flujos inestables (*flaky*) por animaciones y por un emulador lento en CI. Mitigación: Reanimated respeta «reducir movimiento» en la build de E2E (**SIN VERIFICAR** el mecanismo exacto) y esperas por elemento visible, nunca por tiempo.
- **SIN VERIFICAR:** soporte de Maestro para API 35/36 en el móvil real; el tiempo de un E2E en CI (decide si corre en cada PR o solo en `main`). Tocar la CI exige preguntar antes (SPEC.md › Límites).

## Fuentes (leídas el 2026-11-26)
- https://docs.expo.dev/develop/unit-testing/ (recomienda E2E con Maestro)
- https://docs.expo.dev/eas/workflows/examples/e2e-tests/ (Maestro con Expo; ejecución local con la CLI)
- https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli (Windows nativo, WSL desaconsejado, Java 17+)
- https://docs.maestro.dev/get-started/quickstart.md (API 29, 30, 31, 33, 34; 35/36 previstas Q2 2026)
- https://github.com/mobile-dev-inc/maestro (Apache-2.0; Android, iOS y web)
- https://wix.github.io/Detox/docs/introduction/environment-setup (RN 0.77-0.84; sin soporte específico de Expo)
- https://github.com/ReactiveCircus/android-emulator-runner (Ubuntu + KVM, `@v2`, Apache-2.0)
- https://docs.github.com/en/billing/concepts/product-billing/github-actions (gratis en repos públicos)
