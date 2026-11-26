# 0007. Procesado de fotos: redimensionar con expo-image-manipulator; píxeles con Skia o el módulo nativo

- **Estado:** Propuesto (la parte de píxeles espera al *spike*; el redimensionado queda decidido)
- **Fecha:** 2026-11-26

## Contexto
- [`almacen-local`](../../spec/SPEC-almacen-local.md): fotos en `Paths.document/…/<id>.jpg`, lado mayor ≤ 1600 px. La herramienta estaba **SIN VERIFICAR** porque la URL `…/sdk/image-manipulator/` dio 404. La página correcta es **`https://docs.expo.dev/versions/latest/sdk/imagemanipulator/`** (existe, SDK 58).
- [`etiquetado`](../../spec/SPEC-etiquetado.md): el algoritmo de colores (lógica pura) necesita los **píxeles RGBA** de la prenda sin fondo (o de la zona central). Quitar fondo + sugerencias locales en < 1,5 s; alta completa ≤ 20 s.

## Opciones consideradas
### Parte 1: redimensionar y comprimir (decidido)
**expo-image-manipulator** (Android, iOS, web, incluido en el SDK): `ImageManipulator.manipulate(uri).resize(…)` → `renderAsync()` → `saveAsync({ compress, format })`, con `format` `jpeg` | `png` | `webp`. `manipulateAsync` está obsoleto: no se usa. Alternativas descartadas: hacerlo en Kotlin (no sirve en web) o con Skia (más código para lo mismo).
- Original: JPEG, lado mayor 1600, `compress` ≈ 0,8 (se ajusta mirando fotos reales).
- `saveAsync` escribe en caché: después se mueve a `Paths.document` con `File.move` (expo-file-system nuevo).
- Recorte sin fondo: la spec dice PNG. Un PNG de 1600 px con fondo transparente puede pesar varias veces más que el JPEG (**SIN VERIFICAR**) y multiplica el tamaño de la copia ([0004](0004-formato-copia-zip-sqlite-fflate.md)). Se propone **WebP con transparencia**, si el spike confirma que conserva el canal alfa.

### Parte 2: leer píxeles para los colores
El contrato de dominio no depende de la fuente: `extractColors(pixels: Uint8Array /* RGBA */, width, height): ColorSuggestion[]`, sobre una imagen reducida (~64×64, unos 16 kB). Así el algoritmo se prueba en Jest con imágenes sintéticas.
#### A) React Native Skia (ya está en el stack)
- Pros: Android y web (CanvasKit) con el mismo código; decodifica la imagen (`Skia.Image.MakeImageFromEncoded` con `Skia.Data`) y la reduce dibujándola en una superficie pequeña.
- Contras: la doc de imágenes de Skia dio 404; **`readPixels` en `SkImage` está SIN VERIFICAR** (existe en la API de Skia en C++, no se ha visto en la de React Native). La decodificación es síncrona en el hilo de JS.
#### B) El módulo nativo `tagging-native` devuelve los píxeles
- Pros: el módulo ya tiene el `Bitmap` del recorte de ML Kit; reducirlo y devolver un `ByteArray` (→ `Uint8Array`, documentado en Expo Modules) es poco código y no bloquea JS.
- Contras: solo Android; la web necesitaría su camino (canvas `getImageData`). Si el módulo nativo falla, no hay colores (rompe «colores siempre activo»).
#### C) Decodificador JS puro (p. ej. jpeg-js / UPNG) sobre `File.bytes()`
- Pros: funciona igual en móvil, web y Jest.
- Contras: dependencias nuevas; decodificar 1600 px en Hermes puede tardar cientos de ms (**SIN VERIFICAR**).

## Decisión
**A) Skia** como primera opción, porque mantiene el camino a la web y no añade dependencias; **B)** como plan B si `readPixels` no existe o tarda > 200 ms. El *spike* (≤ 1 día) debe confirmar:
1. Que `SkImage.readPixels()` (o equivalente) devuelve RGBA desde un archivo local en SDK 58, y cuánto tarda con 1600 px reducido a 64×64.
2. Que `saveAsync({ format: 'webp' })` conserva la transparencia del recorte y cuánto pesa frente a PNG.
3. Que `resize` con solo un lado conserva la proporción (o calcular el otro lado a mano).
4. Tiempo total foto → recorte → colores en el Redmi Note 15 Pro 5G (< 1,5 s).

## Consecuencias
- **Riesgo principal:** que ninguna vía de píxeles funcione en Expo sin módulo nativo, y la web futura no tenga colores. Mitigación: el contrato `extractColors` es independiente de la fuente; en web se usará canvas.
- Sin cambiar de librería, la UI de alta muestra la foto en cuanto existe la original; recorte y colores llegan después (sin bloquear, como pide `etiquetado`).

## Fuentes (leídas el 2026-11-26)
- https://docs.expo.dev/versions/latest/sdk/imagemanipulator/ (`manipulate`, `useImageManipulator`, `renderAsync`, `saveAsync` con `compress`/`format`/`base64`; `manipulateAsync` obsoleto; sin acceso a píxeles)
- https://docs.expo.dev/versions/latest/sdk/skia/ (2.14.0; Android, iOS, web con CanvasKit)
- https://shopify.github.io/react-native-skia/docs/images (404 al leerla: `readPixels` SIN VERIFICAR)
- https://docs.expo.dev/modules/module-api/ (`ByteArray` ↔ `Uint8Array`)
- https://docs.expo.dev/versions/latest/sdk/filesystem/ (`File.move`, `File.bytes()`)
