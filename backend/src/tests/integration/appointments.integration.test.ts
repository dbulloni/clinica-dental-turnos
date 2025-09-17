import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt';

describe('Appointments Integration Tests', () => {
  let authToken: string;
  let testPatient: any;
  let testProfessional: any;
  let testTreatmentType: any;
  let testAppointment: any;

  beforeAll(async () => {
    // Create test user and generate token
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'ADMIN',
      },
    });
    authToken = generateToken(testUser.id);

    // Create test data
    testPatient = await prisma.patient.create({
      data: {
        name: 'Test Patient',
        email: 'patient@test.com',
        phone: '+54 11 1234-5678',
        document: '12345678',
        birthDate: new Date('1990-01-01'),
      },
    });

    testProfessional = await prisma.professional.create({
      data: {
        name: 'Dr. Test',
        email: 'doctor@test.com',
        phone: '+54 11 2345-6789',
        specialization: 'General',
        licenseNumber: 'LIC123',
      },
    });

    testTreatmentType = await prisma.treatmentType.create({
      data: {
        name: 'Test Treatment',
        description: 'Test treatment description',
        duration: 30,
        price: 1000,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.patient.deleteMany({});
    await prisma.professional.deleteMany({});
    await prisma.treatmentType.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up appointments after each test
    await prisma.appointment.deleteMany({});
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        patientId: testPatient.id,
        professionalId: testProfessional.id,
        treatmentTypeId: testTreatmentType.id,
        date: '2024-12-20',
        time: '10:00',
        notes: 'Test appointment',
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.data).toMatchObject({
        patientId: testPatient.id,
        professionalId: testProfessional.id,
        treatmentTypeId: testTreatmentType.id,
        date: '2024-12-20T00:00:00.000Z',
        time: '10:00',
        status: 'SCHEDULED',
        notes: 'Test appointment',
      });

      // Verify in database
      const appointment = await prisma.appointment.findUnique({
        where: { id: response.body.data.id },
      });
      expect(appointment).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toContain('Patient ID is required');
      expect(response.body.errors).toContain('Professional ID is required');
      expect(response.body.errors).toContain('Treatment type ID is required');
      expect(response.body.errors).toContain('Date is required');
      expect(response.body.errors).toContain('Time is required');
    });

    it('should check for appointment conflicts', async () => {
      // Create first appointment
      const appointmentData = {
        patientId: testPatient.id,
        professionalId: testProfessional.id,
        treatmentTypeId: testTreatmentType.id,
        date: '2024-12-20',
        time: '10:00',
      };

      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      // Try to create conflicting appointment
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(409);

      expect(response.body.error).toContain('Professional is not available');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/appointments')
        .send({})
        .expect(401);
    });
  });

  describe('GET /api/appointments', () => {
    beforeEach(async () => {
      // Create test appointments
      testAppointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '10:00',
          status: 'SCHEDULED',
        },
      });
    });

    it('should get appointments list', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: testAppointment.id,
        patientId: testPatient.id,
        professionalId: testProfessional.id,
        status: 'SCHEDULED',
      });
    });

    it('should filter appointments by date', async () => {
      const response = await request(app)
        .get('/api/appointments?date=2024-12-20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter appointments by professional', async () => {
      const response = await request(app)
        .get(`/api/appointments?professionalId=${testProfessional.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/appointments?status=SCHEDULED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/appointments?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('GET /api/appointments/:id', () => {
    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '10:00',
          status: 'SCHEDULED',
        },
      });
    });

    it('should get appointment by id', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: testAppointment.id,
        patientId: testPatient.id,
        professionalId: testProfessional.id,
        status: 'SCHEDULED',
      });
    });

    it('should return 404 for non-existent appointment', async () => {
      await request(app)
        .get('/api/appointments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '10:00',
          status: 'SCHEDULED',
        },
      });
    });

    it('should update appointment', async () => {
      const updateData = {
        time: '11:00',
        notes: 'Updated notes',
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: testAppointment.id,
        time: '11:00',
        notes: 'Updated notes',
      });

      // Verify in database
      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });
      expect(updatedAppointment?.time).toBe('11:00');
      expect(updatedAppointment?.notes).toBe('Updated notes');
    });

    it('should check for conflicts when updating', async () => {
      // Create another appointment
      await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '11:00',
          status: 'SCHEDULED',
        },
      });

      // Try to update to conflicting time
      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ time: '11:00' })
        .expect(409);

      expect(response.body.error).toContain('Professional is not available');
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '10:00',
          status: 'SCHEDULED',
        },
      });
    });

    it('should update appointment status', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${testAppointment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.data.status).toBe('CONFIRMED');

      // Verify in database
      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });
      expect(updatedAppointment?.status).toBe('CONFIRMED');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${testAppointment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.error).toContain('Invalid status');
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '10:00',
          status: 'SCHEDULED',
        },
      });
    });

    it('should delete appointment', async () => {
      await request(app)
        .delete(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion in database
      const deletedAppointment = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });
      expect(deletedAppointment).toBeNull();
    });

    it('should return 404 for non-existent appointment', async () => {
      await request(app)
        .delete('/api/appointments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/appointments/availability', () => {
    it('should check availability', async () => {
      const response = await request(app)
        .get('/api/appointments/availability')
        .query({
          professionalId: testProfessional.id,
          date: '2024-12-20',
          time: '10:00',
          duration: 30,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data.available).toBe(true);
    });

    it('should return unavailable for conflicting times', async () => {
      // Create appointment
      await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          professionalId: testProfessional.id,
          treatmentTypeId: testTreatmentType.id,
          date: new Date('2024-12-20'),
          time: '10:00',
          status: 'SCHEDULED',
        },
      });

      const response = await request(app)
        .get('/api/appointments/availability')
        .query({
          professionalId: testProfessional.id,
          date: '2024-12-20',
          time: '10:00',
          duration: 30,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.available).toBe(false);
    });
  });
});