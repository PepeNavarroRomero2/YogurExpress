# YogurExpress

Guía completa para levantar el backend (Express + Supabase + PayPal) y el frontend (Angular) en local. Está pensada para un entorno limpio, desde cero, y resume los requisitos, variables de entorno y pasos de arranque.

## Requisitos previos
- **Node.js 18+** (recomendado 20 LTS) y **npm**.
- Acceso a una cuenta **Supabase** con una base de datos que contenga las tablas usadas por la API (usuarios, productos, pedidos, pedido_items, pagos, configuración, etc.).
- Credenciales de **PayPal REST** (client id y secret) en modo *sandbox* para pruebas.

## Estructura del repositorio
- `backend/`: API Express con integración Supabase y PayPal.
- `frontend/`: Aplicación Angular que consume la API mediante el proxy `/api`.

## Backend (Express + Supabase)
1. **Instalar dependencias**
   ```bash
   cd backend
   npm install
   ```

2. **Crear `.env` en `backend/`**
   ```ini
   SUPABASE_URL=https://<tu-proyecto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role_key_solo_backend>

   JWT_SECRET=<clave_para_firmar_tokens>

   PAYPAL_CLIENT_ID=<paypal_client_id>
   PAYPAL_CLIENT_SECRET=<paypal_client_secret>
   PAYPAL_ENV=sandbox     # usa "live" para producción
   CURRENCY=EUR           # moneda que usará PayPal

   PORT=3000              # opcional, por defecto 3000
   ```
   - Usa **service role key solo en el backend**; no la expongas en el frontend.
   - La API falla en el arranque si faltan `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY`.

3. **Arrancar el servidor**
   ```bash
   npm start
   ```
   El backend quedará en `http://localhost:3000` (o el puerto definido en `PORT`).

4. **Comprobaciones rápidas**
   - `GET /` → `{ "message": "YogurExpress Backend funcionando" }`
   - `GET /api/paypal/config` → JSON con `clientId`, `currency` y `env` (asegúrate de que `clientId` no está vacío para que el botón se pinte en el front).

5. **Tablas esperadas en Supabase (resumen orientativo)**
   - `usuarios`: campos de autenticación (email, nombre, contraseña_hash, rol...).
   - `productos`: catálogo con `id_producto`, `nombre`, `precio`, `tipo` (`"tamano"` para tamaños), etc.
   - `pedidos` y `pedido_items`: pedidos y líneas con cantidades/precio_unit.
   - `pagos_paypal`: seguimiento de órdenes/capturas PayPal (`paypal_order_id`, `paypal_capture_id`, `status`, `amount`, `currency`).
   - `settings` u otras tablas de configuración (horarios, puntos, etc.).

   Adapta los nombres exactos a tu esquema; la API consulta esos identificadores en el código.

## Frontend (Angular)
1. **Instalar dependencias**
   ```bash
   cd frontend
   npm install
   ```

2. **Arrancar en desarrollo**
   ```bash
   npm start
   ```
   - Levanta `ng serve` con el proxy `proxy.conf.json`, que redirige las peticiones a `/api/*` hacia `http://localhost:3000`.
   - La app queda disponible en `http://localhost:4200`.

3. **Configuración de PayPal en el front**
   - El SDK se carga dinámicamente; no necesitas editar `index.html`.
   - El front llama a `/api/paypal/config` y solo muestra botones si `clientId` tiene valor.

## Flujo de pruebas manuales sugerido
1. **Registro y login**
   - Crear usuario nuevo desde el formulario y comprobar que el login devuelve token y rol.
2. **Explorar catálogo y carrito**
   - Añadir productos al carrito y verificar que los tipos `"tamano"` se muestran correctamente.
3. **Pedido con PayPal**
   - Iniciar checkout, confirmar que se crea la orden y se captura correctamente; el pedido debe quedar marcado como pagado.
4. **Pedido sin PayPal / recogida**
   - Si el flujo lo permite, crear pedido sin pago PayPal y validar que se guarda en Supabase.
5. **Restricción por horario (lead time)**
   - Ajustar horario en la sección de administración y comprobar que el front bloquea pedidos fuera de ventana.

## Rama de trabajo opcional
Para aislar cambios mientras pruebas:
```bash
git checkout -b feature/pruebas-locales
```
Cuando todo funcione, fusiona la rama con tu flujo principal.
