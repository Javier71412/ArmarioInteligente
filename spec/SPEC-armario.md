# Spec de módulo: `armario` — V1

Depende de: `almacen-local`, `app-base` · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
Tener el armario completo en el móvil: dar de alta prendas con foto en segundos, verlas, buscarlas y corregirlas. Es el dueño del vocabulario de prendas.

## Vocabulario (catálogo cerrado V1)
- **Categoría:** `superior` · `inferior` · `pieza-unica` (vestido o mono) · `calzado` · `abrigo` (capa exterior).
- **Tipo** (dentro de la categoría): por ejemplo, camiseta, camisa, polo, jersey, sudadera (superior); vaquero, pantalón, chino, falda, pantalón corto (inferior); zapatilla, zapato, bota, sandalia (calzado); chaqueta, cazadora, abrigo, plumas, chubasquero (abrigo). Lista final en el plan.
- **Colores:** de 1 a 3, de una paleta con nombre (negro, blanco, gris, beige, marino, azul, verde, rojo, …); el primero es el dominante.
- **Corte:** según la categoría (ajustado, regular, holgado; en inferiores también recto o pitillo).
- **Abrigo:** nivel de 1 (muy fresco) a 5 (muy abrigado).
- **Formalidad:** `informal` · `arreglado` · `formal` (aprobado).
- **Delicada:** sí o no.
- **Nombre** opcional («camisa de lino azul»).

## Requisitos
- **Alta:** cámara (expo-camera) o galería (expo-image-picker) → foto guardada → **fondo quitado** (`etiquetado`; la original se conserva y se puede recuperar) → se piden sugerencias a `SugeridorDeAtributos` (hasta 3 s) → formulario con chips **ya preseleccionados** → guardar.
  - Si la sugerencia falla o tarda, el formulario aparece igual, sin preselección y sin bloquear.
- **Alta en serie:** «guardar y añadir otra» para meter muchas prendas seguidas.
- **Lista:** cuadrícula de fotos con filtros por categoría, color, estado (limpia o en cesto) y formalidad, y búsqueda por nombre.
- **Ficha:** foto grande, atributos editables en un toque, usos totales y fecha del último uso (datos de `lavanderia`).
- **Borrar** con confirmación. Si la prenda está en el historial, el historial conserva una referencia de «prenda eliminada».
- Define la interfaz `SugeridorDeAtributos`, que implementa `etiquetado`:

```ts
export interface SugeridorDeAtributos {
  sugerir(foto: RutaFoto, señal: AbortSignal): Promise<SugerenciaAtributos>; // campos parciales + confianza 0..1
}
```

## Interfaz pública
Tipos (`Prenda`, `Categoria`, …), `repositorioPrendas` (listar, obtener, guardar, borrar, observar cambios), `SugeridorDeAtributos` y pantallas Armario, Ficha y Alta.

## Criterios de aceptación
- Alta completa en ≤ 20 s con la sugerencia funcionando, y en ≤ 30 s sin ella.
- Si el sugeridor lanza un error o pasan 3 s, el alta sigue (test).
- Filtrar 300 prendas responde en < 100 ms.
- Ninguna prenda se guarda sin categoría, tipo y al menos un color (validación con test).

## Fuera de alcance
Varias fotos por prenda, etiquetas libres, marcas y precios.
