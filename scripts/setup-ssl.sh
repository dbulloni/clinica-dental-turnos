#!/bin/bash

# SSL setup script using Let's Encrypt
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-your-domain.com}
EMAIL=${2:-admin@your-domain.com}
NGINX_CONF_DIR="./nginx"
SSL_DIR="$NGINX_CONF_DIR/ssl"

echo -e "${GREEN}🔒 Setting up SSL certificates for domain: $DOMAIN${NC}"

# Check if domain is provided
if [ "$DOMAIN" = "your-domain.com" ]; then
    echo -e "${RED}❌ Please provide a valid domain name${NC}"
    echo -e "${YELLOW}Usage: $0 <domain> <email>${NC}"
    exit 1
fi

# Create SSL directory
mkdir -p $SSL_DIR

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Installing certbot...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}❌ Please install certbot manually${NC}"
        exit 1
    fi
fi

# Stop nginx if running
echo -e "${YELLOW}🛑 Stopping nginx...${NC}"
docker-compose stop nginx || true

# Generate SSL certificate
echo -e "${YELLOW}🔐 Generating SSL certificate...${NC}"
sudo certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN

# Copy certificates to nginx directory
echo -e "${YELLOW}📋 Copying certificates...${NC}"
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/private.key

# Set proper permissions
sudo chown -R $USER:$USER $SSL_DIR
chmod 644 $SSL_DIR/cert.pem
chmod 600 $SSL_DIR/private.key

# Create nginx configuration with SSL
echo -e "${YELLOW}⚙️ Creating nginx SSL configuration...${NC}"
cat > $NGINX_CONF_DIR/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/private.key;

        # Frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create certificate renewal script
echo -e "${YELLOW}🔄 Creating certificate renewal script...${NC}"
cat > scripts/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL certificate renewal script
set -e

DOMAIN=$1
SSL_DIR="./nginx/ssl"

echo "🔄 Renewing SSL certificate for $DOMAIN..."

# Stop nginx
docker-compose stop nginx

# Renew certificate
sudo certbot renew --standalone

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/private.key

# Set permissions
sudo chown -R $USER:$USER $SSL_DIR
chmod 644 $SSL_DIR/cert.pem
chmod 600 $SSL_DIR/private.key

# Restart nginx
docker-compose start nginx

echo "✅ SSL certificate renewed successfully!"
EOF

chmod +x scripts/renew-ssl.sh

# Create cron job for automatic renewal
echo -e "${YELLOW}⏰ Setting up automatic certificate renewal...${NC}"
CRON_JOB="0 3 * * * $(pwd)/scripts/renew-ssl.sh $DOMAIN >> $(pwd)/logs/ssl-renewal.log 2>&1"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -v "renew-ssl.sh"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✅ SSL setup completed successfully!${NC}"
echo -e "${GREEN}🔒 SSL certificate installed for: $DOMAIN${NC}"
echo -e "${GREEN}🔄 Automatic renewal configured${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}   1. Update your .env.production file with the correct domain${NC}"
echo -e "${YELLOW}   2. Deploy with: ./scripts/deploy.sh production${NC}"
echo -e "${YELLOW}   3. Test your SSL configuration at: https://www.ssllabs.com/ssltest/${NC}"