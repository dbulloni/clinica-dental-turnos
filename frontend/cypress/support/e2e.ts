// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook
beforeEach(() => {
  // Set up API interceptors for common requests
  cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' }).as('getUser');
  cy.intercept('GET', '/api/patients*', { fixture: 'patients.json' }).as('getPatients');
  cy.intercept('GET', '/api/appointments*', { fixture: 'appointments.json' }).as('getAppointments');
  cy.intercept('GET', '/api/professionals*', { fixture: 'professionals.json' }).as('getProfessionals');
  cy.intercept('GET', '/api/treatment-types*', { fixture: 'treatmentTypes.json' }).as('getTreatmentTypes');
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we expect in development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Add custom viewport sizes
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});

// Performance monitoring
Cypress.Commands.add('measurePerformance', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });
});

Cypress.Commands.add('endPerformanceMeasure', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = win.performance.getEntriesByName(name)[0];
    cy.task('log', `Performance: ${name} took ${measure.duration}ms`);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      measurePerformance(name: string): Chainable<void>;
      endPerformanceMeasure(name: string): Chainable<void>;
      shouldBeLoading(): Chainable<JQuery<HTMLElement>>;
      shouldShowEmptyState(): Chainable<JQuery<HTMLElement>>;
    }
  }
}