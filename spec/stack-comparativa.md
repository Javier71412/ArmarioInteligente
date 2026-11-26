# Comparativa de stack — ArmarioInteligente V1

Estado: **decidido: A) Expo + fase de diseño propia** (2026-11-26, el usuario: «lo que tú recomiendes», priorizando usabilidad, fluidez y diseño). Pasa a ADR en `docs/adr/` con la spec aprobada.

Requisitos que mandan: Android primero · muy pulida · 0 € · datos solo en el móvil, sin servidor · web/PC posible más adelante · etiquetado de fotos en el dispositivo (+ Gemini gratuito opcional) · se desarrolla en Windows.

## Hechos verificados (documentación oficial, leída el 2026-11-26)

| Hecho | Fuente |
|---|---|
| Expo SDK 58: React Native 0.88, React 19.3, Android 7+ | https://docs.expo.dev/versions/latest/ |
| `expo-sqlite` funciona en Android y web; en web necesita wasm en Metro y cabeceras COOP/COEP | https://docs.expo.dev/versions/latest/sdk/sqlite/ |
| Expo trata la web como destino de primera clase (`npx expo export --platform web`) | https://docs.expo.dev/workflow/web/ |
| `npx expo run:android` compila en Windows sin cuenta de Expo; `eas build --local` no se admite en Windows | https://docs.expo.dev/develop/development-builds/introduction/ · https://docs.expo.dev/build-reference/local-builds/ |
| Flutter 3.50 (11-11-2026); la web es un destino más (CanvasKit/Skwasm, dart2wasm) | https://docs.flutter.dev/release/whats-new · https://docs.flutter.dev/platform-integration/web |
| `flutter build apk` genera el APK en local, sin servicio de pago | https://docs.flutter.dev/deployment/android |
| `drift` 2.35 (SQLite) funciona en Android, iOS, escritorio y web | https://pub.dev/packages/drift |
| `google_mlkit_image_labeling` es comunitario («not sponsored or maintained by Google»), solo Android/iOS | https://pub.dev/packages/google_mlkit_image_labeling |
| Capacitor 8: Android 7+ (WebView Chrome 60+); `localStorage`/IndexedDB son «transient» en móvil; recomienda SQLite (plugin comunitario) | https://capacitorjs.com/docs/android · https://capacitorjs.com/docs/guides/storage |
| ML Kit Image Labeling base: 400+ etiquetas; incluye Jeans, Shorts, Dress, Jacket, Shoe, Sneakers…; **no** incluye Shirt, T-shirt, Trousers, Coat, Sweater, Skirt, Boot | https://developers.google.com/ml-kit/vision/image-labeling/label-map |
| ML Kit admite modelos propios `.tflite` | https://developers.google.com/ml-kit/vision/image-labeling/custom-models/android |
| MediaPipe Image Classifier: Android, web (`@mediapipe/tasks-vision`), iOS, Python, Flutter; modelo por defecto EfficientNet-Lite0 (1000 clases ImageNet) | https://developers.google.com/edge/mediapipe/solutions/vision/image_classifier |
| Gemini: hay capa gratuita; en ella el contenido se usa para mejorar productos y puede haber revisión humana | https://aistudio.google.com/docs/pricing · https://aistudio.google.com/docs/terms |
| Gemini, términos: «You may use only Paid Services when making API Clients available to users in the European Economic Area» | https://aistudio.google.com/docs/terms |
| Gemini: no incrustar claves en apps web o móviles; para producción, proxy en servidor | https://aistudio.google.com/docs/api-key |
| Gemini acepta imágenes inline en base64 (máx. 20 MB por petición) | https://aistudio.google.com/docs/image-understanding |
| Open-Meteo: gratis sin clave para uso no comercial (<10 000 llamadas/día); previsión horaria (`temperature_2m`, `apparent_temperature`, `precipitation_probability`, `wind_speed_10m`); CC BY 4.0, obliga a atribuir junto a los datos | https://open-meteo.com/en/terms · https://open-meteo.com/en/docs · https://open-meteo.com/en/licence |

**SIN VERIFICAR:** que las 1000 clases de ImageNet incluyan prendas útiles (jersey/T-shirt, cardigan, trench coat, miniskirt, running shoe…). Es de memoria; se comprueba con fotos reales en un pico técnico (*spike*) antes de comprometerlo.

## Consecuencias para la spec

1. **El tipo por IA en el móvil será una sugerencia modesta.** El modelo base de ML Kit no distingue camiseta, camisa, pantalón ni abrigo. MediaPipe (ImageNet) quizá algo más. Los botones rápidos son el camino principal; la IA solo preselecciona.
2. **Colores:** algoritmo propio sobre los píxeles (lógica pura, sirve igual en móvil y web).
3. **Gemini gratuito, con dudas:** cláusula del EEE + aviso de claves en cliente. Para uso estrictamente personal con tu propia clave probablemente encaja, pero no es un uso claro. Queda como **opción desactivada por defecto**, y fuera de cualquier APK que se distribuya. **Decidido:** el dueño lo usa (ver SPEC.md › Decisiones 1).

## Opciones

| | A) Expo (React Native + TypeScript) | B) Flutter (Dart) | C) Capacitor + web (TypeScript) |
|---|---|---|---|
| Se siente app nativa | Sí (componentes nativos) | Sí (motor propio, muy fluido) | Menos (es una web dentro del móvil) |
| Acabado «muy atractiva» | Alto | **El más alto** (animaciones) | Medio-alto |
| Web más adelante | **Sí, oficial** (react-native-web, expo-sqlite web) | Sí (canvas, pesa más) | **Lo mejor** (ya es web) |
| Datos locales | expo-sqlite oficial | drift (muy sólido) | Plugin SQLite comunitario |
| IA de fotos en el móvil | Requiere un módulo nativo propio (Expo Modules) envolviendo MediaPipe; en web, `@mediapipe/tasks-vision` | Plugins comunitarios (ML Kit, MediaPipe) | `@mediapipe/tasks-vision` en el WebView, mismo código que la web |
| Compilar en Windows, 0 € | Sí (`npx expo run:android` + Android Studio) | Sí (`flutter build apk`) | Sí (Android Studio) |
| Lo que ya sabes (DAW) | JS/TS + React: cercano | Dart: lenguaje nuevo | JS/TS + web: lo más cercano |
| Valor de portfolio | **Muy alto** (React/RN muy pedido) | Alto | Medio |

Descartado: **Kotlin nativo + Compose**. Es la mejor integración con Android, pero pasar a la web más adelante sería casi rehacer la app.

## Recomendación: A) Expo

Equilibra lo que pides: app nativa y pulida en Android, la web como camino oficial para después, datos con SQLite oficial y TypeScript, que te suena de DAW y vale mucho en portfolio. Su punto débil es la IA de fotos en el móvil: un módulo nativo pequeño para MediaPipe. Como esa IA solo sugiere y el módulo está aislado tras `SugeridorDeAtributos`, el riesgo es acotado. Además ese módulo luce en el portfolio.

B) Flutter es la alternativa si priorizas el máximo acabado visual por encima de la web y de usar un lenguaje que ya conoces.

## ¿Combinar A y B, o Expo con acabado de primera? (pregunta del usuario, 2026-11-26)

**Combinar A+B en una app:** técnicamente posible (Flutter se puede incrustar como módulo en una app Android: https://docs.flutter.dev/add-to-app), pero no compensa: dos lenguajes, dos motores, un APK más pesado, el doble de herramientas y se pierde el camino a la web compartida. Descartado.

**Expo con acabado alto y fluido: sí.** Piezas verificadas:

| Pieza | Para qué | Fuente |
|---|---|---|
| Reanimated 4 | Animaciones en el hilo de interfaz, «up to 120 fps» en Android y web; requiere la *New Architecture* y `react-native-worklets` | https://docs.swmansion.com/react-native-reanimated/ · https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started |
| Gesture Handler | Gestos nativos (deslizar para descartar, arrastrar al cesto), integrado con Reanimated | (citado desde la página de Reanimated; la doc propia no cargó: **verificar**) |
| expo-haptics | Vibración táctil al confirmar o fijar el candado (Android, iOS, web) | https://docs.expo.dev/versions/latest/sdk/haptics/ |
| expo-blur | Fondos desenfocados, estilo «cristal» | https://docs.expo.dev/versions/latest/sdk/blur-view/ |
| expo-image | Carga rápida de fotos con caché y transiciones | https://docs.expo.dev/versions/latest/sdk/image/ |
| expo-font | Tipografías propias, también en web | https://docs.expo.dev/versions/latest/sdk/font/ |
| React Native Skia | Dibujo propio, sombreadores (*shaders*), efectos | **SIN VERIFICAR** (la página de instalación dio 404): se comprueba antes del ADR |

Lo que de verdad hace una app original no es el framework, sino **un sistema de diseño propio decidido antes del código**: identidad (paleta, tipografía, iconos o ilustraciones), principios de movimiento y prototipo de las pantallas clave. Se añade como fase de diseño en `app-base`, con presupuestos de rendimiento como criterios de éxito.
