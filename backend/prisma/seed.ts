import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Limpiando datos existentes...');
    await prisma.notification.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.workingHour.deleteMany();
    await prisma.treatmentType.deleteMany();
    await prisma.professional.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemConfig.deleteMany();
  }

  // Crear usuarios del sistema
  console.log('👥 Creando usuarios del sistema...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sistematurnos.com',
      password: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: UserRole.ADMIN,
    },
  });

  const secretaryUser = await prisma.user.create({
    data: {
      email: 'secretaria@sistematurnos.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'González',
      role: UserRole.SECRETARY,
    },
  });

  // Crear profesionales
  console.log('👨‍⚕️ Creando profesionales...');
  const professional1 = await prisma.professional.create({
    data: {
      firstName: 'Dr. Juan',
      lastName: 'Pérez',
      email: 'juan.perez@clinica.com',
      phone: '+5491123456789',
      license: 'MP12345',
      specialties: ['Odontología General', 'Endodoncia'],
    },
  });

  const professional2 = await prisma.professional.create({
    data: {
      firstName: 'Dra. Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@clinica.com',
      phone: '+5491123456790',
      license: 'MP12346',
      specialties: ['Ortodoncia', 'Odontopediatría'],
    },
  });

  // Crear tipos de tratamiento
  console.log('🦷 Creando tipos de tratamiento...');
  const treatmentTypes = [
    {
      name: 'Consulta General',
      description: 'Consulta odontológica general',
      duration: 30,
      price: 5000,
      color: '#3B82F6',
      professionalId: professional1.id,
    },
    {
      name: 'Limpieza Dental',
      description: 'Profilaxis y limpieza dental',
      duration: 45,
      price: 8000,
      color: '#10B981',
      professionalId: professional1.id,
    },
    {
      name: 'Endodoncia',
      description: 'Tratamiento de conducto',
      duration: 90,
      price: 25000,
      color: '#F59E0B',
      professionalId: professional1.id,
    },
    {
      name: 'Consulta Ortodoncia',
      description: 'Consulta de ortodoncia',
      duration: 45,
      price: 7000,
      color: '#8B5CF6',
      professionalId: professional2.id,
    },
    {
      name: 'Control Ortodoncia',
      description: 'Control mensual de ortodoncia',
      duration: 30,
      price: 4000,
      color: '#EC4899',
      professionalId: professional2.id,
    },
    {
      name: 'Odontopediatría',
      description: 'Consulta odontológica pediátrica',
      duration: 40,
      price: 6000,
      color: '#06B6D4',
      professionalId: professional2.id,
    },
  ];

  for (const treatmentType of treatmentTypes) {
    await prisma.treatmentType.create({ data: treatmentType });
  }

  // Crear horarios de trabajo
  console.log('⏰ Creando horarios de trabajo...');
  
  // Horarios para Dr. Juan Pérez (Lunes a Viernes 9:00-17:00)
  const workingHoursProfessional1 = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Lunes
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Martes
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Miércoles
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Jueves
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }, // Viernes
  ];

  for (const workingHour of workingHoursProfessional1) {
    await prisma.workingHour.create({
      data: {
        ...workingHour,
        professionalId: professional1.id,
      },
    });
  }

  // Horarios para Dra. Ana Martínez (Lunes, Miércoles, Viernes 14:00-20:00)
  const workingHoursProfessional2 = [
    { dayOfWeek: 1, startTime: '14:00', endTime: '20:00' }, // Lunes
    { dayOfWeek: 3, startTime: '14:00', endTime: '20:00' }, // Miércoles
    { dayOfWeek: 5, startTime: '14:00', endTime: '20:00' }, // Viernes
  ];

  for (const workingHour of workingHoursProfessional2) {
    await prisma.workingHour.create({
      data: {
        ...workingHour,
        professionalId: professional2.id,
      },
    });
  }

  // Crear pacientes de ejemplo
  console.log('👤 Creando pacientes de ejemplo...');
  const patients = [
    {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+5491134567890',
      document: '12345678',
      dateOfBirth: new Date('1985-03-15'),
      address: 'Av. Corrientes 1234, CABA',
    },
    {
      firstName: 'Laura',
      lastName: 'Fernández',
      email: 'laura.fernandez@email.com',
      phone: '+5491134567891',
      document: '23456789',
      dateOfBirth: new Date('1990-07-22'),
      address: 'Av. Santa Fe 5678, CABA',
    },
    {
      firstName: 'Miguel',
      lastName: 'López',
      email: 'miguel.lopez@email.com',
      phone: '+5491134567892',
      document: '34567890',
      dateOfBirth: new Date('1978-11-08'),
      address: 'Av. Rivadavia 9012, CABA',
    },
    {
      firstName: 'Sofia',
      lastName: 'García',
      email: 'sofia.garcia@email.com',
      phone: '+5491134567893',
      document: '45678901',
      dateOfBirth: new Date('2010-05-12'),
      address: 'Av. Cabildo 3456, CABA',
    },
  ];

  for (const patient of patients) {
    await prisma.patient.create({ data: patient });
  }

  // Crear configuración del sistema
  console.log('⚙️ Creando configuración del sistema...');
  const systemConfigs = [
    {
      key: 'CLINIC_NAME',
      value: 'Clínica Dental Sonrisas',
      description: 'Nombre de la clínica',
    },
    {
      key: 'CLINIC_ADDRESS',
      value: 'Av. Corrientes 1234, CABA',
      description: 'Dirección de la clínica',
    },
    {
      key: 'CLINIC_PHONE',
      value: '+5491123456789',
      description: 'Teléfono de la clínica',
    },
    {
      key: 'REMINDER_HOURS_BEFORE',
      value: '24',
      description: 'Horas antes del turno para enviar recordatorio',
    },
    {
      key: 'MAX_APPOINTMENTS_PER_DAY',
      value: '20',
      description: 'Máximo número de turnos por día',
    },
    {
      key: 'DEFAULT_APPOINTMENT_DURATION',
      value: '30',
      description: 'Duración por defecto de los turnos en minutos',
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.create({ data: config });
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('📧 Usuario Admin: admin@sistematurnos.com');
  console.log('📧 Usuario Secretaria: secretaria@sistematurnos.com');
  console.log('🔑 Contraseña para ambos: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });