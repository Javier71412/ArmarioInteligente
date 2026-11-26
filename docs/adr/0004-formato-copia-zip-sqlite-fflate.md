# 0004. Formato de la copia: ZIP sin comprimir (fflate) con la base SQLite, las fotos y un manifiesto

- **Estado:** Aceptado
- **Fecha:** 2026-11-26

## Contexto
[`copia-seguridad`](../../spec/SPEC-copia-seguridad.md) pide un **único archivo** con todos los datos y las fotos, con versión de formato y de esquema; importar valida, muestra un resumen y **sustituye** todo sin tocar los datos actuales si falla; rechazar archivos corruptos o de una versión futura; exportar 100 prendas en < 10 s. Hay que usar la API nueva de expo-file-system (`File`/`Directory`/`Paths`). Tamaño estimado con 100 prendas: ~100 fotos JPEG (≤ 1600 px) + ~100 recortes con transparencia, del orden de **50-250 MB** (**SIN VERIFICAR**: depende del formato del recorte, ver [0007](0007-procesado-fotos-y-pixeles.md)).

## Opciones consideradas
### A) ZIP con una librería JS pura (fflate), en modo *store* (nivel 0)
- Pros: fflate es MIT, JS puro, ~8 kB (+3 kB ZIP), funciona en navegador y Node, así que vale para la futura web y para Jest. Tiene clases de *streaming* (`Zip`, `ZipPassThrough`, `Unzip`): se escribe foto a foto con `File.open()` → `FileHandle.writeBytes()`, sin cargar 200 MB en memoria. Nivel 0 porque JPEG/PNG ya van comprimidos (la propia doc de fflate usa `level: 0` para un PNG). El ZIP se abre en cualquier PC.
- Contras: las variantes asíncronas de fflate usan `Worker`, que no hay en React Native: solo se usan las síncronas/streaming, en trozos, cediendo el hilo entre fotos. El CRC32 de ~200 MB en JS puede tardar segundos (**SIN VERIFICAR**).
### B) ZIP con JSZip o una librería nativa (p. ej. react-native-zip-archive)
- JSZip: MIT/GPLv3, la página no da versión ni estado de mantenimiento; su API típica construye el ZIP en memoria. Nativa: rápida, pero no es un módulo de Expo, no sirve en web y su compatibilidad con la New Architecture está **SIN VERIFICAR**.
### C) Un JSON con las fotos en base64
- Pros: sin librería; legible.
- Contras: base64 aumenta el tamaño un 33 %; leerlo exige un *string* de cientos de MB en memoria (riesgo real de quedarse sin memoria); no se puede leer foto a foto.

## Decisión
**A) ZIP en modo *store* con fflate**, con este contenido:
```
armario-AAAA-MM-DD.zip
├─ manifest.json   { formatVersion: 1, schemaVersion, appVersion, createdAt, counts, files: [{ path, size, crc32 }] }
├─ database.sqlite copia de la base hecha con SQLite.backupDatabaseAsync (consistente aunque la app escriba)
└─ photos/<id>.jpg · photos/<id>-cutout.<ext>
```
Copiar la **base SQLite entera** (y no un JSON por tabla) hace la copia genérica: incluye todas las tablas sin que `backup` conozca las de `laundry` o `schedule`, y una copia de un esquema antiguo se pone al día con **las mismas migraciones** de [0002](0002-acceso-sqlite-sql-a-mano.md).

Importar: (1) leer `manifest.json`; rechazar si `formatVersion` o `schemaVersion` > los de la app; (2) extraer a `Paths.cache/import-<ts>/` comprobando tamaños y CRC; (3) abrir la base temporal, migrarla y calcular el resumen; (4) tras confirmar, copiar la base temporal sobre la real con `backupDatabaseAsync` y cambiar la carpeta de fotos con `Directory.move` (`photos` → `photos-old`, `import/photos` → `photos`, borrar `photos-old`). Un marcador en disco permite terminar o deshacer el cambio si la app muere a mitad.

## Consecuencias
- `storage` debe ofrecer `exportDatabaseTo(file)` e `importDatabaseFrom(file)` además de las funciones de su spec (cambio propuesto a la spec).
- La clave de Gemini está en expo-secure-store, no en la base: queda fuera de la copia sin hacer nada.
- **Riesgo principal:** el paso (4) no es atómico entre base y fotos. Mitigación: marcador de fase + comprobación al arrancar (la de fotos huérfanas de `almacen-local`) y test que simula el fallo en cada fase.
- Segundo riesgo: tiempo de exportación. Si 100 prendas superan los 10 s, primero se reduce el recorte (WebP) y después se mide el CRC.
- **SIN VERIFICAR:** que `backupDatabaseAsync` sobre la base abierta sea atómico para la app (spike); la versión actual de fflate (la página usa 0.8.3 en sus ejemplos); el rendimiento en Hermes.
- Web (V2): la doc marca `serializeAsync` como disponible en web; si `backupDatabaseAsync` no lo está, se usa `serializeAsync`/`deserializeDatabaseAsync` (**SIN VERIFICAR** en web). El formato del archivo no cambia.
- En el código la carpeta de fotos se llama `photos/` (la spec dice `fotos/`; ver cambios a la spec).
- El resumen «12 en cesto» necesita datos de `laundry`, que no está entre las dependencias de `copia-seguridad` (ver cambios a la spec).

## Fuentes (leídas el 2026-11-26)
- https://github.com/101arrowz/fflate (MIT, JS puro navegador/Node, `Zip`/`ZipPassThrough`/`Unzip`, nivel 0, asíncrono con `Worker`)
- https://github.com/Stuk/jszip (MIT/GPLv3)
- https://docs.expo.dev/versions/latest/sdk/filesystem/ (`File.bytes()`, `File.open()` → `FileHandle.readBytes/writeBytes/offset`, `readableStream()`/`writableStream()`, `Directory.move`, `Paths.cache`/`Paths.document`)
- https://docs.expo.dev/versions/latest/sdk/sqlite/ (`backupDatabaseAsync`, `serializeAsync`, `deserializeDatabaseAsync`)
