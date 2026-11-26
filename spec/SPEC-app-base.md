# Spec de módulo: `app-base` — V1

Depende de: — · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
El esqueleto común: navegación, sistema de diseño propio (tokens, tema, tipografía, movimiento, componentes base), ajustes y textos. Que cada pantalla parezca de la misma app y se sienta rápida.

## Requisitos
- **Fase de diseño primero:** los entregables de `docs/diseno/` (ver SPEC.md, «Diseño») se aprueban antes de cualquier tarea de interfaz.
- **Navegación (Expo Router):** pestañas **Hoy**, **Armario**, **Cesto** y **Ajustes**; Hoy es la pantalla de inicio. Las hojas inferiores sirven para acciones rápidas (cambiar plan, editar atributo).
- **Tokens:** fuente en `diseno/tokens/*.tokens.json` (W3C Design Tokens), convertidos a TypeScript. Color (claro y oscuro), tipografía, espaciado, radios, elevación y movimiento (muelles y duraciones).
- **Tema** claro u oscuro según el sistema, con opción de forzarlo en Ajustes.
- **Componentes base:** Botón, Chip seleccionable, Tarjeta, Hoja inferior, Toast con «Deshacer», Estado vacío, Esqueleto de carga. Todos con estados de foco, pulsado y deshabilitado y con etiqueta accesible.
- **Movimiento:** animaciones con Reanimated en el hilo de interfaz; respetan la preferencia del sistema de reducir movimiento.
- **Háptica:** política única (confirmar, candado, error) con expo-haptics; se puede desactivar en Ajustes.
- **Plataforma:** *edge-to-edge* con zonas seguras y *predictive back* compatible.
- **Ajustes:** tema, háptica, recordatorio diario (enlaza con `manana`), ubicación (GPS o ciudad), umbrales de lavado (enlaza con `lavanderia`), Gemini (enlaza con `etiquetado`), copia de seguridad (enlaza con `copia-seguridad`) y créditos (atribución de Open-Meteo y licencias).
- **Textos** en español en un catálogo por módulo.

## Interfaz pública (`index.ts`)
Tema y tokens (`useTema`), componentes base, `haptica`, catálogo de textos y ajustes generales (`useAjustes`).

## Criterios de aceptación
- Ningún componente usa colores, espaciados o duraciones sueltos (comprobación de lint o test).
- Cambiar el tema del sistema actualiza la app sin reiniciarla.
- Con «reducir movimiento» activado, las transiciones pasan a fundidos cortos.
- Todos los componentes base pasan contraste ≥ 4,5:1 en los dos temas y tienen un objetivo táctil ≥ 48 dp.

## Fuera de alcance
Idiomas distintos del español. Widgets de pantalla de inicio. Tablet o escritorio.
