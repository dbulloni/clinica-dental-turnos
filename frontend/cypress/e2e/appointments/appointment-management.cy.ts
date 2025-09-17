describe('Appointment Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/appointments');
  });

  it('should display appointments calendar', () => {
    cy.get('[data-testid="calendar-view"]').should('be.visible');
    cy.get('[data-testid="appointment-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="add-appointment-button"]').should('be.visible');
  });

  it('should switch between calendar views', () => {
    // Test month view
    cy.get('[data-testid="month-view-button"]').click();
    cy.get('[data-testid="month-calendar"]').should('be.visible');

    // Test week view
    cy.get('[data-testid="week-view-button"]').click();
    cy.get('[data-testid="week-calendar"]').should('be.visible');

    // Test day view
    cy.get('[data-testid="day-view-button"]').click();
    cy.get('[data-testid="day-calendar"]').should('be.visible');
  });

  it('should create a new appointment', () => {
    cy.intercept('POST', '/api/appointments', {
      statusCode: 201,
      body: {
        data: {
          id: 'new-appointment-id',
          patientId: 'patient-1',
          professionalId: 'professional-1',
          treatmentTypeId: 'treatment-1',
          date: '2024-12-20',
          time: '14:00',
          duration: 30,
          status: 'SCHEDULED',
          notes: 'Nueva consulta'
        }
      }
    }).as('createAppointment');

    cy.get('[data-testid="add-appointment-button"]').click();
    cy.get('[data-testid="appointment-modal"]').should('be.visible');

    // Fill form
    cy.get('[data-testid="patient-select"]').select('patient-1');
    cy.get('[data-testid="professional-select"]').select('professional-1');
    cy.get('[data-testid="treatment-select"]').select('treatment-1');
    cy.get('[data-testid="date-input"]').type('2024-12-20');
    cy.get('[data-testid="time-input"]').type('14:00');
    cy.get('[data-testid="notes-input"]').type('Nueva consulta');

    cy.get('[data-testid="save-appointment-button"]').click();
    cy.wait('@createAppointment');

    cy.get('[data-testid="success-message"]').should('contain', 'Turno creado exitosamente');
    cy.get('[data-testid="appointment-modal"]').should('not.exist');
  });

  it('should validate appointment conflicts', () => {
    cy.intercept('POST', '/api/appointments/check-availability', {
      statusCode: 409,
      body: {
        error: 'El profesional no está disponible en ese horario'
      }
    }).as('checkConflict');

    cy.get('[data-testid="add-appointment-button"]').click();
    
    cy.get('[data-testid="patient-select"]').select('patient-1');
    cy.get('[data-testid="professional-select"]').select('professional-1');
    cy.get('[data-testid="treatment-select"]').select('treatment-1');
    cy.get('[data-testid="date-input"]').type('2024-12-20');
    cy.get('[data-testid="time-input"]').type('10:00'); // Conflicting time

    cy.wait('@checkConflict');
    cy.get('[data-testid="conflict-error"]').should('contain', 'El profesional no está disponible');
  });

  it('should edit existing appointment', () => {
    cy.intercept('PUT', '/api/appointments/appointment-1', {
      statusCode: 200,
      body: {
        data: {
          id: 'appointment-1',
          patientId: 'patient-1',
          professionalId: 'professional-1',
          treatmentTypeId: 'treatment-1',
          date: '2024-12-20',
          time: '15:00',
          duration: 30,
          status: 'SCHEDULED',
          notes: 'Consulta editada'
        }
      }
    }).as('updateAppointment');

    cy.get('[data-testid="appointment-item"]').first().click();
    cy.get('[data-testid="edit-appointment-button"]').click();

    cy.get('[data-testid="time-input"]').clear().type('15:00');
    cy.get('[data-testid="notes-input"]').clear().type('Consulta editada');

    cy.get('[data-testid="save-appointment-button"]').click();
    cy.wait('@updateAppointment');

    cy.get('[data-testid="success-message"]').should('contain', 'Turno actualizado exitosamente');
  });

  it('should cancel appointment', () => {
    cy.intercept('PATCH', '/api/appointments/appointment-1/status', {
      statusCode: 200,
      body: {
        data: {
          id: 'appointment-1',
          status: 'CANCELLED'
        }
      }
    }).as('cancelAppointment');

    cy.get('[data-testid="appointment-item"]').first().click();
    cy.get('[data-testid="cancel-appointment-button"]').click();
    cy.get('[data-testid="cancellation-reason-select"]').select('patient-request');
    cy.get('[data-testid="confirm-cancel-button"]').click();

    cy.wait('@cancelAppointment');
    cy.get('[data-testid="success-message"]').should('contain', 'Turno cancelado exitosamente');
  });

  it('should confirm appointment', () => {
    cy.intercept('PATCH', '/api/appointments/appointment-1/status', {
      statusCode: 200,
      body: {
        data: {
          id: 'appointment-1',
          status: 'CONFIRMED'
        }
      }
    }).as('confirmAppointment');

    cy.get('[data-testid="appointment-item"]').first().click();
    cy.get('[data-testid="confirm-appointment-button"]').click();

    cy.wait('@confirmAppointment');
    cy.get('[data-testid="success-message"]').should('contain', 'Turno confirmado exitosamente');
  });

  it('should reschedule appointment', () => {
    cy.intercept('PUT', '/api/appointments/appointment-1/reschedule', {
      statusCode: 200,
      body: {
        data: {
          id: 'appointment-1',
          date: '2024-12-21',
          time: '10:00',
          status: 'SCHEDULED'
        }
      }
    }).as('rescheduleAppointment');

    cy.get('[data-testid="appointment-item"]').first().click();
    cy.get('[data-testid="reschedule-appointment-button"]').click();

    cy.get('[data-testid="new-date-input"]').type('2024-12-21');
    cy.get('[data-testid="new-time-input"]').type('10:00');
    cy.get('[data-testid="confirm-reschedule-button"]').click();

    cy.wait('@rescheduleAppointment');
    cy.get('[data-testid="success-message"]').should('contain', 'Turno reprogramado exitosamente');
  });

  it('should filter appointments by status', () => {
    cy.get('[data-testid="status-filter"]').select('CONFIRMED');
    cy.get('[data-testid="appointment-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'Confirmado');
    });
  });

  it('should filter appointments by professional', () => {
    cy.get('[data-testid="professional-filter"]').select('professional-1');
    cy.get('[data-testid="appointment-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'Dr. Carlos López');
    });
  });

  it('should search appointments by patient name', () => {
    cy.get('[data-testid="appointment-search"]').type('Juan');
    cy.get('[data-testid="appointment-item"]').should('contain', 'Juan Pérez');
  });

  it('should navigate calendar dates', () => {
    cy.get('[data-testid="next-month-button"]').click();
    cy.get('[data-testid="calendar-title"]').should('contain', 'Enero 2025');

    cy.get('[data-testid="prev-month-button"]').click();
    cy.get('[data-testid="calendar-title"]').should('contain', 'Diciembre 2024');
  });

  it('should show appointment details', () => {
    cy.get('[data-testid="appointment-item"]').first().click();
    cy.get('[data-testid="appointment-details-modal"]').should('be.visible');
    cy.get('[data-testid="patient-name"]').should('contain', 'Juan Pérez');
    cy.get('[data-testid="professional-name"]').should('contain', 'Dr. Carlos López');
    cy.get('[data-testid="treatment-name"]').should('contain', 'Consulta General');
  });

  it('should send notifications', () => {
    cy.intercept('POST', '/api/notifications/send', {
      statusCode: 200,
      body: { message: 'Notificación enviada exitosamente' }
    }).as('sendNotification');

    cy.get('[data-testid="appointment-item"]').first().click();
    cy.get('[data-testid="send-notification-button"]').click();
    cy.get('[data-testid="notification-type-select"]').select('reminder');
    cy.get('[data-testid="confirm-send-button"]').click();

    cy.wait('@sendNotification');
    cy.get('[data-testid="success-message"]').should('contain', 'Notificación enviada exitosamente');
  });

  it('should handle drag and drop rescheduling', () => {
    cy.get('[data-testid="appointment-item"]').first()
      .trigger('mousedown', { which: 1 })
      .trigger('dragstart');

    cy.get('[data-testid="calendar-slot"][data-date="2024-12-21"][data-time="10:00"]')
      .trigger('dragover')
      .trigger('drop');

    cy.get('[data-testid="reschedule-confirmation"]').should('be.visible');
    cy.get('[data-testid="confirm-reschedule-button"]').click();
  });

  it('should be accessible', () => {
    cy.checkAccessibility();
  });

  it('should work on mobile devices', () => {
    cy.setMobileViewport();
    cy.get('[data-testid="mobile-calendar"]').should('be.visible');
    cy.get('[data-testid="mobile-add-button"]').should('be.visible');
  });

  it('should show loading state', () => {
    cy.intercept('GET', '/api/appointments*', {
      delay: 2000,
      fixture: 'appointments.json'
    }).as('slowLoad');

    cy.reload();
    cy.get('[data-testid="calendar-loading"]').should('be.visible');
    cy.wait('@slowLoad');
    cy.get('[data-testid="calendar-loading"]').should('not.exist');
  });

  it('should handle offline mode', () => {
    cy.window().then((win) => {
      win.navigator.onLine = false;
      win.dispatchEvent(new Event('offline'));
    });

    cy.get('[data-testid="offline-indicator"]').should('be.visible');
    cy.get('[data-testid="offline-message"]').should('contain', 'Sin conexión');
  });
});