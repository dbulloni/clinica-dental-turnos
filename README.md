# Sistema de Turnos Odontológicos

Sistema completo de gestión de turnos para consultorios odontológicos con notificaciones automáticas por WhatsApp.

## Características

- 📅 Gestión completa de turnos y citas
- 👥 Administración de pacientes y profesionales
- 📱 Notificaciones automáticas por WhatsApp
- 🔐 Sistema de autenticación y autorización
- 📊 Dashboard administrativo con estadísticas
- 📱 Interfaz responsiva para móviles y tablets

## Estructura del Proyecto

```
├── backend/          # API Node.js + Express + TypeScript
├── frontend/         # React + TypeScript + Tailwind CSS
└── docs/            # Documentación del proyecto
```

## Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- WhatsApp Business API (Twilio)
- Redis (cola de mensajes)
- Jest (testing)

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Query
- React Router
- Vite
- Jest + Testing Library

## Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- PostgreSQL
- Redis
- Cuenta de Twilio (para WhatsApp)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

## Scripts Disponibles

### Backend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run test` - Ejecutar tests
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Poblar base de datos

### Frontend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run test` - Ejecutar tests
- `npm run test:e2e` - Tests end-to-end

## Documentación

La documentación completa del proyecto se encuentra en la carpeta `.kiro/specs/sistema-turnos-admin/`:

- [Requerimientos](/.kiro/specs/sistema-turnos-admin/requirements.md)
- [Diseño](/.kiro/specs/sistema-turnos-admin/design.md)
- [Plan de Implementación](/.kiro/specs/sistema-turnos-admin/tasks.md)

## Licencia

MIT