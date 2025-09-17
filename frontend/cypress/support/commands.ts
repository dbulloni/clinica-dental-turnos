/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      createPatient(patientData: any): Chainable<void>;
      createAppointment(appointmentData: any): Chainable<void>;
      deletePatient(patientId: string): Chainable<void>;
      deleteAppointment(appointmentId: string): Chainable<void>;
      seedDatabase(): Chainable<void>;
      cleanDatabase(): Chainable<void>;
      waitForApiResponse(alias: string, timeout?: number): Chainable<void>;
      checkAccessibility(): Chainable<void>;
      mockApiResponse(method: string, url: string, response: any): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('testUser').email;
  const testPassword = password || Cypress.env('testUser').password;

  cy.session([testEmail, testPassword], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(testEmail);
    cy.get('[data-testid="password-input"]').type(testPassword);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage.token').should('exist');
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Create patient command
Cypress.Commands.add('createPatient', (patientData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/patients`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: {
      name: 'Test Patient',
      email: 'test@example.com',
      phone: '+54 11 1234-5678',
      document: '12345678',
      birthDate: '1990-01-01',
      ...patientData,
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
    cy.wrap(response.body.data).as('createdPatient');
  });
});

// Create appointment command
Cypress.Commands.add('createAppointment', (appointmentData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/appointments`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: {
      patientId: 'test-patient-id',
      professionalId: 'test-professional-id',
      treatmentTypeId: 'test-treatment-id',
      date: '2024-12-20',
      time: '10:00',
      duration: 30,
      notes: 'Test appointment',
      ...appointmentData,
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
    cy.wrap(response.body.data).as('createdAppointment');
  });
});

// Delete patient command
Cypress.Commands.add('deletePatient', (patientId) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/patients/${patientId}`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    failOnStatusCode: false,
  });
});

// Delete appointment command
Cypress.Commands.add('deleteAppointment', (appointmentId) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/appointments/${appointmentId}`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    failOnStatusCode: false,
  });
});

// Seed database command
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});

// Clean database command
Cypress.Commands.add('cleanDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/clean`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    failOnStatusCode: false,
  });
});

// Wait for API response command
Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// Accessibility check command
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(null, null, (violations) => {
    violations.forEach((violation) => {
      cy.task('log', `Accessibility violation: ${violation.description}`);
      cy.task('log', `Impact: ${violation.impact}`);
      cy.task('log', `Help: ${violation.helpUrl}`);
    });
  });
});

// Mock API response command
Cypress.Commands.add('mockApiResponse', (method, url, response) => {
  cy.intercept(method, url, response).as('mockedResponse');
});

// Custom assertion for loading states
Cypress.Commands.add('shouldBeLoading', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('contain', 'Cargando').or('have.class', 'loading');
});

// Custom assertion for empty states
Cypress.Commands.add('shouldShowEmptyState', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('contain', 'No hay').or('contain', 'No se encontraron');
});

export {};