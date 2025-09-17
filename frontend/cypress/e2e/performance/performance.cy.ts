describe('Performance Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load dashboard within acceptable time', () => {
    cy.measurePerformance('dashboard-load');
    cy.visit('/dashboard');
    cy.get('[data-testid="dashboard-content"]').should('be.visible');
    cy.endPerformanceMeasure('dashboard-load');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('dashboard-load')[0];
      expect(measure.duration).to.be.lessThan(3000); // 3 seconds
    });
  });

  it('should have good Core Web Vitals', () => {
    cy.visit('/dashboard');
    
    cy.window().then((win) => {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        expect(lastEntry.startTime).to.be.lessThan(2500); // 2.5 seconds
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay (FID) - simulated
      cy.get('[data-testid="interactive-element"]').click();
      
      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        expect(clsValue).to.be.lessThan(0.1); // Good CLS score
      }).observe({ entryTypes: ['layout-shift'] });
    });
  });

  it('should load patients list efficiently', () => {
    cy.measurePerformance('patients-load');
    cy.visit('/patients');
    cy.get('[data-testid="patients-list"]').should('be.visible');
    cy.endPerformanceMeasure('patients-load');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('patients-load')[0];
      expect(measure.duration).to.be.lessThan(2000); // 2 seconds
    });
  });

  it('should handle large datasets efficiently', () => {
    // Mock large dataset
    cy.intercept('GET', '/api/patients*', {
      body: {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: `patient-${i}`,
          name: `Patient ${i}`,
          email: `patient${i}@example.com`,
          phone: `+54 11 ${i.toString().padStart(8, '0')}`,
          document: i.toString().padStart(8, '0'),
          isActive: true
        })),
        pagination: {
          page: 1,
          limit: 50,
          total: 1000,
          totalPages: 20
        }
      }
    }).as('getLargeDataset');
    
    cy.measurePerformance('large-dataset-render');
    cy.visit('/patients');
    cy.wait('@getLargeDataset');
    cy.get('[data-testid="patients-list"]').should('be.visible');
    cy.endPerformanceMeasure('large-dataset-render');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('large-dataset-render')[0];
      expect(measure.duration).to.be.lessThan(5000); // 5 seconds for large dataset
    });
  });

  it('should have efficient search performance', () => {
    cy.visit('/patients');
    
    cy.measurePerformance('search-performance');
    cy.get('[data-testid="patient-search"]').type('Juan');
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.endPerformanceMeasure('search-performance');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('search-performance')[0];
      expect(measure.duration).to.be.lessThan(500); // 500ms for search
    });
  });

  it('should have efficient calendar rendering', () => {
    cy.measurePerformance('calendar-render');
    cy.visit('/appointments');
    cy.get('[data-testid="calendar-view"]').should('be.visible');
    cy.endPerformanceMeasure('calendar-render');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('calendar-render')[0];
      expect(measure.duration).to.be.lessThan(2000); // 2 seconds
    });
  });

  it('should handle modal opening efficiently', () => {
    cy.visit('/patients');
    
    cy.measurePerformance('modal-open');
    cy.get('[data-testid="add-patient-button"]').click();
    cy.get('[data-testid="patient-modal"]').should('be.visible');
    cy.endPerformanceMeasure('modal-open');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('modal-open')[0];
      expect(measure.duration).to.be.lessThan(300); // 300ms for modal
    });
  });

  it('should have efficient form validation', () => {
    cy.visit('/patients');
    cy.get('[data-testid="add-patient-button"]').click();
    
    cy.measurePerformance('form-validation');
    cy.get('[data-testid="patient-name-input"]').type('Test');
    cy.get('[data-testid="patient-name-input"]').clear();
    cy.get('[data-testid="name-error"]').should('be.visible');
    cy.endPerformanceMeasure('form-validation');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('form-validation')[0];
      expect(measure.duration).to.be.lessThan(100); // 100ms for validation
    });
  });

  it('should have good memory usage', () => {
    cy.visit('/dashboard');
    
    cy.window().then((win) => {
      if ('memory' in win.performance) {
        const memory = (win.performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        expect(memoryUsage).to.be.lessThan(0.8); // Less than 80% memory usage
      }
    });
  });

  it('should handle navigation efficiently', () => {
    cy.visit('/dashboard');
    
    cy.measurePerformance('navigation');
    cy.get('[data-testid="patients-nav-link"]').click();
    cy.url().should('include', '/patients');
    cy.get('[data-testid="patients-list"]').should('be.visible');
    cy.endPerformanceMeasure('navigation');
    
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('navigation')[0];
      expect(measure.duration).to.be.lessThan(1000); // 1 second for navigation
    });
  });

  it('should have efficient image loading', () => {
    cy.visit('/dashboard');
    
    cy.get('img').each(($img) => {
      cy.wrap($img).should('be.visible');
      cy.wrap($img).should('have.prop', 'complete', true);
    });
  });

  it('should handle concurrent requests efficiently', () => {
    cy.visit('/dashboard');
    
    // Simulate multiple concurrent requests
    cy.window().then((win) => {
      const startTime = win.performance.now();
      
      Promise.all([
        fetch('/api/patients'),
        fetch('/api/appointments'),
        fetch('/api/professionals'),
        fetch('/api/treatment-types')
      ]).then(() => {
        const endTime = win.performance.now();
        const duration = endTime - startTime;
        expect(duration).to.be.lessThan(3000); // 3 seconds for all requests
      });
    });
  });

  it('should have efficient bundle size', () => {
    cy.visit('/dashboard');
    
    cy.window().then((win) => {
      // Check that main bundle is not too large
      const scripts = Array.from(win.document.querySelectorAll('script[src]'));
      scripts.forEach((script: any) => {
        if (script.src.includes('main')) {
          cy.request(script.src).then((response) => {
            const sizeInKB = response.body.length / 1024;
            expect(sizeInKB).to.be.lessThan(500); // Less than 500KB
          });
        }
      });
    });
  });
});