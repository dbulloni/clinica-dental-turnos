describe('Patient Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/patients');
  });

  it('should display patients list', () => {
    cy.get('[data-testid="patients-list"]').should('be.visible');
    cy.get('[data-testid="patient-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="add-patient-button"]').should('be.visible');
  });

  it('should search patients', () => {
    cy.get('[data-testid="patient-search"]').type('Juan');
    cy.get('[data-testid="patient-item"]').should('contain', 'Juan Pérez');
    cy.get('[data-testid="patient-item"]').should('not.contain', 'María González');
  });

  it('should filter patients by status', () => {
    cy.get('[data-testid="status-filter"]').select('active');
    cy.get('[data-testid="patient-item"]').each(($el) => {
      cy.wrap($el).should('not.contain', 'Inactivo');
    });
  });

  it('should create a new patient', () => {
    cy.intercept('POST', '/api/patients', {
      statusCode: 201,
      body: {
        data: {
          id: 'new-patient-id',
          name: 'Nuevo Paciente',
          email: 'nuevo@example.com',
          phone: '+54 11 9999-9999',
          document: '99999999',
          birthDate: '1995-01-01',
          isActive: true
        }
      }
    }).as('createPatient');

    cy.get('[data-testid="add-patient-button"]').click();
    cy.get('[data-testid="patient-modal"]').should('be.visible');

    // Fill form
    cy.get('[data-testid="patient-name-input"]').type('Nuevo Paciente');
    cy.get('[data-testid="patient-email-input"]').type('nuevo@example.com');
    cy.get('[data-testid="patient-phone-input"]').type('+54 11 9999-9999');
    cy.get('[data-testid="patient-document-input"]').type('99999999');
    cy.get('[data-testid="patient-birthdate-input"]').type('1995-01-01');

    cy.get('[data-testid="save-patient-button"]').click();
    cy.wait('@createPatient');

    cy.get('[data-testid="success-message"]').should('contain', 'Paciente creado exitosamente');
    cy.get('[data-testid="patient-modal"]').should('not.exist');
  });

  it('should validate required fields when creating patient', () => {
    cy.get('[data-testid="add-patient-button"]').click();
    cy.get('[data-testid="save-patient-button"]').click();

    cy.get('[data-testid="name-error"]').should('contain', 'Nombre es requerido');
    cy.get('[data-testid="phone-error"]').should('contain', 'Teléfono es requerido');
    cy.get('[data-testid="document-error"]').should('contain', 'Documento es requerido');
  });

  it('should edit existing patient', () => {
    cy.intercept('PUT', '/api/patients/patient-1', {
      statusCode: 200,
      body: {
        data: {
          id: 'patient-1',
          name: 'Juan Pérez Editado',
          email: 'juan.editado@example.com',
          phone: '+54 11 1234-5678',
          document: '12345678',
          birthDate: '1990-01-01',
          isActive: true
        }
      }
    }).as('updatePatient');

    cy.get('[data-testid="patient-item"]').first().find('[data-testid="edit-button"]').click();
    cy.get('[data-testid="patient-modal"]').should('be.visible');

    cy.get('[data-testid="patient-name-input"]').clear().type('Juan Pérez Editado');
    cy.get('[data-testid="patient-email-input"]').clear().type('juan.editado@example.com');

    cy.get('[data-testid="save-patient-button"]').click();
    cy.wait('@updatePatient');

    cy.get('[data-testid="success-message"]').should('contain', 'Paciente actualizado exitosamente');
  });

  it('should delete patient with confirmation', () => {
    cy.intercept('DELETE', '/api/patients/patient-1', {
      statusCode: 200,
      body: { message: 'Paciente eliminado exitosamente' }
    }).as('deletePatient');

    cy.get('[data-testid="patient-item"]').first().find('[data-testid="delete-button"]').click();
    cy.get('[data-testid="confirmation-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-delete-button"]').click();

    cy.wait('@deletePatient');
    cy.get('[data-testid="success-message"]').should('contain', 'Paciente eliminado exitosamente');
  });

  it('should view patient details', () => {
    cy.get('[data-testid="patient-item"]').first().find('[data-testid="view-button"]').click();
    cy.get('[data-testid="patient-details-modal"]').should('be.visible');
    cy.get('[data-testid="patient-name"]').should('contain', 'Juan Pérez');
    cy.get('[data-testid="patient-email"]').should('contain', 'juan@example.com');
    cy.get('[data-testid="patient-phone"]').should('contain', '+54 11 1234-5678');
  });

  it('should view patient appointment history', () => {
    cy.intercept('GET', '/api/patients/patient-1/appointments', {
      fixture: 'appointments.json'
    }).as('getPatientAppointments');

    cy.get('[data-testid="patient-item"]').first().find('[data-testid="history-button"]').click();
    cy.wait('@getPatientAppointments');

    cy.get('[data-testid="appointment-history-modal"]').should('be.visible');
    cy.get('[data-testid="appointment-item"]').should('have.length.at.least', 1);
  });

  it('should handle pagination', () => {
    cy.intercept('GET', '/api/patients?page=2*', {
      body: {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 15,
          totalPages: 2
        }
      }
    }).as('getPage2');

    cy.get('[data-testid="next-page-button"]').click();
    cy.wait('@getPage2');
    cy.get('[data-testid="current-page"]').should('contain', '2');
  });

  it('should export patients list', () => {
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-format-select"]').select('excel');
    cy.get('[data-testid="confirm-export-button"]').click();

    // Verify download was triggered
    cy.readFile('cypress/downloads/patients.xlsx').should('exist');
  });

  it('should be accessible', () => {
    cy.checkAccessibility();
  });

  it('should work on mobile devices', () => {
    cy.setMobileViewport();
    cy.get('[data-testid="patients-list"]').should('be.visible');
    cy.get('[data-testid="mobile-search-button"]').click();
    cy.get('[data-testid="patient-search"]').should('be.visible');
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('GET', '/api/patients*', {
      statusCode: 500,
      body: { error: 'Error interno del servidor' }
    }).as('serverError');

    cy.reload();
    cy.wait('@serverError');
    cy.get('[data-testid="error-message"]').should('contain', 'Error al cargar los pacientes');
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('should show loading state', () => {
    cy.intercept('GET', '/api/patients*', {
      delay: 2000,
      fixture: 'patients.json'
    }).as('slowLoad');

    cy.reload();
    cy.get('[data-testid="loading-indicator"]').should('be.visible');
    cy.wait('@slowLoad');
    cy.get('[data-testid="loading-indicator"]').should('not.exist');
  });

  it('should show empty state when no patients', () => {
    cy.intercept('GET', '/api/patients*', {
      body: {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }).as('emptyPatients');

    cy.reload();
    cy.wait('@emptyPatients');
    cy.get('[data-testid="empty-state"]').should('be.visible');
    cy.get('[data-testid="empty-state"]').should('contain', 'No hay pacientes registrados');
  });
});