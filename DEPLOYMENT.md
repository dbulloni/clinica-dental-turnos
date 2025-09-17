# Deployment Guide - Sistema de Turnos Clínica Dental

## 📋 Requisitos Previos

### Software Requerido
- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18+ (para desarrollo)
- Git

### Configuración del Servidor
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Mínimo 2GB RAM, 4GB recomendado
- Mínimo 20GB espacio en disco
- Puertos 80, 443, 3001, 5432 disponibles

## 🚀 Deployment en Producción

### 1. Preparación del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar cambios de grupo
```

### 2. Clonar el Repositorio

```bash
git clone https://github.com/your-repo/clinica-dental.git
cd clinica-dental
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.production .env

# Editar variables de entorno
nano .env
```

**Variables críticas a configurar:**
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `REDIS_PASSWORD`: Contraseña segura para Redis
- `JWT_SECRET`: Clave secreta para JWT (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET`: Clave secreta para refresh tokens
- `WHATSAPP_TOKEN`: Token de la API de WhatsApp
- `EMAIL_PASSWORD`: Contraseña de la aplicación de email
- `SENTRY_DSN`: DSN de Sentry para monitoreo de errores

### 4. Configurar SSL (Opcional pero Recomendado)

```bash
# Hacer ejecutable el script
chmod +x scripts/setup-ssl.sh

# Configurar SSL con Let's Encrypt
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com
```

### 5. Ejecutar Deployment

```bash
# Hacer ejecutables los scripts
chmod +x scripts/*.sh

# Ejecutar deployment
./scripts/deploy.sh production
```

### 6. Verificar Deployment

```bash
# Verificar estado de contenedores
docker-compose ps

# Verificar logs
docker-compose logs -f

# Ejecutar health check
./scripts/health-check.sh production
```

## 🔧 Deployment en Desarrollo

### 1. Configurar Entorno de Desarrollo

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
cd ..
```

### 2. Ejecutar con Docker Compose

```bash
# Iniciar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. Acceder a Servicios de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Base de Datos (Adminer)**: http://localhost:8080
- **Email Testing (Mailhog)**: http://localhost:8025

## 📊 Monitoreo y Mantenimiento

### Health Checks Automáticos

```bash
# Configurar cron job para health checks
crontab -e

# Agregar línea (cada 5 minutos):
*/5 * * * * /path/to/clinica-dental/scripts/health-check.sh production >> /path/to/clinica-dental/logs/health-check.log 2>&1
```

### Backups Automáticos

```bash
# Configurar backup diario
crontab -e

# Agregar línea (diario a las 2 AM):
0 2 * * * /path/to/clinica-dental/scripts/backup.sh production >> /path/to/clinica-dental/logs/backup.log 2>&1
```

### Renovación SSL Automática

```bash
# Ya configurado automáticamente por setup-ssl.sh
# Verifica con:
crontab -l | grep renew-ssl
```

## 🔄 Actualizaciones

### Actualización de Código

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir y desplegar
./scripts/deploy.sh production true true
```

### Actualización de Base de Datos

```bash
# Ejecutar migraciones manualmente
docker-compose exec backend npm run migrate:deploy

# O incluir en deployment
./scripts/deploy.sh production true true
```

## 🛠 Troubleshooting

### Problemas Comunes

#### 1. Contenedores no inician
```bash
# Verificar logs
docker-compose logs [service-name]

# Verificar recursos del sistema
docker system df
free -h
df -h
```

#### 2. Base de datos no conecta
```bash
# Verificar estado de PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Verificar logs de base de datos
docker-compose logs postgres
```

#### 3. Problemas de SSL
```bash
# Verificar certificados
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renovar certificados manualmente
./scripts/renew-ssl.sh your-domain.com
```

#### 4. Alto uso de memoria
```bash
# Verificar uso de memoria por contenedor
docker stats

# Limpiar imágenes no utilizadas
docker system prune -a
```

### Logs Importantes

```bash
# Logs de aplicación
tail -f logs/app.log

# Logs de nginx
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log

# Logs de Docker
docker-compose logs -f [service-name]
```

## 🔐 Seguridad

### Configuraciones de Seguridad

1. **Firewall**:
```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

2. **Actualizaciones de Seguridad**:
```bash
# Configurar actualizaciones automáticas
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

3. **Monitoreo de Logs**:
```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar para nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

### Backup y Recuperación

#### Crear Backup Manual
```bash
./scripts/backup.sh production
```

#### Restaurar desde Backup
```bash
# Restaurar base de datos
gunzip -c backups/database_backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U postgres -d clinica_db

# Restaurar archivos
tar -xzf backups/uploads_backup_YYYYMMDD_HHMMSS.tar.gz -C backend/
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs en `/logs/`
2. Ejecutar health check: `./scripts/health-check.sh`
3. Consultar documentación de la API
4. Contactar al equipo de desarrollo

## 📝 Notas Adicionales

- Los backups se almacenan en `./backups/` y opcionalmente en S3
- Los logs rotan automáticamente para evitar llenar el disco
- El sistema incluye health checks automáticos
- SSL se renueva automáticamente cada 90 días
- Todas las contraseñas deben ser seguras (mínimo 12 caracteres)