# Spec de módulo: `almacen-local` — V1

Depende de: — · Spec global: [SPEC.md](../SPEC.md)

## Objetivo
Guardar todo en el móvil de forma fiable: datos en SQLite (expo-sqlite) y fotos como archivos (expo-file-system, API `File`/`Directory`/`Paths`). Que una actualización de la app nunca pierda datos.

## Requisitos
- Base de datos SQLite única con **versión de esquema** y **migraciones** ordenadas que se aplican al abrir.
- Si una migración falla, se deshace (transacción) y la app muestra un error recuperable. Nunca deja la base a medias.
- Fotos en `Paths.document/photos/<id>.jpg`, comprimidas (lado mayor ≤ 1600 px, calidad suficiente para ver la prenda). Redimensionado con expo-image-manipulator ([ADR 0007](../docs/adr/0007-procesado-fotos-y-pixeles.md)).
- Utilidad de transacción para operaciones que tocan varias tablas (por ejemplo, confirmar outfit).
- Cada módulo define sus tablas y repositorios en su carpeta `datos/`. `almacen-local` solo aporta la conexión, las migraciones y los archivos.
- El enfoque (SQL a mano o un ORM) se fija en un ADR.

## Interfaz pública
`abrirBase()`, `registrarMigraciones()`, `enTransaccion(fn)`, `guardarFoto(uri) → id`, `rutaFoto(id)`, `borrarFoto(id)`, `listarFotos()`, `exportarBaseA(archivo)` e `importarBaseDesde(archivo)` (estos tres para `copia-seguridad`, ver [ADR 0004](../docs/adr/0004-formato-copia-zip-sqlite-fflate.md)). Patrón de acceso y de estado: [ADR 0002](../docs/adr/0002-acceso-sqlite-sql-a-mano.md) y [ADR 0003](../docs/adr/0003-estado-hooks-propios-sobre-repositorios.md).

## Criterios de aceptación
- Test: crear la base en la versión N−1, migrar a N y conservar los datos.
- Test: una migración que falla deja la base en N−1.
- Borrar una prenda borra su foto. No quedan fotos huérfanas (comprobación en el arranque).

## Fuera de alcance
Sincronización entre dispositivos y cifrado de la base (el móvil ya cifra el almacenamiento).
