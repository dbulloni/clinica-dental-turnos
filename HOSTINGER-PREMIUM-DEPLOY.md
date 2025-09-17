# 🚀 Deployment en Hostinger Premium Web Hosting

## 📋 **Arquitectura Optimizada para Hostinger Premium**

### **Frontend**: Hostinger Premium (tu dominio)
### **Backend**: Railway.app (gratis)
### **Base de Datos**: Railway PostgreSQL (gratis 500MB)
### **Email**: Hostinger Email (incluido)

**Costo Total**: Solo tu plan Hostinger (~$2.99/mes) + Railway gratis

---

## 🎯 **PASO 1: Configurar Backend en Railway**

### 1.1 Crear Cuenta en Railway
1. Ve a [Railway.app](https://railway.app)
2. **Sign up with GitHub** (recomendado)
3. Conecta tu repositorio de GitHub

### 1.2 Desplegar Backend
1. **"New Project"** → **"Deploy from GitHub repo"**
2. Selecciona tu repositorio
3. Railway detectará automáticamente el backend Node.js
4. **Add Service** → **Database** → **PostgreSQL**

### 1.3 Configurar Variables de Entorno en Railway
```bash
NODE_ENV=production
JWT_SECRET=clave-super-secreta-de-al-menos-32-caracteres
JWT_REFRESH_SECRET=otra-clave-diferente-para-refresh-tokens
CORS_ORIGIN=https://tu-dominio.hostinger.com
PORT=3001

# Railway genera automáticamente:
DATABASE_URL=postgresql://postgres:password@host:port/database
```

### 1.4 Obtener URL del Backend
Railway te dará algo como: `https://backend-production-abc123.up.railway.app`

---

## 🎯 **PASO 2: Preparar Frontend para Hostinger**

### 2.1 Configurar Variables de Entorno

```bash
# En tu máquina local
cd frontend

# Crear archivo de configuración para producción
echo "VITE_API_URL=https://tu-backend-railway.up.railway.app/api" > .env.production
echo "VITE_APP_NAME=Clínica Dental" >> .env.production
```

### 2.2 Construir Frontend

```bash
# Instalar dependencias
npm install

# Construir para producción
npm run build

# Los archivos estarán en /dist
```

---

## 🎯 **PASO 3: Subir a Hostinger Premium**

### 3.1 Acceder al Panel de Hostinger
1. **Login** en tu cuenta Hostinger
2. **hPanel** → **File Manager**
3. Navegar a **public_html** (o tu dominio)

### 3.2 Subir Archivos del Frontend
1. **Seleccionar todos los archivos** de `/frontend/dist/`
2. **Arrastrar y soltar** en public_html
3. O usar **Upload** → **Select Files**

### Estructura final en Hostinger:
```
public_html/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── ...
├── favicon.ico
└── ...
```

---

## 🎯 **PASO 4: Configurar Base de Datos (Opcional)**

### Opción A: Usar Railway PostgreSQL (Recomendada)
- ✅ **Gratis** hasta 500MB
- ✅ **Ya configurada** con el backend
- ✅ **Backups automáticos**

### Opción B: Usar MySQL de Hostinger
Si prefieres usar la base de datos de Hostinger:

1. **hPanel** → **Databases** → **MySQL Databases**
2. **Create Database**: `clinica_db`
3. **Create User** y asignar permisos
4. **Actualizar backend** para usar MySQL en lugar de PostgreSQL

---

## 🎯 **PASO 5: Configurar Email (Hostinger)**

### 5.1 Crear Cuenta de Email
1. **hPanel** → **Email** → **Email Accounts**
2. **Create Email Account**: `noreply@tu-dominio.com`
3. **Anotar credenciales** para configurar en Railway

### 5.2 Configurar SMTP en Railway
Variables adicionales en Railway:
```bash
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=noreply@tu-dominio.com
EMAIL_PASSWORD=tu-contraseña-email
EMAIL_FROM_ADDRESS=noreply@tu-dominio.com
EMAIL_FROM_NAME=Clínica Dental
```

---

## 🎯 **PASO 6: Configurar Dominio y SSL**

### 6.1 Configurar Dominio
Si tienes dominio personalizado:
1. **hPanel** → **Domains** → **DNS Zone**
2. Verificar que apunte a Hostinger

### 6.2 SSL Automático
- ✅ **SSL gratuito** se activa automáticamente
- ✅ **Let's Encrypt** incluido
- ⏱️ **Puede tardar** 24-48 horas en activarse

---

## 🎯 **PASO 7: Probar la Aplicación**

### 7.1 Verificar Frontend
1. **Visitar**: https://tu-dominio.com
2. **Verificar** que carga correctamente
3. **Probar navegación** entre páginas

### 7.2 Verificar Backend
1. **Visitar**: https://tu-backend-railway.up.railway.app/api/health
2. **Debe mostrar**: `{"status": "ok"}`

### 7.3 Probar Funcionalidades
1. **Login** con credenciales por defecto
2. **Crear paciente** de prueba
3. **Crear turno** de prueba
4. **Verificar notificaciones** (si configuraste)

---

## 🔧 **CONFIGURACIONES ADICIONALES**

### WhatsApp Business API
En Railway, agregar variables:
```bash
WHATSAPP_API_URL=https://api.whatsapp.com/v1
WHATSAPP_TOKEN=tu-token-whatsapp
WHATSAPP_PHONE_NUMBER=+54-11-1234-5678
```

### Configurar Webhook
**URL del Webhook**: `https://tu-backend-railway.up.railway.app/api/webhooks/whatsapp`

---

## 📋 **GUÍA PASO A PASO DETALLADA**

### **PASO 1: Railway Backend (15 minutos)**

1. **Ir a Railway.app** y crear cuenta
2. **New Project** → **Deploy from GitHub repo**
3. **Seleccionar** tu repositorio
4. **Add PostgreSQL**: Click "+" → Database → PostgreSQL
5. **Variables de entorno**:
   ```
   NODE_ENV=production
   JWT_SECRET=mi-clave-super-secreta-de-32-caracteres-minimo
   JWT_REFRESH_SECRET=otra-clave-diferente-para-refresh-jwt
   CORS_ORIGIN=https://tu-dominio.hostinger.com
   ```
6. **Deploy** automático
7. **Copiar URL** del backend (ej: `https://backend-production-abc123.up.railway.app`)

### **PASO 2: Preparar Frontend (10 minutos)**

```bash
# En tu computadora
cd frontend

# Configurar API URL
echo "VITE_API_URL=https://backend-production-abc123.up.railway.app/api" > .env.production

# Construir
npm run build
```

### **PASO 3: Subir a Hostinger (10 minutos)**

1. **hPanel Hostinger** → **File Manager**
2. **Ir a public_html**
3. **Borrar archivos** existentes (index.html, etc.)
4. **Subir todos los archivos** de `/frontend/dist/`
5. **Esperar** que se procesen

### **PASO 4: Configurar Email Hostinger (5 minutos)**

1. **hPanel** → **Email Accounts**
2. **Create**: `noreply@tu-dominio.com`
3. **En Railway**, agregar variables:
   ```
   EMAIL_HOST=smtp.hostinger.com
   EMAIL_PORT=587
   EMAIL_USER=noreply@tu-dominio.com
   EMAIL_PASSWORD=tu-contraseña-email
   ```

---

## ✅ **RESULTADO FINAL**

### **URLs de tu aplicación:**
- **Frontend**: https://tu-dominio.com
- **Backend API**: https://backend-production-abc123.up.railway.app/api
- **Admin Panel**: https://tu-dominio.com/admin

### **Credenciales por defecto:**
- **Email**: admin@clinica.com
- **Password**: admin123 (¡cambiar inmediatamente!)

### **Funcionalidades disponibles:**
- ✅ **Gestión completa** de pacientes y turnos
- ✅ **Calendario interactivo**
- ✅ **Panel administrativo**
- ✅ **Notificaciones email** (con Hostinger SMTP)
- ✅ **WhatsApp** (si configuras API)
- ✅ **Reportes y estadísticas**
- ✅ **SSL automático**

---

## 💰 **Costos Totales**

- **Hostinger Premium**: $2.99/mes (ya lo tienes)
- **Railway Backend**: $0/mes (plan gratuito)
- **Total**: Solo tu plan actual de Hostinger

---

## 🚀 **¿Empezamos?**

**¿Quieres que te guíe paso a paso ahora mismo?**

1. ✅ **Configurar Railway** (15 min)
2. ✅ **Preparar frontend** (10 min)  
3. ✅ **Subir a Hostinger** (10 min)
4. ✅ **Probar aplicación** (5 min)

**Total**: ~40 minutos y tendrás tu Sistema de Turnos funcionando en tu dominio de Hostinger.

**¿Comenzamos con Railway?** 🚀