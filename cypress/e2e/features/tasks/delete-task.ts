import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Este passo já existe no seu outro arquivo, então o Cypress vai encontrá-lo.
// Given('está autenticado com o e-mail {string} e a senha {string}', ...);

// Este é um novo passo que precisamos definir. Ele cria a tarefa pela API.
Given('possui uma tarefa com o título {string}', (title: string) => {
    // Para ser consistente com seu projeto, vamos usar um comando customizado.
    // Você precisará adicionar o comando 'createTask' (instruções no Passo 3).
    cy.createTask(title);
});

When('acessa a página de tarefas', () => {
    cy.visit('/tasks');
});

When('clica no botão de deletar para a tarefa {string}', (title: string) => {
    // Este seletor assume que cada tarefa tem um 'data-testid="task-item"'
    // e o botão de deletar dentro dela tem 'data-testid="delete-button"'
    cy.contains('[data-testid="task-item"]', title)
      .find('[data-testid="delete-button"]')
      .click();
});

Then('a tarefa {string} não deve mais ser vista na lista', (title: string) => {
    cy.get('[data-testid="tasks-list"]').should('not.contain', title);
});