# Spec de módulo: `etiquetado` — V1

Depende de: `armario` (vocabulario e interfaz `SugeridorDeAtributos`) · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
Que el alta sea casi automática a coste 0: sugerir colores, categoría y tipo a partir de la foto. El usuario siempre tiene la última palabra.

## Quitar el fondo (V1, antes de sugerir)
- **ML Kit Subject Segmentation** en el móvil, dentro de `modules/tagging-native`: separa la prenda del fondo y devuelve una máscara y un mapa de bits del primer plano.
  - Está en beta y su modelo lo descarga Google Play services. Se pide la descarga al instalar (`com.google.mlkit.vision.DEPENDENCIES = subject_segment`).
  - Tarda unos 200 ms en un Pixel 7 Pro (https://developers.google.com/ml-kit/vision/subject-segmentation).
- **Alternativa:** si falla o el resultado es malo, «toca la prenda» con MediaPipe Interactive Segmenter, que también sirve para la futura web (https://developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter).
- El resultado se guarda como **WebP con transparencia** junto a la original (PNG si el *spike* del [ADR 0007](../docs/adr/0007-procesado-fotos-y-pixeles.md) muestra que WebP pierde la transparencia). El usuario puede volver a la original con un toque.
- Los colores se calculan **sobre la prenda sin fondo**, lo que da mucha más precisión.
- Si no hay modelo o falla, el alta sigue con la foto original. Sin bloqueos.

## Proveedores (encadenados, cada uno aporta lo que sabe)
1. **Colores (siempre activo, sin red):** algoritmo propio sobre los píxeles de la prenda sin fondo (o de la zona central si no se pudo quitar). Agrupa colores (k-means o similar) y los asigna a la paleta con nombre de `armario`. Es lógica pura y testeable.
   - **SIN VERIFICAR:** cómo obtener los píxeles en Expo (candidato: Skia). Se resuelve en un *spike*.
2. **Tipo en el móvil (sin red):** MediaPipe Image Classifier en un módulo nativo local (`modules/tagging-native`, Kotlin, Expo Modules). Las clases del modelo se traducen a categoría y tipo de `armario`.
   - Solo preselecciona si la confianza ≥ 0,6.
   - **SIN VERIFICAR** que EfficientNet-Lite0 (1000 clases ImageNet) reconozca bien la ropa. Un *spike* con 20 fotos reales decide si compensa. Si no compensa, el proveedor se desactiva y el alta queda con colores y botones.
3. **Gemini (opcional, desactivado por defecto):** solo si el usuario lo activa en Ajustes y pega su propia clave.
   - La clave se guarda en expo-secure-store.
   - Antes de activarlo, se muestra el aviso de los términos: capa gratuita, uso del contenido para mejorar productos, cláusula del EEE.
   - Envía la foto reducida y pide JSON con los campos del vocabulario. Hasta 10 s.
   - **Decisión del dueño:** se usa en su móvil y asume los términos (SPEC.md › Decisiones 1).

## Requisitos
- Los proveedores se ejecutan en paralelo. Si dos dan un mismo campo, gana el de mayor confianza.
- Cualquier fallo (sin modelo, sin red, cupo agotado, JSON inválido) es silencioso y devuelve una sugerencia parcial o vacía. No hay pantallas de error en el alta.
- Ningún proveedor bloquea el hilo de la interfaz.
- Nada sale del móvil salvo con Gemini activado.

## Criterios de aceptación
- Test del algoritmo de colores con imágenes de prueba (camiseta roja → «rojo» como dominante; vaquero → «azul» o «marino»).
- Test del encadenado: un proveedor que lanza un error no impide los demás, y gana el de mayor confianza.
- Quitar el fondo y dar las sugerencias locales en < 1,5 s en el móvil de referencia (Redmi Note 15 Pro 5G).
- Test: si la segmentación falla, el alta continúa con la original y los colores se calculan sobre la zona central.
- Con Gemini desactivado, ninguna petición de red sale del módulo (test con fetch simulado).

## Fuera de alcance
Entrenar un modelo propio (posible V2 si el *spike* sale mal y compensa), y detectar el corte por IA.
