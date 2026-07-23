# Incidente recurrente: vista de respaldo en Contratos

## Fecha

- 2026-07-16

## Resumen

El modulo de Contratos (`CLM`) puede mostrar una `Vista de respaldo` por dos caminos distintos en frontend:

1. Cuando falla la llamada a la API de listado o detalle.
2. Cuando el listado respondia `200 OK` pero sin elementos, el frontend sustituia el resultado vacio por contratos mock locales.
3. Cuando el frontend activo esperaba un formato de respuesta distinto al que realmente devuelve `GET /clm/contracts`.

El segundo y tercer caso hacian que el problema pareciera mas frecuente de lo real, porque el usuario podia ver contratos de respaldo sin que necesariamente hubiera una caida total del backend.

## Evidencia en codigo

### 1. Respaldo por error real de API

En [apps/web/components/modules/clm-pages.tsx](C:\laragon\www\boveda2\apps\web\components\modules\clm-pages.tsx), la vista de listado y la de detalle entran a respaldo dentro de `catch`.

Flujos observados:

- `GET /clm/contracts`
- `GET /clm/contracts/:id`

Si cualquiera de esos endpoints falla, el frontend usa:

- `fallbackContracts`
- `buildFallbackDetail(contractId)`

## 2. Respaldo silencioso por respuesta vacia

Antes de este ajuste, el listado hacia esto:

- si la API devolvia elementos, mostraba esos elementos
- si la API devolvia `[]`, mostraba `fallbackContracts`

Eso mezclaba dos situaciones distintas:

- `sin contratos`
- `error cargando contratos`

Impacto:

- el usuario podia ver contratos mock aunque la API hubiera respondido correctamente
- el incidente parecia recurrente aunque en algunos casos solo habia un listado vacio
- el diagnostico se volvia ambiguo

## 3. Respaldo por incompatibilidad de contrato API/frontend

En la implementacion activa de contratos:

- [workspace.tsx](C:\laragon\www\boveda2\apps\web\components\modules\clm\workspace.tsx:35)
- [detail.tsx](C:\laragon\www\boveda2\apps\web\components\modules\clm\detail.tsx:1)

el frontend estaba esperando una respuesta paginada con esta forma:

- `result.items`
- `result.total`
- `result.totalPages`

Pero la API de contratos expuesta por:

- [clm.controller.ts](C:\laragon\www\boveda2\apps\api\src\modules\clm\clm.controller.ts:64)
- [clm.service.ts](C:\laragon\www\boveda2\apps\api\src\modules\clm\clm.service.ts:124)

devuelve un arreglo simple en `GET /clm/contracts`.

Impacto observado:

- la API podia responder correctamente
- el frontend intentaba leer `result.items.length`
- eso lanzaba una excepcion en cliente
- la pantalla caia a `Vista de respaldo`

En otras palabras: en este caso el mensaje `Vista de respaldo` no significaba que la consulta SQL de contratos hubiera fallado, sino que frontend y API no estaban hablando el mismo formato.

## 4. Error real de API detectado en paralelo

Tambien se detecto un error real de backend que podia disparar la vista de respaldo indirectamente:

- `Unknown column 'ProjectEmailThread__ProjectEmailThread_emails.toAddress' in 'field list'`

Causa:

- la entidad pedia `toAddress`
- la tabla real usa `to_address`

Evidencia:

- [project-email.entity.ts](C:\laragon\www\boveda2\apps\api\src\modules\project-emails\project-email.entity.ts:47)
- [013_project_emails.sql](C:\laragon\www\boveda2\apps\api\src\database\migrations\013_project_emails.sql:32)

Correccion aplicada:

- mapear `toAddress` con `@Column({ name: 'to_address', type: 'text' })`

## 5. Build viejo en frontend

Se confirmo que la aplicacion podia seguir mostrando el comportamiento viejo aun despues de cambiar el codigo fuente, porque el navegador estaba sirviendo un build previo de Next contenido en:

- [apps/web/.next/static/chunks/3xqlx0ep4zc2s.js](C:\laragon\www\boveda2\apps\web.next\static\chunks\3xqlx0ep4zc2s.js:1)

Hallazgo:

- el chunk seguia conteniendo la logica vieja de `fallbackContracts`
- el chunk seguia conteniendo el texto plano `Vista de respaldo.`

Impacto:

- reiniciar sin reconstruir puede mantener vivo el frontend anterior
- el usuario sigue viendo el respaldo aunque el fuente ya este corregido

## Causa funcional mas probable cuando reaparece

Si el usuario ve el texto `Vista de respaldo`, lo mas probable es que haya fallado una de estas llamadas:

- `GET /clm/contracts`
- `GET /clm/contracts/:id`

Posibles causas reales aguas arriba:

- sesion vencida o token invalido
- error `403` por alcance de centro de costos o permisos
- error `404` del contrato solicitado
- error `500` dentro de `ClmService.getDetail(...)`
- API no disponible o timeout

## Hallazgo importante del backend

En [apps/api/src/modules/clm/clm.service.ts](C:\laragon\www\boveda2\apps\api\src\modules\clm\clm.service.ts), el detalle del contrato (`getDetail`) arma muchas relaciones en paralelo. Si una sola consulta falla, todo el detalle falla y el frontend cae en respaldo.

Eso vuelve fragil la pantalla de detalle ante errores parciales de datos relacionados:

- versiones
- adjuntos
- obligaciones
- hitos
- comentarios
- auditoria
- enmiendas
- pagos
- firmas
- negociaciones
- tags
- valores personalizados
- contratos hijos

## Cambios aplicados

Se ajusto el frontend para que:

1. Un listado vacio ya no active contratos mock.
2. La vista de respaldo muestre el motivo real del fallo en el mensaje visible.
3. El workspace de contratos acepte tanto arreglo simple como respuesta paginada.
4. El detalle del contrato muestre el motivo real del respaldo.
5. La entidad de correos de centro de costos use `to_address` y no `toAddress`.

Nuevo comportamiento esperado:

- Si la API responde `[]`, la pantalla muestra `No hay contratos con esos filtros`.
- Si la API responde un arreglo simple de contratos, el frontend lo procesa correctamente.
- Si la API falla, la pantalla sigue usando respaldo, pero ahora muestra `Vista de respaldo. Motivo: ...`.

## Recomendacion operativa

Cuando vuelva a ocurrir, revisar primero el mensaje exacto mostrado junto a `Vista de respaldo`, porque ahora debe exponer la causa original devuelta por frontend/API.

Orden sugerido de validacion:

1. Confirmar que la sesion siga vigente.
2. Validar si `GET /clm/contracts` devuelve arreglo simple o una estructura paginada.
3. Validar si `GET /clm/contracts` falla o responde vacio.
4. Validar si `GET /clm/contracts/:id` falla solo en algunos contratos.
5. Si falla solo el detalle, revisar relaciones cargadas por `ClmService.getDetail(...)`.
6. Si el codigo fuente ya esta corregido pero el problema sigue visible, confirmar que el frontend no este sirviendo un build viejo desde `.next`.
