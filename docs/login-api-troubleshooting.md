# Solucion de incidente: login rechaza credenciales y parece no tocar la API

## Resumen

En este incidente el usuario no podia iniciar sesion con `admin@holocron.local`. La pantalla mostraba:

- `El correo o la contraseña no coinciden`
- No se percibia movimiento en la consola de la API

Al final la causa principal no fue una caida de la API, sino una combinacion de:

1. La contraseña almacenada en la base local del usuario demo no coincidia con la que se estaba probando.
2. La API ya estaba corriendo en `3001`, pero una segunda instancia intento arrancar en el mismo puerto y mostro `EADDRINUSE`, lo que confundia el diagnostico.
3. Nest no imprime cada intento de login por defecto, asi que podia parecer que el backend no estaba recibiendo nada.

## Sintomas observados

- La pantalla de login rechazaba credenciales que se creian correctas.
- En la app web se mostraba error de acceso.
- La consola del backend mostraba arranque normal o mensajes de rutas, pero no se veian peticiones de login.
- Otra ventana mostraba `EADDRINUSE: address already in use :::3001`.

## Causa real

La cuenta `admin@holocron.local` tenia una contraseña distinta en la base de datos local.

Se valido directamente contra la API y despues de corregir el hash del admin, el endpoint de login respondio correctamente con token de acceso.

## Como verificar rapido si vuelve a pasar

### 1. Confirmar que la API realmente esta viva

Si el puerto `3001` ya esta ocupado, no significa que la API este caída. Normalmente significa que ya existe una instancia corriendo.

Si ves un error como este:

```text
EADDRINUSE: address already in use :::3001
```

interpreta eso como:

- ya hay algo escuchando en `3001`
- una segunda instancia intento arrancar encima

### 2. Confirmar si el problema es realmente la contraseña

Probar directamente el login contra la API local:

```bash
node -e "fetch('http://localhost:3001/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@holocron.local',password:'Holocron123!'})}).then(async r=>{const t=await r.text(); console.log(JSON.stringify({status:r.status, body:t},null,2));})"
```

Resultado esperado si todo esta bien:

- status `201`
- cuerpo con `accessToken` y `user`

Si responde `401`, el problema normalmente es:

- contraseña incorrecta
- usuario inactivo

### 3. Revisar el log de autenticacion

Se agrego logging en:

- [apps/api/src/modules/auth/auth.service.ts](C:\laragon\www\boveda2\apps\api\src\modules\auth\auth.service.ts:1)

Ahora el backend registra:

- login fallido por credenciales invalidas
- login bloqueado por usuario inactivo

Ejemplo esperado en consola:

```text
Login failed for admin@holocron.local: invalid credentials
```

## Recuperacion rapida

### Resetear la contraseña del admin

Se actualizo el script:

- [apps/api/scripts/reset-admin-pwd.mjs](C:\laragon\www\boveda2\apps\api\scripts\reset-admin-pwd.mjs:1)

Uso:

```bash
node apps/api/scripts/reset-admin-pwd.mjs admin@holocron.local Holocron123!
```

Si no se pasan argumentos, usa por defecto:

- email: `admin@holocron.local`
- password: `Holocron123!`

### Resetear cualquier otro usuario demo

```bash
node apps/api/scripts/reset-admin-pwd.mjs pm@holocron.local Holocron123!
node apps/api/scripts/reset-admin-pwd.mjs reviewer@holocron.local Holocron123!
node apps/api/scripts/reset-admin-pwd.mjs viewer@holocron.local Holocron123!
```

## Credenciales recomendadas para entorno local

Para evitar confusiones, dejar un criterio unico en local:

- `admin@holocron.local` / `Holocron123!`
- `pm@holocron.local` / `Holocron123!`
- `reviewer@holocron.local` / `Holocron123!`
- `viewer@holocron.local` / `Holocron123!`

Si se cambia una contraseña manualmente en base de datos, actualizar este archivo.

## Lecciones aprendidas

### Lo que confundio el diagnostico

- Ver `EADDRINUSE` hizo pensar que la API no habia arrancado, cuando en realidad ya habia una instancia viva.
- No ver peticiones en consola hizo pensar que el frontend no consultaba la API, pero la consola no estaba trazando intentos de login.
- El mensaje visual de credenciales incorrectas era correcto, pero faltaba contexto operativo.

### Como evitar que vuelva a costar tiempo

- Mantener una contraseña local conocida para usuarios demo.
- Usar el script de reseteo en lugar de editar hashes a mano.
- Probar el endpoint de login directo antes de asumir que el problema es CORS, frontend o middleware.
- Si aparece `EADDRINUSE`, no abrir otra instancia mas; primero confirmar si la actual ya esta sirviendo peticiones.

## Estado final aplicado

Se aplicaron estos cambios:

- Password del admin local restablecida a `Holocron123!`
- Script de reseteo parametrizable
- Logging de login fallido en backend

Con esto, si el incidente reaparece, el orden recomendado es:

1. Confirmar que `3001` ya tiene una API viva.
2. Probar login directo al endpoint.
3. Si falla, resetear contraseña con el script.
4. Reintentar desde la web.
