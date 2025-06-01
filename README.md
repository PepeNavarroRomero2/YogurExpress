# YogurExpress

## Documentacion API Backend
Para que el backend funcione correctamente, necesitas instalar todas las dependencias que usamos en los distintos ficheros. A continuación tienes un resumen de cada paquete y el comando para instalarlo.

1. Inicializar proyecto Node (si no lo haces ya)
Si aún no has creado package.json en backend/, hazlo así:

bash
Copiar
Editar
cd backend
npm init -y
Esto genera un package.json mínimo.

2. Paquetes necesarios y su propósito
express

Para montar el servidor HTTP y definir rutas.

Instalación:

bash
Copiar
Editar
npm install express
cors

Para habilitar CORS y permitir que tu frontend (Angular) pueda hacer peticiones a este backend.

Instalación:

bash
Copiar
Editar
npm install cors
dotenv

Para leer variables de entorno desde el fichero .env.

Instalación:

bash
Copiar
Editar
npm install dotenv
@supabase/supabase-js

Cliente oficial de Supabase para conectar con tu base de datos PostgreSQL hospedada en Supabase.

Instalación:

bash
Copiar
Editar
npm install @supabase/supabase-js
bcrypt

Para hashear contraseñas al registrarse y comparar hashes al iniciar sesión.

Instalación:

bash
Copiar
Editar
npm install bcrypt
jsonwebtoken

Para generar y verificar tokens JWT en los procesos de login/registro y proteger rutas.

Instalación:

bash
Copiar
Editar
npm install jsonwebtoken
uuid

Para generar códigos únicos (por ejemplo, codigo_pedido = uuidv4().slice(0,8)).

Instalación:

bash
Copiar
Editar
npm install uuid
¿Por qué uuid?:
En routes/orders.js usamos const { v4: uuidv4 } = require('uuid') para crear un identificador alfanumérico único que luego guardamos en el campo codigo_pedido de la tabla pedidos. Sin esa dependencia, Node no sabe cómo generar UUIDs.

3. Comando completo para instalar todo de golpe
En tu carpeta backend/, ejecuta:

bash
Copiar
Editar
npm install express cors dotenv @supabase/supabase-js bcrypt jsonwebtoken uuid
Esto añadirá en package.json todas las dependencias necesarias:

json
Copiar
Editar
"dependencies": {
  "@supabase/supabase-js": "^x.x.x",
  "bcrypt": "^x.x.x",
  "cors": "^x.x.x",
  "dotenv": "^x.x.x",
  "express": "^x.x.x",
  "jsonwebtoken": "^x.x.x",
  "uuid": "^x.x.x"
}
4. Opcional: script “start” en package.json
Para no tener que teclear node index.js cada vez, edita tu package.json y en la sección "scripts" pon:

json
Copiar
Editar
"scripts": {
  "start": "node index.js"
}
Entonces, en lugar de node index.js, podrás arrancar con:

bash
Copiar
Editar
npm start
5. Verificación de la instalación
Asegúrate de que package.json contenga todas las dependencias listadas arriba.

Asegúrate de que el fichero .env en backend/ existe y tiene las claves correctas:

ini
Copiar
Editar
SUPABASE_URL=…
SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
JWT_SECRET=…
PORT=3000
Ejecuta en consola:

bash
Copiar
Editar
npm start
o

bash
Copiar
Editar
node index.js
Si todo está instalado, verás algo como:

nginx
Copiar
Editar
Servidor corriendo en http://localhost:3000
Con esto, ya tienes documentados todos los paquetes que el backend necesita y cómo instalarlos para que funcione sin errores.