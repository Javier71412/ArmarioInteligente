# Mapa de capacidades: ArmarioInteligente

Estado: **aprobado** (2026-11-26; corregidas tres dependencias que faltaban, a propuesta de los ADR 0004 y 0006 y aprobado por el dueño el mismo día). Los id de módulo son fijos: no se renombran.

## V1

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `app-base` | Navegación, sistema visual (tema, componentes), ajustes, idioma | — |
| `almacen-local` | Persistencia en el dispositivo (datos y fotos), migraciones de esquema | — |
| `armario` | Prendas: alta con foto, ficha, edición, borrado, búsqueda y filtros. Dueño del vocabulario (tipo, corte, abrigo, delicada, colores) y de la interfaz `SugeridorDeAtributos` | `almacen-local`, `app-base` |
| `etiquetado` | Implementaciones de `SugeridorDeAtributos`: colores por algoritmo, tipo con IA en el dispositivo, Gemini gratuito opcional con clave del usuario. Fallo → edición manual | `armario` |
| `lavanderia` | Usos por prenda, umbral de usos antes de lavar (por tipo, editable), cesto, «lavado → limpia», separación de delicadas | `armario`, `almacen-local`, `app-base` |
| `clima` | Previsión horaria de la ubicación, caché local para uso sin cobertura | `almacen-local` |
| `agenda` | Semana tipo (plan + franja horaria por día) y cambio rápido del plan de hoy | `almacen-local`, `app-base` |
| `motor-outfits` | Lógica pura: prendas limpias + clima de la franja + plan + historial → 3 outfits explicados; candado y regenerar | `armario`, `lavanderia`, `clima`, `agenda` |
| `copia-seguridad` | Exportar e importar un archivo con datos y fotos | `almacen-local`, `armario`, `lavanderia` |
| `manana` | Pantalla del día: plan → 3 outfits → candado/regenerar → confirmar (usos y cesto vía `lavanderia`) | `motor-outfits`, `lavanderia`, `agenda`, `clima`, `app-base` |

**Orden de construcción:** `app-base`, `almacen-local` → `armario` → `etiquetado`, `lavanderia`, `clima`, `agenda` (paralelizables) → `copia-seguridad` → `motor-outfits` → `manana`.

El plan corta estos módulos en rebanadas verticales visibles; el mapa fija fronteras y dependencias, no el orden exacto de las tareas.

## Después de V1 (cada uno con su spec delta)

`reglas-estilo` · `valoraciones` · `estadisticas` · `me-lo-compro` · `rescate-olvidadas` · `accesorios-fragancias` · `maleta` · `calendario` · `web-pc`

## Supuestos aprobados con el mapa

1. Outfit = superior + inferior (o pieza única) + calzado, más capa de abrigo si hace falta. Accesorios en V2.
2. Ubicación por GPS con permiso; si no, ciudad elegida a mano.
3. «Delicada» separa y marca en el cesto («lavar aparte / a mano»); no cambia el umbral de usos.
4. Nunca se propone una prenda sucia; si hay pocas limpias, se avisa.
5. Android primero; web/PC más adelante sin incluirse en V1, pero el stack no debe impedirlo.
