describe('App smoke test', () => {
  it('loads the homepage successfully', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.url().should('include', '/');
  });
});
