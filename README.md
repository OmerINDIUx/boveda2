# Holocron V1

Holocron es una boveda documental empresarial orientada a proyectos con control de acceso, visor documental, aprobaciones, RFIs, dashboard ejecutivo, consulta inteligente con IA y CLM.

## Modulos V1

- Autenticacion JWT
- Roles y permisos
- Proyectos
- Carpetas y disciplinas
- Documentos, visor y versiones
- Auditoria
- Flujos de aprobacion
- Dashboard ejecutivo
- RFIs
- Notificaciones
- Consulta inteligente documental con IA
- CLM / ciclo de vida de contratos

## Estructura

- `apps/api`: backend NestJS
- `apps/web`: frontend Next.js
- `apps/api/src/database/migrations`: esquema SQL incremental
- `apps/api/src/database/seeders`: datos demo V1
- `apps/api/storage/uploads`: archivos demo locales para visor e IA

## Requisitos

- Node.js 20+
- MySQL 8+

## Variables de entorno

Backend: copia [apps/api/.env.example](/C:/laragon/www/boveda2/apps/api/.env.example) a `apps/api/.env`.

Frontend: copia [apps/web/.env.example](/C:/laragon/www/boveda2/apps/web/.env.example) a `apps/web/.env`.

Si prefieres mantener una copia en raíz, también quedó [`.env.example`](/C:/laragon/www/boveda2/.env.example).

## Instalacion local

1. Instala dependencias:
   `npm install`
2. Crea la base `holocron` en MySQL.
3. Configura `apps/api/.env` y `apps/web/.env`.
4. Ejecuta migraciones:
   `npm run db:migrate -w apps/api`
5. Carga datos demo:
   `npm run db:seed -w apps/api`
6. Levanta backend:
   `npm run dev -w apps/api`
7. Levanta frontend:
   `npm run dev -w apps/web`

## Scripts utiles

- `npm run db:migrate -w apps/api`: aplica migraciones SQL
- `npm run db:seed -w apps/api`: carga datos demo V1
- `npm run test`: smoke tests de estructura V1
- `npm run test:types`: validacion TypeScript de API y web

## Usuarios demo

Contrasena para todos: `Holocron123!`

- `admin@holocron.local`:
  Administrador completo
- `pm@holocron.local`:
  Gerente de proyecto
- `reviewer@holocron.local`:
  Revisor operativo
- `viewer@holocron.local`:
  Consulta restringida

## Datos demo cargados

- 1 proyecto con disciplinas y carpetas
- 2 documentos
- 1 documento restringido por permiso explicito
- 1 flujo de aprobacion y 1 solicitud pendiente
- 1 RFI
- 1 contrato con version, anexo, obligacion, hito y comentario
- notificaciones y auditoria base

## Comprobaciones recomendadas

- Inicia sesion con `viewer@holocron.local` y verifica que el documento restringido no aparezca.
- Entra a `Consulta IA` con `viewer@holocron.local` y comprueba que la IA no cite el documento restringido.
- Entra al dashboard con `pm@holocron.local` y revisa contratos por vencer, RFI abierto y obligaciones pendientes.
- Entra a CLM y valida renovacion, cierre y alertas.

## Produccion

La V1 queda lista para evolucionar a produccion con estos puntos ya encaminados:

- variables de entorno separadas
- migraciones y seeders reproducibles
- permisos en backend y frontend
- auditoria en cambios clave
- almacenamiento desacoplado por driver
- consultas IA limitadas por permisos

## Notas

- El extractor documental usa Python si `HOLOCRON_PYTHON_PATH` esta configurado; si no, intenta `python` del sistema.
- Swagger queda disponible en `http://localhost:3001/api/docs`.
