---
tipo: medidas
proyecto: ArmarioInteligente
actualizado: 2026-11-27
tags: [armario-inteligente, rendimiento]
---

# Rendimiento en el móvil de referencia

Medidas manuales de cada hito según [`CONSTRAINTS.md` §3](https://github.com/Javier71412/ArmarioInteligente/blob/main/CONSTRAINTS.md). Volver al [[00-Inicio|inicio de la documentación]].

**Condiciones fijas de cada medida:** Xiaomi Redmi Note 15 Pro 5G, **build de release**, pantalla a **120 Hz fijados** en los ajustes, 60 prendas reales. Se anota la **mediana de 5 medidas**. El hito no se cierra si una fila obligatoria falla.

## Cómo copiar una medición

Por cada hito, copia la tabla de abajo y rellénala. Si un efecto no llega a 120 fps pero sí cumple el mínimo de 60 fps, anótalo en «Notas» con el efecto concreto.

## Plantilla

### Hito H? · AAAA-MM-DD

- **Versión de la app / commit:**
- **HyperOS / Android:**
- **Quién mide:**

| Qué                                                   | Umbral                  | Medidas (5) | Mediana | ¿Cumple? |
| ----------------------------------------------------- | ----------------------- | ----------- | ------- | -------- |
| Outfits visibles, arranque en frío                    | ≤ 2,5 s                 |             |         |          |
| Outfits visibles, app en memoria                      | ≤ 1 s                   |             |         |          |
| Motor con 300 prendas                                 | < 100 ms                |             |         |          |
| Animaciones clave: frames > 8,3 ms (objetivo 120 fps) | ≤ 5 %                   |             |         |          |
| Animaciones clave: frames > 16,7 ms (mínimo 60 fps)   | ≤ 5 % (obligatorio)     |             |         |          |
| Alta de prenda con foto                               | ≤ 20 s de media         |             |         |          |
| Accessibility Scanner                                 | 0 avisos o justificados | —           | —       |          |
| TalkBack, ciclo de la mañana                          | Sin bloqueos            | —           | —       |          |
| Stryker (motor y lavado)                              | ≥ 60 % (informativo)    | —           |         |          |

**Cómo se mide:** marca de tiempo propia en logcat contrastada con `adb shell am start -W`; animaciones con `adb shell dumpsys gfxinfo <paquete>` durante un guion fijo (pendiente de verificar cómo cuenta los frames HyperOS a 120 Hz, ver `CONSTRAINTS.md`).

**Notas:**

## Mediciones

_Ninguna todavía. Cada fila se mide desde el hito en que existe lo que mide (por ejemplo, el motor desde H5)._
