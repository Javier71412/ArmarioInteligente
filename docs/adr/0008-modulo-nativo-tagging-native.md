# 0008. Módulo nativo local `modules/tagging-native` (Expo Modules API, Kotlin)

- **Estado:** Aceptado
- **Fecha:** 2026-11-26

## Contexto
[`etiquetado`](../../spec/SPEC-etiquetado.md) necesita en el móvil, sin red: **ML Kit Subject Segmentation** (quitar el fondo, beta, API 24+) y **MediaPipe Image Classifier** (tipo de prenda). Ninguno tiene módulo oficial de Expo. Condiciones: New Architecture; compilar en Windows con `npx expo run:android` (sin EAS); el resto de la app se prueba en Jest (Node), donde no hay código nativo; fallos silenciosos («sugerencia parcial o vacía»); no bloquear el hilo de la UI; la web (V2) no debe romperse al importar el módulo.

## Opciones consideradas
### A) Módulo local con Expo Modules API (Kotlin) en `modules/tagging-native`
- Pros: «Expo Modules all support the New Architecture» (JSI, sin *bridge*). Se crea con `npx create-expo-module@latest --local` y vive en el repo. DSL Kotlin con `AsyncFunction` (Promise o `Coroutine`), `ByteArray` ↔ `Uint8Array` y `Record` para objetos tipados. Mocks para Jest documentados (carpeta `mocks/` que `jest-expo` usa sola).
- Contras: el dueño no ha programado Kotlin; cada cambio nativo exige recompilar.
### B) Turbo Module de React Native (C++/Kotlin con Codegen)
- Pros: lo recomienda la doc de Expo solo si se va a usar C++.
- Contras: más configuración (Codegen, especificación) sin ganar nada aquí.
### C) Librerías comunitarias de terceros para ML Kit/MediaPipe en RN
- No se han encontrado oficiales; compatibilidad con SDK 58/New Architecture **SIN VERIFICAR**. Se descartan por riesgo de abandono.

## Decisión
**A) Expo Modules API en Kotlin.** Contrato estrecho, todo en inglés, exportado solo por `modules/tagging-native/index.ts` y usado solo por `src/modules/tagging` ([0006](0006-fronteras-eslint-boundaries.md)):
```ts
type SegmentResult =
  | { kind: 'ok'; cutoutUri: string; width: number; height: number }
  | { kind: 'unavailable'; reason: 'model-downloading' | 'unsupported-platform' }
  | { kind: 'failed'; message: string };
segmentSubject(photoUri: string, outputUri: string): Promise<SegmentResult>;
classifyImage(photoUri: string, maxResults: number): Promise<{ label: string; score: number }[]>;
samplePixels(uri: string, maxSide: number): Promise<{ width: number; height: number; rgba: Uint8Array }>; // solo si 0007 elige B
```
- Errores como **valores**, no excepciones: el envoltorio TS captura lo que lance Kotlin y devuelve `failed`. Las traducciones etiqueta → `GarmentType` y el umbral 0,6 están en `tagging/domain` (TS puro), no en Kotlin.
- Kotlin: `AsyncFunction` con `Promise` y los *listeners* `addOnSuccessListener`/`addOnFailureListener` de ML Kit (sin dependencias de corrutinas extra). Dependencias Gradle del módulo: `com.google.android.gms:play-services-mlkit-subject-segmentation:16.0.0-beta1` y `com.google.mediapipe:tasks-vision` con **versión fija** (la doc solo muestra `latest.release`). El modelo `.tflite` va en los *assets* del módulo; el `<meta-data>` de ML Kit (`subject_segment`), en el `AndroidManifest.xml` del módulo.
- Web: `index.web.ts` devuelve siempre `unavailable` / lista vacía.

**Compilar en Windows:** JDK 17 (la doc de RN avisa de problemas con versiones mayores), Android SDK Platform 35, Build-Tools 36.0.0, `ANDROID_HOME` y `GRADLE_USER_HOME` en `D:\DevTools`. `npx expo run:android` genera `android/` (*prebuild*), enlaza el módulo y compila. `android/` no se versiona: la configuración nativa vive en el módulo.

**Simular en Jest:** (1) `tagging` recibe el módulo por inyección (`TaggingNativePort`), y los tests usan *fakes* que devuelven `ok`/`failed`/`unavailable`; (2) además, `modules/tagging-native/mocks/TaggingNative.ts` para que importar el paquete en tests de UI no rompa (mecanismo documentado de `jest-expo`).

## Consecuencias
- Kotlin queda en un solo sitio y pequeño; la lógica que más cambia está en TS y se prueba en Node.
- **Riesgo principal:** que la build falle en Windows por cosas fuera de nuestro código (rutas largas de Gradle/CMake, versión de JDK, caché en C:). Mitigación: repo en ruta corta (`D:\proyectos\…`), JDK 17 fijado y un *spike* «hola mundo» del módulo **antes** de integrar ML Kit.
- **SIN VERIFICAR:** que `npx expo run:android` enlace automáticamente los módulos de `modules/` (la guía de módulos locales solo describe abrir `android/` en Android Studio); que el `<meta-data>` del manifiesto del módulo se fusione en el de la app; la versión estable actual de `tasks-vision` y el tamaño del modelo; que `create-expo-module --local` genere el archivo `.web.ts`; el comportamiento real de ML Kit (beta) en HyperOS.
- El generador automático de mocks (`expo-modules-test-core`) parte de Swift y no cubre Kotlin: los mocks se escriben a mano.

## Fuentes (leídas el 2026-11-26)
- https://docs.expo.dev/modules/overview/ (New Architecture, JSI; cuándo Turbo Modules)
- https://docs.expo.dev/modules/get-started/ (`npx create-expo-module@latest --local`, carpeta `modules/`, Kotlin)
- https://docs.expo.dev/modules/module-api/ (`AsyncFunction`, `Promise`/`Coroutine`, `ByteArray` ↔ `Uint8Array`, `Record`, `Events`)
- https://docs.expo.dev/modules/mocking/ (carpeta `mocks`, `jest-expo`; generador solo desde Swift)
- https://developers.google.com/ml-kit/vision/subject-segmentation/android (dependencia 16.0.0-beta1, API 24+, `meta-data`, `enableForegroundBitmap`)
- https://developers.google.com/edge/mediapipe/solutions/vision/image_classifier/android (`tasks-vision`, `setModelAssetPath`, modo `IMAGE`)
- https://reactnative.dev/docs/set-up-your-environment?os=windows&platform=android (JDK 17, SDK 35, Build-Tools 36.0.0, `ANDROID_HOME`)
- https://docs.expo.dev/develop/development-builds/introduction/ (`npx expo run:android` en Windows, vía spec/stack-comparativa.md)
