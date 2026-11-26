# 0001. Stack: Expo SDK 58 + TypeScript

- **Estado:** Aceptado (decisión del dueño, 2026-11-26)
- **Fecha:** 2026-11-26

## Contexto
ArmarioInteligente es una app Android personal, muy pulida, a 0 €, con los datos solo en el móvil y sin servidor. Debe poder ir a la web/PC más adelante (`web-pc`, V2), etiquetar fotos en el dispositivo y desarrollarse en Windows. El análisis completo, con fuentes, está en [spec/stack-comparativa.md](../../spec/stack-comparativa.md).

## Opciones consideradas
### A) Expo (React Native + TypeScript)
- Pros: componentes nativos; web oficial (`npx expo export --platform web`); `expo-sqlite` oficial en Android y web; TypeScript, cercano a lo que el dueño ya sabe (DAW); mucho valor de portfolio; `npx expo run:android` compila en Windows sin cuenta de Expo.
- Contras: la IA de fotos en el móvil exige un módulo nativo propio (Kotlin) con MediaPipe y ML Kit; `eas build --local` no funciona en Windows.
### B) Flutter (Dart)
- Pros: el acabado visual más alto; `drift` muy sólido; APK local con `flutter build apk`.
- Contras: lenguaje nuevo (Dart); web por canvas, más pesada; plugins de ML Kit comunitarios.
### C) Capacitor + web (TypeScript)
- Pros: el mejor camino a la web (ya es web); mismo código de MediaPipe en móvil y web.
- Contras: se nota menos nativa; `localStorage`/IndexedDB «transient» en móvil y SQLite por plugin comunitario.

Descartados: Kotlin + Compose (pasar a la web sería rehacer la app) y combinar Expo con Flutter (dos motores y dos lenguajes; se pierde la web compartida).

## Decisión
**A) Expo SDK 58 (React Native 0.88, React 19.3, New Architecture) + TypeScript `strict`.** Es el mejor equilibrio entre app nativa pulida en Android, camino oficial a la web y un lenguaje que el dueño domina. El acabado se consigue con Reanimated 4, Gesture Handler, Skia, expo-haptics y una fase de diseño propia (SPEC.md › Diseño). La pieza débil, la IA de fotos, queda aislada tras `AttributeSuggester` y el módulo nativo de [0008](0008-modulo-nativo-tagging-native.md).

## Consecuencias
- Todo el código de la app es TypeScript; solo `modules/tagging-native` lleva Kotlin.
- Toda librería nueva debe declarar compatibilidad con la New Architecture (Reanimated 4 la exige).
- La build se hace en local en Windows con `npx expo run:android` (Android Studio y SDK en `D:\DevTools`). El APK de release sigue **SIN VERIFICAR** (tarea de CI/release).
- **Riesgo principal:** el módulo nativo Kotlin es la parte con menos experiencia del dueño y la que más puede romper la build en Windows. Mitigación: módulo pequeño, contrato estrecho y simulado en Jest ([0008](0008-modulo-nativo-tagging-native.md)); si falla, la app sigue funcionando con colores y botones rápidos.

## Fuentes
Todas leídas el 2026-11-26 y recogidas en [spec/stack-comparativa.md](../../spec/stack-comparativa.md):
- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/workflow/web/
- https://docs.expo.dev/versions/latest/sdk/sqlite/
- https://docs.expo.dev/develop/development-builds/introduction/ · https://docs.expo.dev/build-reference/local-builds/
- https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started
- https://docs.expo.dev/modules/overview/ («Expo Modules all support the New Architecture»)
