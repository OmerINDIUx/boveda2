# Plan de mejora — Bóveda informativa

## Objetivo

Convertir `/documents` en el punto de entrada confiable para encontrar, entender, validar y compartir la información de un centro de costos.

## Diagnóstico actual

- Ya existen documentos, carpetas, disciplinas, versiones, permisos, auditoría, comentarios, revisión, vencimientos e indexación para consultas con IA.
- La apertura del visor depende de seleccionar y hacer doble clic, por lo que no es evidente para todos los usuarios.
- La cabecera usa “Drive documental”, aunque el producto ofrece control de ciclo de vida, revisión y trazabilidad.
- La composición fija de tres columnas no es suficientemente adaptable.

## Fases propuestas

### Fase 1 — Exploración confiable

1. Cabecera con contexto del centro de costos, última actualización y CTA primario “Subir documento”.
2. Búsqueda por nombre, número, carpeta, disciplina y responsable con filtros persistentes en la URL.
3. Listado con acción explícita “Abrir visor”, estado, revisión, responsable, vencimiento y ubicación.
4. Vista adaptable: en móvil el explorador se apila y el panel de detalle pasa debajo del listado.
5. Estados vacíos diferenciados para sin documentos, sin resultados, sin carpeta y permisos.

### Fase 2 — Bóveda gobernada

1. Clasificación obligatoria al cargar: carpeta, disciplina, responsable, confidencialidad y revisión.
2. Bandeja “Por ordenar” y bandeja “Por atender” para aprobación, revisión y vencimiento.
3. Reglas visibles de nomenclatura y detección de duplicados.
4. Acciones masivas seguras: mover, asignar, cambiar estado y exportar índice.

### Fase 3 — Consulta y trazabilidad

1. Visor embebido para PDF e imágenes; descarga y edición externa según permisos.
2. Línea de tiempo de versiones, comentarios, aprobaciones y auditoría.
3. Ficha de metadatos y relaciones con contratos, RFI y bitácoras.
4. Consulta con IA con citas de página y enlace directo a la evidencia.
5. Métricas de salud: cobertura de metadatos, vencidos, sin responsable, sin carpeta y antigüedad.

## Criterios de aceptación de la primera entrega

- El usuario identifica el centro de costos y el total de archivos en menos de cinco segundos.
- Cada fila ofrece un camino visible para abrir el documento; no depende de doble clic.
- La pantalla funciona en escritorio y móvil sin scroll horizontal.
- Se distinguen rápidamente aprobados, en revisión, vencidos y sin carpeta.
- El documento abierto conserva el contexto de proyecto y carpeta para volver al listado.
