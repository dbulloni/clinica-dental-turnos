describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should be accessible on login page', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should be accessible on dashboard', () => {
    cy.visit('/dashboard');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should be accessible on patients page', () => {
    cy.visit('/patients');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should be accessible on appointments page', () => {
    cy.visit('/appointments');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should be accessible on notifications page', () => {
    cy.visit('/notifications');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should have proper keyboard navigation', () => {
    cy.visit('/patients');
    
    // Test tab navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'skip-to-content');
    
    cy.tab();
    cy.focused().should('have.attr', 'data-testid', 'main-navigation');
    
    cy.tab();
    cy.focused().should('have.attr', 'data-testid', 'patient-search');
  });

  it('should have proper ARIA labels', () => {
    cy.visit('/appointments');
    
    cy.get('[data-testid="add-appointment-button"]')
      .should('have.attr', 'aria-label', 'Agregar nuevo turno');
    
    cy.get('[data-testid="calendar-view"]')
      .should('have.attr', 'role', 'grid');
    
    cy.get('[data-testid="appointment-item"]')
      .should('have.attr', 'role', 'gridcell');
  });

  it('should have proper heading hierarchy', () => {
    cy.visit('/dashboard');
    
    cy.get('h1').should('exist').and('be.visible');
    cy.get('h2').should('exist');
    
    // Check that h1 comes before h2
    cy.get('h1').then(($h1) => {
      cy.get('h2').then(($h2) => {
        expect($h1.index()).to.be.lessThan($h2.index());
      });
    });
  });

  it('should have sufficient color contrast', () => {
    cy.visit('/dashboard');
    cy.injectAxe();
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  it('should have proper form labels', () => {
    cy.visit('/patients');
    cy.get('[data-testid="add-patient-button"]').click();
    
    cy.get('[data-testid="patient-name-input"]')
      .should('have.attr', 'aria-label')
      .or('have.attr', 'aria-labelledby');
    
    cy.get('[data-testid="patient-email-input"]')
      .should('have.attr', 'aria-label')
      .or('have.attr', 'aria-labelledby');
  });

  it('should announce dynamic content changes', () => {
    cy.visit('/appointments');
    
    // Check for live regions
    cy.get('[aria-live="polite"]').should('exist');
    cy.get('[aria-live="assertive"]').should('exist');
  });

  it('should be usable with screen reader', () => {
    cy.visit('/patients');
    
    // Test that important content has proper semantic markup
    cy.get('main').should('exist');
    cy.get('nav').should('exist');
    cy.get('[role="banner"]').should('exist');
    cy.get('[role="contentinfo"]').should('exist');
  });

  it('should handle focus management in modals', () => {
    cy.visit('/patients');
    cy.get('[data-testid="add-patient-button"]').click();
    
    // Focus should be trapped in modal
    cy.get('[data-testid="patient-modal"]').should('be.visible');
    cy.focused().should('be.within', '[data-testid="patient-modal"]');
    
    // Escape should close modal and return focus
    cy.get('body').type('{esc}');
    cy.get('[data-testid="patient-modal"]').should('not.exist');
    cy.focused().should('have.attr', 'data-testid', 'add-patient-button');
  });

  it('should provide alternative text for images', () => {
    cy.visit('/dashboard');
    
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('should be accessible on mobile', () => {
    cy.setMobileViewport();
    cy.visit('/dashboard');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should support high contrast mode', () => {
    cy.visit('/dashboard');
    
    // Simulate high contrast mode
    cy.get('body').invoke('addClass', 'high-contrast');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should support reduced motion', () => {
    cy.visit('/dashboard');
    
    // Simulate reduced motion preference
    cy.window().then((win) => {
      Object.defineProperty(win, 'matchMedia', {
        writable: true,
        value: cy.stub().returns({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: cy.stub(),
          removeListener: cy.stub(),
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
          dispatchEvent: cy.stub(),
        }),
      });
    });
    
    cy.reload();
    
    // Check that animations are disabled
    cy.get('[data-testid="animated-element"]')
      .should('have.css', 'animation-duration', '0s');
  });

  it('should have proper error announcements', () => {
    cy.visit('/login');
    
    cy.get('[data-testid="login-button"]').click();
    
    // Error should be announced to screen readers
    cy.get('[role="alert"]').should('exist');
    cy.get('[aria-live="assertive"]').should('contain', 'Email es requerido');
  });

  it('should have proper loading announcements', () => {
    cy.visit('/patients');
    
    cy.intercept('GET', '/api/patients*', {
      delay: 2000,
      fixture: 'patients.json'
    }).as('slowLoad');
    
    cy.reload();
    
    // Loading state should be announced
    cy.get('[aria-live="polite"]').should('contain', 'Cargando');
  });
});