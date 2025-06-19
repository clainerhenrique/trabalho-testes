import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('que eu estou na página de registro', () => {
    // Presume que a rota para a página de registro é '/register'
    cy.visit('/register');
});

When('eu preencho o formulário de registro com dados válidos', () => {
    // Geramos um email único para cada execução do teste para evitar
    // o erro "usuário já cadastrado".
    const uniqueEmail = `teste-${new Date().getTime()}@exemplo.com`;

    // Usamos seletores 'data-cy' para tornar os testes mais estáveis.
    // Veja o Passo 3 para mais detalhes.
    cy.get('[data-cy="name-input"]').type('Usuário de Teste E2E');
    cy.get('[data-cy="email-input"]').type(uniqueEmail);
    cy.get('[data-cy="password-input"]').type('senha-muito-segura');
});

When('clico no botão de registrar', () => {
    cy.get('[data-cy="register-button"]').click();
});

Then('eu devo ser redirecionado para a página de login', () => {
    // Verifica se a URL mudou para a página de login após o registro
    cy.url().should('include', '/login');
});

Then('devo ver uma mensagem de sucesso do registro', () => {
    cy.contains('Cadastro realizado com sucesso! Redirecionando para login...').should('be.visible');
});