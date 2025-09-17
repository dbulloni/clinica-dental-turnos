#!/bin/bash

# Script de configuración inicial del servidor
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Configurando servidor para Clínica Dental...${NC}"

# Actualizar sistema
echo -e "${YELLOW}📦 Actualizando sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Crear usuario para la aplicación
echo -e "${YELLOW}👤 Creando usuario de aplicación...${NC}"
sudo useradd -m -s /bin/bash clinica
sudo usermod -aG docker clinica

# Crear directorios necesarios
echo -e "${YELLOW}📁 Creando directorios...${NC}"
sudo mkdir -p /opt/clinica-dental
sudo chown clinica:clinica /opt/clinica-dental

# Instalar herramientas adicionales
echo -e "${YELLOW}🛠 Instalando herramientas adicionales...${NC}"
sudo apt install -y htop nano vim fail2ban unattended-upgrades

# Configurar actualizaciones automáticas
echo -e "${YELLOW}🔄 Configurando actualizaciones automáticas...${NC}"
sudo dpkg-reconfigure -plow unattended-upgrades

# Configurar fail2ban
echo -e "${YELLOW}🛡 Configurando fail2ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

echo -e "${GREEN}✅ Servidor configurado exitosamente!${NC}"
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo -e "${YELLOW}   1. Reinicia la sesión: exit y vuelve a conectar${NC}"
echo -e "${YELLOW}   2. Clona el repositorio en /opt/clinica-dental${NC}"
echo -e "${YELLOW}   3. Configura las variables de entorno${NC}"
echo -e "${YELLOW}   4. Ejecuta el deployment${NC}"