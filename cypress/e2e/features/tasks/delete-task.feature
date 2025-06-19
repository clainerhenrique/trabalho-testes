Feature: Gerenciamento de Tarefas

  Scenario: Deletar uma tarefa existente
    Given está autenticado com o e-mail "usuario@valido.teste" e a senha "senha-valida"
    And possui uma tarefa com o título "Tarefa que será deletada"
    When acessa a página de tarefas
    And clica no botão de deletar para a tarefa "Tarefa que será deletada"
    Then a tarefa "Tarefa que será deletada" não deve mais ser vista na lista