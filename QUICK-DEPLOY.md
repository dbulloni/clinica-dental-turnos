# 🚀 Guía de Deployment Rápido

## Paso 1: Obtener un Servidor

### Opción Recomendada: DigitalOcean
1. Ve a [DigitalOcean](https://digitalocean.com)
2. Crea una cuenta (puedes usar mi link de referido para $100 gratis)
3. Crea un Droplet:
   - **Imagen**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $12/mes (2GB RAM, 1 vCPU, 50GB SSD)
   - **Región**: Elige la más cercana a tus usuarios
   - **Autenticación**: SSH Key (recomendado) o Password

### Alternativas:
- **Vultr**: Similar a DigitalOcean, muy bueno
- **Linode**: Excelente performance
- **AWS Lightsail**: Si prefieres AWS

## Paso 2: Conectar al Servidor

```bash
# Conectar por SSH (reemplaza con tu IP)
ssh root@tu-ip-del-servidor

# O si usas usuario diferente:
ssh usuario@tu-ip-del-servidor
```

## Paso 3: Configurar el Servidor

```bash
# Descargar y ejecutar script de configuración
curl -fsSL https://raw.githubusercontent.com/tu-repo/clinica-dental/main/scripts/server-setup.sh -o server-setup.sh
chmod +x server-setup.sh
./server-setup.sh

# Reiniciar sesión para aplicar cambios de Docker
exit
ssh root@tu-ip-del-servidor
```

## Paso 4: Clonar el Proyecto

```bash
# Cambiar al directorio de aplicación
cd /opt/clinica-dental

# Clonar el repositorio
git clone https://github.com/tu-usuario/clinica-dental.git .

# O si no tienes Git configurado, sube los archivos manualmente
```

## Paso 5: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.production .env

# Editar variables (usa nano o vim)
nano .env
```

### Variables CRÍTICAS a configurar:

```bash
# Base de datos - CAMBIAR CONTRASEÑAS
DB_PASSWORD=tu-contraseña-super-segura-123
REDIS_PASSWORD=otra-contraseña-segura-456

# JWT - GENERAR CLAVES SEGURAS
JWT_SECRET=clave-jwt-super-secreta-de-al-menos-32-caracteres
JWT_REFRESH_SECRET=otra-clave-jwt-refresh-diferente-y-segura

# Dominio (opcional por ahora)
VITE_API_URL=http://tu-ip-del-servidor:3001/api

# WhatsApp (opcional, configurar después)
WHATSAPP_TOKEN=tu-token-de-whatsapp
WHATSAPP_PHONE_NUMBER=+54-11-1234-5678

# Email (opcional, configurar después)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

## Paso 6: Desplegar la Aplicación

```bash
# Hacer ejecutables los scripts
chmod +x scripts/*.sh

# Ejecutar deployment
./scripts/deploy.sh production
```

## Paso 7: Verificar que Todo Funciona

```bash
# Verificar contenedores
docker-compose ps

# Ver logs si hay problemas
docker-compose logs -f

# Ejecutar health check
./scripts/health-check.sh production
```

## Paso 8: Acceder a la Aplicación

1. **Frontend**: http://tu-ip-del-servidor
2. **Backend API**: http://tu-ip-del-servidor:3001/api

### Usuario por defecto:
- **Email**: admin@clinica.com
- **Password**: admin123 (¡CAMBIAR INMEDIATAMENTE!)

## 🔧 Configuración Adicional (Opcional)

### Configurar Dominio Propio

1. **Comprar dominio** (Namecheap, GoDaddy, etc.)
2. **Configurar DNS**:
   - Tipo A: @ → tu-ip-del-servidor
   - Tipo A: www → tu-ip-del-servidor

3. **Configurar SSL**:
```bash
./scripts/setup-ssl.sh tu-dominio.com admin@tu-dominio.com
```

4. **Actualizar variables**:
```bash
nano .env
# Cambiar:
VITE_API_URL=https://tu-dominio.com/api
```

5. **Re-desplegar**:
```bash
./scripts/deploy.sh production
```

### Configurar WhatsApp Business

1. **Obtener API de WhatsApp Business**
2. **Configurar webhook**: https://tu-dominio.com/api/webhooks/whatsapp
3. **Actualizar variables en .env**
4. **Re-desplegar**

### Configurar Email

1. **Gmail**: Crear contraseña de aplicación
2. **Outlook**: Configurar SMTP
3. **SendGrid/Mailgun**: Para mayor volumen
4. **Actualizar variables en .env**

## 🔍 Troubleshooting

### Problema: Contenedores no inician
```bash
# Ver logs detallados
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Problema: No puedo acceder desde el navegador
```bash
# Verificar firewall
sudo ufw status

# Verificar que los puertos estén abiertos
netstat -tlnp | grep :80
netstat -tlnp | grep :3001
```

### Problema: Base de datos no conecta
```bash
# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Ver logs de base de datos
docker-compose logs postgres
```

### Problema: Falta memoria
```bash
# Verificar uso de memoria
free -h
docker stats

# Limpiar imágenes no utilizadas
docker system prune -a
```

## 📊 Monitoreo Básico

### Configurar Health Checks Automáticos
```bash
# Agregar a crontab
crontab -e

# Agregar línea (cada 5 minutos):
*/5 * * * * /opt/clinica-dental/scripts/health-check.sh production >> /opt/clinica-dental/logs/health.log 2>&1
```

### Configurar Backups Automáticos
```bash
# Agregar a crontab
crontab -e

# Agregar línea (diario a las 2 AM):
0 2 * * * /opt/clinica-dental/scripts/backup.sh production >> /opt/clinica-dental/logs/backup.log 2>&1
```

## 💰 Costos Estimados

### Configuración Básica (sin dominio):
- **VPS**: $12-15/mes
- **Total**: ~$15/mes

### Configuración Completa:
- **VPS**: $12-15/mes
- **Dominio**: $10-15/año
- **WhatsApp Business**: Variable según uso
- **Email Service**: $0-10/mes
- **Total**: ~$20-30/mes

## 🎉 ¡Listo!

Tu Sistema de Turnos para Clínica Dental está funcionando en producción.

### Próximos pasos recomendados:
1. ✅ Cambiar contraseña del admin
2. ✅ Crear usuarios para el personal
3. ✅ Configurar tipos de tratamiento
4. ✅ Agregar profesionales
5. ✅ Configurar horarios de trabajo
6. ✅ Probar creación de turnos
7. ✅ Configurar notificaciones WhatsApp/Email

¿Necesitas ayuda con algún paso específico? ¡Estoy aquí para ayudarte!