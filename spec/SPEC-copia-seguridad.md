# Spec de módulo: `copia-seguridad` — V1

Depende de: `almacen-local`, `armario`, `lavanderia` (para el resumen «N en cesto») · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
No perder nunca el armario: si cambias de móvil o reinstalas, lo recuperas desde un archivo que guardas tú.

## Requisitos
- **Exportar:** crea un único archivo `armario-AAAA-MM-DD.<ext>` con todos los datos (prendas, usos, cesto, historial, agenda y ajustes, **sin la clave de Gemini**) y las fotos. Se comparte con expo-sharing (Drive, correo, archivos…).
- El archivo lleva **versión de formato** y versión de esquema. El formato concreto (ZIP o JSON con las fotos dentro) se fija en un ADR, con una librería verificada.
- **Importar:** se elige el archivo con expo-document-picker → se valida → se ve un resumen («84 prendas, 12 en cesto, copia del 3 de marzo») → se confirma → **sustituye** todo.
  - Si falla a mitad, los datos actuales quedan intactos: primero se importa a un lugar temporal y luego se intercambia.
- Recordatorio discreto en Ajustes: «Última copia: hace 23 días».

## Criterios de aceptación
- Test de ida y vuelta: exportar → importar en una base vacía → todos los datos y fotos coinciden.
- Test: un archivo corrupto o de una versión futura se rechaza con un mensaje claro y sin tocar nada.
- Exportar 100 prendas tarda < 10 s en el móvil de referencia (Redmi Note 15 Pro 5G).

## Fuera de alcance
Copias automáticas en la nube, fusionar copias y copias cifradas con contraseña.
