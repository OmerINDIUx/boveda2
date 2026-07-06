# Arquitectura inicial

Holocron usa un monorepo modular. La API concentra reglas de negocio, permisos, auditoria y almacenamiento. El frontend consume REST y mantiene la navegacion por modulo.

## Principios

- Cada modulo expone controller, service, DTOs y entidades.
- Los documentos pertenecen a proyectos y carpetas.
- La visibilidad se calcula por membresia de proyecto, rol y permisos explicitos.
- Las versiones son inmutables; las acciones relevantes se registran en auditoria.
- El almacenamiento usa un contrato comun con implementaciones local y S3.
- IA documental y CLM nacen desacoplados para poder conectar LLMs, embeddings, OCR y motores de workflow despues.

## Modulos

- Usuarios, roles y permisos
- Proyectos
- Carpetas y disciplinas
- Documentos y versiones
- Auditoria
- Dashboard
- RFIs
- Flujos de aprobacion
- Notificaciones
- Consulta documental con IA/LLMs
- CLM
