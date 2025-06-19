Feature: Autenticação de Usuário

  Scenario: Registrar um novo usuário com sucesso
    Given que eu estou na página de registro
    When eu preencho o formulário de registro com dados válidos
    And clico no botão de registrar
    Then eu devo ser redirecionado para a página de login
    And devo ver uma mensagem de sucesso do registro