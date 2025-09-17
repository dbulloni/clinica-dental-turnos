describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
    cy.get('[data-testid="forgot-password-link"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-error"]').should('contain', 'Email es requerido');
    cy.get('[data-testid="password-error"]').should('contain', 'Contraseña es requerida');
  });

  it('should show validation error for invalid email', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-error"]').should('contain', 'Email inválido');
  });

  it('should successfully login with valid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user-1',
            name: 'Admin Test',
            email: 'admin@test.com',
            role: 'admin'
          }
        }
      }
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl + '/dashboard');
    cy.window().its('localStorage.token').should('exist');
  });

  it('should show error message for invalid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        error: 'Credenciales inválidas'
      }
    }).as('loginError');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginError');
    cy.get('[data-testid="error-message"]').should('contain', 'Credenciales inválidas');
  });

  it('should handle server error gracefully', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 500,
      body: {
        error: 'Error interno del servidor'
      }
    }).as('serverError');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@serverError');
    cy.get('[data-testid="error-message"]').should('contain', 'Error interno del servidor');
  });

  it('should show loading state during login', () => {
    cy.intercept('POST', '/api/auth/login', {
      delay: 2000,
      statusCode: 200,
      body: {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user-1',
            name: 'Admin Test',
            email: 'admin@test.com',
            role: 'admin'
          }
        }
      }
    }).as('slowLogin');

    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="login-button"]').should('be.disabled');
    cy.get('[data-testid="login-button"]').should('contain', 'Iniciando sesión...');
  });

  it('should redirect to forgot password page', () => {
    cy.get('[data-testid="forgot-password-link"]').click();
    cy.url().should('include', '/forgot-password');
  });

  it('should be accessible', () => {
    cy.checkAccessibility();
  });

  it('should work on mobile devices', () => {
    cy.setMobileViewport();
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should remember user preference for "Remember me"', () => {
    cy.get('[data-testid="remember-me-checkbox"]').check();
    cy.get('[data-testid="email-input"]').type('admin@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 'user-1',
            name: 'Admin Test',
            email: 'admin@test.com',
            role: 'admin'
          }
        }
      }
    }).as('loginWithRemember');

    cy.get('[data-testid="login-button"]').click();
    cy.wait('@loginWithRemember');
    
    cy.window().its('localStorage.refreshToken').should('exist');
  });
});