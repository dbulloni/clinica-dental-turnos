# 🚀 Deployment en Hostinger - Guía Completa

## 📊 Opciones según tu Plan de Hostinger

### 🏢 **Opción 1: Hostinger VPS (Recomendada)**
**Planes VPS**: $3.99 - $29.99/mes
- ✅ Acceso SSH completo
- ✅ Docker compatible
- ✅ Node.js compatible
- ✅ PostgreSQL/MySQL
- ✅ Control total del servidor

### 🌐 **Opción 2: Hosting Compartido + Backend Externo**
**Planes Compartidos**: $1.99 - $9.99/mes
- ✅ Frontend React (estático)
- ✅ Dominio y SSL incluido
- ❌ No Node.js backend
- 🔄 Backend en servicio externo

### 🔄 **Opción 3: Conversión a PHP**
**Planes Compartidos**: $1.99 - $9.99/mes
- ✅ Frontend React
- 🔄 Backend convertido a PHP
- ✅ MySQL incluido
- ⚠️ Requiere reescribir backend

---

## 🚀 **OPCIÓN 1: Hostinger VPS (Más Fácil)**

### Paso 1: Configurar VPS en Hostinger

1. **Comprar VPS** en Hostinger
2. **Elegir Ubuntu 22.04**
3. **Configurar acceso SSH**

### Paso 2: Conectar y Configurar

```bash
# Conectar por SSH
ssh root@tu-vps-hostinger.com

# Ejecutar script de configuración
curl -fsSL https://raw.githubusercontent.com/tu-repo/clinica-dental/main/scripts/server-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

### Paso 3: Desplegar Aplicación

```bash
# Clonar proyecto
cd /opt/clinica-dental
git clone https://github.com/tu-repo/clinica-dental.git .

# Configurar variables
cp .env.production .env
nano .env

# Desplegar
./scripts/deploy.sh production
```

**¡Listo!** Tu aplicación estará en: `http://tu-vps-hostinger.com`

---

## 🌐 **OPCIÓN 2: Hosting Compartido + Backend Externo**

### Arquitectura:
- **Frontend**: Hostinger (hosting compartido)
- **Backend**: Railway/Render (gratis)
- **Base de datos**: Railway/Render PostgreSQL

### Paso 1: Desplegar Backend en Railway

1. **Crear cuenta** en [Railway.app](https://railway.app)
2. **Conectar GitHub** con tu repositorio
3. **Desplegar backend**:
   - Seleccionar carpeta `/backend`
   - Railway detectará Node.js automáticamente
   - Agregar PostgreSQL desde Railway

### Paso 2: Configurar Variables en Railway

```bash
# Variables de entorno en Railway
NODE_ENV=production
DATABASE_URL=postgresql://... (Railway lo genera automáticamente)
JWT_SECRET=tu-clave-secreta-jwt
JWT_REFRESH_SECRET=tu-clave-refresh-jwt
CORS_ORIGIN=https://tu-dominio-hostinger.com
```

### Paso 3: Preparar Frontend para Hostinger

```bash
# En tu máquina local
cd frontend

# Configurar API URL para Railway
echo "VITE_API_URL=https://tu-backend-railway.up.railway.app/api" > .env.production

# Construir para producción
npm run build

# El resultado estará en /dist
```

### Paso 4: Subir Frontend a Hostinger

1. **Acceder al Panel de Hostinger**
2. **File Manager** → `public_html`
3. **Subir todos los archivos** de `/frontend/dist`
4. **Configurar dominio** si es necesario

### Costos Opción 2:
- **Hostinger Compartido**: $1.99-$9.99/mes
- **Railway Backend**: $0-$5/mes (plan gratuito disponible)
- **Total**: ~$2-15/mes

---

## 🔄 **OPCIÓN 3: Conversión a PHP (Más Trabajo)**

### Ventajas:
- ✅ Funciona en cualquier hosting compartido
- ✅ Muy económico
- ✅ Fácil mantenimiento

### Desventajas:
- ❌ Requiere reescribir todo el backend
- ❌ Menos funcionalidades avanzadas
- ❌ No notificaciones en tiempo real

### Estructura PHP:
```
public_html/
├── index.html (React build)
├── api/
│   ├── index.php
│   ├── config/
│   │   └── database.php
│   ├── models/
│   │   ├── Patient.php
│   │   ├── Appointment.php
│   │   └── Professional.php
│   ├── controllers/
│   │   ├── PatientController.php
│   │   ├── AppointmentController.php
│   │   └── AuthController.php
│   └── routes/
│       └── api.php
└── assets/ (CSS, JS, etc.)
```

---

## 🎯 **Recomendación Personal**

### Para Presupuesto Ajustado:
**Opción 2** - Hostinger Compartido + Railway Backend
- **Costo**: ~$7/mes total
- **Funcionalidad**: 95% completa
- **Facilidad**: Media

### Para Mejor Performance:
**Opción 1** - Hostinger VPS
- **Costo**: ~$15/mes
- **Funcionalidad**: 100% completa
- **Facilidad**: Alta

### Para Máximo Ahorro:
**Opción 3** - Todo en PHP
- **Costo**: ~$3/mes
- **Funcionalidad**: 80% (sin notificaciones tiempo real)
- **Facilidad**: Baja (requiere reescribir backend)

---

## 🚀 **Guía Paso a Paso - Opción 2 (Recomendada)**

### Paso 1: Configurar Backend en Railway

1. Ve a [Railway.app](https://railway.app)
2. Conecta tu GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detectará el backend automáticamente
6. Agrega PostgreSQL: "Add Service" → "Database" → "PostgreSQL"

### Paso 2: Configurar Variables de Entorno

En Railway Dashboard → Variables:
```
NODE_ENV=production
JWT_SECRET=clave-super-secreta-de-32-caracteres-minimo
JWT_REFRESH_SECRET=otra-clave-diferente-para-refresh-tokens
CORS_ORIGIN=https://tu-dominio.hostinger.com
PORT=3001
```

### Paso 3: Obtener URL del Backend

Railway te dará una URL como: `https://tu-app-production.up.railway.app`

### Paso 4: Configurar Frontend

```bash
# En tu máquina
cd frontend

# Crear archivo de configuración
echo "VITE_API_URL=https://tu-app-production.up.railway.app/api" > .env.production

# Construir
npm run build
```

### Paso 5: Subir a Hostinger

1. **Panel Hostinger** → **File Manager**
2. **Ir a public_html**
3. **Subir todos los archivos** de `frontend/dist/`
4. **Configurar dominio** si tienes uno personalizado

### Paso 6: Probar

1. **Frontend**: https://tu-dominio.hostinger.com
2. **Backend**: https://tu-app-production.up.railway.app/api/health

---

## 🔧 **Configuraciones Adicionales**

### SSL en Hostinger
- ✅ **Automático** en todos los planes
- ✅ **Let's Encrypt** incluido

### Base de Datos
- **Railway**: PostgreSQL gratuito (500MB)
- **Hostinger**: MySQL incluido en planes compartidos

### Email
- **Hostinger**: Email hosting incluido
- **Configurar SMTP** en variables de entorno

### WhatsApp
- **Funciona igual** desde Railway backend
- **Configurar webhook** apuntando a Railway

---

## 💰 **Comparación de Costos**

| Opción | Hostinger | Backend | DB | Total/mes |
|--------|-----------|---------|----|-----------| 
| VPS | $15.99 | Incluido | Incluido | ~$16 |
| Compartido + Railway | $2.99 | $0-5 | $0 | ~$3-8 |
| Solo PHP | $2.99 | Incluido | Incluido | ~$3 |

---

## ❓ **¿Cuál eliges?**

**Dime qué plan de Hostinger tienes o planeas tomar** y te guío paso a paso con la opción más adecuada:

1. **¿Tienes VPS de Hostinger?** → Opción 1 (más fácil)
2. **¿Tienes hosting compartido?** → Opción 2 (recomendada)
3. **¿Quieres máximo ahorro?** → Opción 3 (más trabajo)

¡Estoy aquí para ayudarte con cualquier opción que elijas! 🚀