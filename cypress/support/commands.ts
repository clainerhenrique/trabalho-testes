/* eslint-disable @typescript-eslint/no-namespace */

Cypress.Commands.add('registerUser', (user) => {
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, user);
});

Cypress.Commands.add('resetDatabase', () => {
    cy.request('POST', `${Cypress.env('apiUrl')}/test/reset-database`);
});

Cypress.Commands.add('login', (email: string, password: string) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { email, password },
    }).then(({ body }) => {
        expect(body).to.have.property('token');
        window.localStorage.setItem('token', body.token);
    });
});

// --- ADICIONADO ---
Cypress.Commands.add('createTask', (title: string) => {
    // Pega o token que o comando cy.login() salvou
    const authToken = window.localStorage.getItem('token');

    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/tasks`, // Usa a variável de ambiente da API
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        body: {
            title: title,
            description: 'Criada pelo teste E2E',
        },
    });
});


declare global {
    namespace Cypress {
        interface Chainable {
            resetDatabase(): Chainable<void>;
            registerUser(user: { name: string; email: string; password: string }): Chainable<void>;
            login(email: string, password: string): Chainable<void>;
            
            createTask(title: string): Chainable<void>;
            
        }
    }
}

export {};