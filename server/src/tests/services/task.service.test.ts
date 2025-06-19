import { InvalidTaskNameError } from '../../errors/task/InvalidTaskNameError';
import { TaskNotFoundError } from '../../errors/task/TaskNotFoundError';
import { TaskService } from '../../services/task.service';
import { prisma } from '../../utils/prisma';

jest.mock('../../utils/prisma', () => ({
    prisma: {
        task: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

describe('TaskService', () => {
    const userId = 1;
    const tarefasMock = [
        { id: 1, title: 'Tarefa 1', userId, completed: true, priority: 'high' },
        { id: 2, title: 'Tarefa 2', userId, completed: false, priority: 'high' },
        { id: 3, title: 'Tarefa 3', userId, completed: true, priority: 'medium' },
        { id: 4, title: 'Tarefa 4', userId, completed: true, priority: 'high' },
    ];

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createTask', () => {
        it('deve criar tarefa quando o título for válido', async () => {
            const dadosValidos = {
                title: 'Tarefa válida',
                description: 'Essa é uma tarefa com o título válido',
            };
            const tarefaCriadaMock = {
                id: 1, ...dadosValidos, dueDate: null, priority: null, userId, createdAt: new Date(), updatedAt: new Date(),
            };
            (prisma.task.create as jest.Mock).mockResolvedValue(tarefaCriadaMock);
            const tarefa = await TaskService.createTask(userId, dadosValidos);
            
            
            expect(prisma.task.create).toHaveBeenCalledWith({
                data: {
                    ...dadosValidos,
                    dueDate: null,
                    priority: null, 
                    userId,
                },
            });

            expect(tarefa).toEqual(tarefaCriadaMock);
        });

        it('deve lançar erro se o título da tarefa começar com número', async () => {
            const dadosInvalidos = { title: '1 Tarefa inválida', description: 'Essa é uma tarefa com o título inválido' };
            await expect(TaskService.createTask(userId, dadosInvalidos)).rejects.toBeInstanceOf(InvalidTaskNameError);
        });

        it('deve criar tarefa com todos os campos preenchidos', async () => {
            const dadosEntrada = { title: 'Nova tarefa', description: 'Descrição', dueDate: '2025-06-19', priority: 'medium' };
            const tarefaEsperada = { id: 1, ...dadosEntrada, dueDate: new Date(dadosEntrada.dueDate), userId };
            (prisma.task.create as jest.Mock).mockResolvedValue(tarefaEsperada);
            const resultado = await TaskService.createTask(userId, dadosEntrada);
            expect(prisma.task.create).toHaveBeenCalledWith({
                data: { ...dadosEntrada, dueDate: new Date(dadosEntrada.dueDate), userId, },
            });
            expect(resultado).toEqual(tarefaEsperada);
        });

        it('deve aceitar data de vencimento nula', async () => {
            const dadosEntrada = { title: 'Tarefa sem data de vencimento', dueDate: null };
            const tarefaEsperada = { id: 2, ...dadosEntrada, userId };
            (prisma.task.create as jest.Mock).mockResolvedValue(tarefaEsperada);
            const resultado = await TaskService.createTask(userId, dadosEntrada);
            expect(resultado.dueDate).toBeNull();
        });

        it('deve lançar um erro ao tentar criar uma tarefa com data de vencimento no passado', async () => {
            const pastDate = new Date('2025-06-17T00:00:00.000Z');
            const dadosComDataPassada = { title: 'Tarefa com data no passado', dueDate: pastDate.toISOString() };
            await expect(TaskService.createTask(userId, dadosComDataPassada)).rejects.toThrow('A data de vencimento não pode ser no passado');
        });
    });

    describe('getTasks', () => {
        it('deve retornar tarefas filtradas por prioridade e status de conclusão', async () => {
            const filtros = { completed: 'true', priority: 'high' };
            const tarefasFiltradas = tarefasMock.filter((t) => t.completed && t.priority === 'high');
            (prisma.task.findMany as jest.Mock).mockResolvedValue(tarefasFiltradas);
            const resultado = await TaskService.getTasks(userId, filtros);
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                where: { userId, completed: true, priority: 'high' },
                orderBy: { createdAt: 'desc' },
            });
            expect(resultado).toEqual(tarefasFiltradas);
        });

        it('deve retornar todas as tarefas se não houver filtros', async () => {
            (prisma.task.findMany as jest.Mock).mockResolvedValue(tarefasMock);
            const resultado = await TaskService.getTasks(userId, {});
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            expect(resultado).toEqual(tarefasMock);
        });
    });

    describe('getTaskById', () => {
        it('deve retornar uma tarefa existente pelo seu identificador', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue(tarefasMock[0]);
            const resultado = await TaskService.getTaskById(userId, tarefasMock[0].id);
            expect(resultado).toEqual(tarefasMock[0]);
        });

        it('deve lançar erro ao buscar tarefa pelo identificador se a tarefa não existir', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(TaskService.getTaskById(userId, 999)).rejects.toBeInstanceOf(TaskNotFoundError);
        });
    });

    describe('updateTask', () => {
        it('deve atualizar a tarefa com os dados fornecidos', async () => {
            const dadosAtualizacao = { title: 'Tarefa atualizada', completed: true, dueDate: '2025-06-20' };
            const tarefaAtualizada = { id: 1, ...dadosAtualizacao, dueDate: new Date(dadosAtualizacao.dueDate), userId };
            (prisma.task.update as jest.Mock).mockResolvedValue(tarefaAtualizada);
            const resultado = await TaskService.updateTask(userId, 1, dadosAtualizacao);
            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: 1, userId },
                data: { ...dadosAtualizacao, dueDate: new Date(dadosAtualizacao.dueDate) },
            });
            expect(resultado).toEqual(tarefaAtualizada);
        });

        it('deve permitir atualização parcial da tarefa', async () => {
            const dadosAtualizacao = { title: 'Tarefa com o título atualizado' };
            const tarefaAtualizada = { id: 2, ...dadosAtualizacao, userId };
            (prisma.task.update as jest.Mock).mockResolvedValue(tarefaAtualizada);
            const resultado = await TaskService.updateTask(userId, 2, dadosAtualizacao);
            expect(resultado).toEqual(tarefaAtualizada);
        });
    });

    describe('deleteTask', () => {
        it('deve excluir a tarefa pelo seu identificador', async () => {
            (prisma.task.delete as jest.Mock).mockResolvedValue(undefined);
            await TaskService.deleteTask(userId, 1);
            expect(prisma.task.delete).toHaveBeenCalledWith({
                where: { id: 1, userId },
            });
        });
    });
    
    describe('TaskService - Cenários de Autorização', () => {
        const anotherUserId = 2;
        const taskId = 10;

        it('deve lançar erro ao tentar buscar uma tarefa que pertence a outro usuário', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(TaskService.getTaskById(userId, taskId)).rejects.toBeInstanceOf(TaskNotFoundError);
        });

        it('deve lançar erro ao tentar atualizar uma tarefa que pertence a outro usuário', async () => {
            (prisma.task.update as jest.Mock).mockRejectedValue(new TaskNotFoundError());
            await expect(TaskService.updateTask(userId, taskId, { title: 'Nova Tentativa' })).rejects.toBeInstanceOf(TaskNotFoundError);
        });

        it('deve lançar erro ao tentar deletar uma tarefa que pertence a outro usuário', async () => {
            (prisma.task.delete as jest.Mock).mockRejectedValue(new TaskNotFoundError());
            await expect(TaskService.deleteTask(userId, taskId)).rejects.toBeInstanceOf(TaskNotFoundError);
        });

        it('deve criar tarefa com prioridade nula se uma prioridade inválida for fornecida', async () => {
            const dados = { title: 'Tarefa com prioridade estranha', priority: 'MUITO_URGENTE' };
            const tarefaCriada = { id: 5, ...dados, priority: null, userId };
            (prisma.task.create as jest.Mock).mockResolvedValue(tarefaCriada);
            const tarefa = await TaskService.createTask(userId, dados);
            expect(tarefa.priority).toBeNull();
        });
    });

    describe('TaskService - Casos de Borda e Validações Adicionais', () => {
        it('deve retornar um array vazio ao buscar tarefas de um usuário que não tem nenhuma', async () => {
            (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
            const resultado = await TaskService.getTasks(userId, {});
            expect(resultado).toEqual([]);
        });
    
        it('deve lançar erro ao tentar criar uma tarefa com título vazio', async () => {
            const dadosInvalidos = { title: '', description: 'Título não pode ser vazio' };
            await expect(TaskService.createTask(userId, dadosInvalidos)).rejects.toThrow(InvalidTaskNameError);
        });
    
        it('deve lançar erro ao tentar atualizar uma tarefa com um título que começa com número', async () => {
            const dadosInvalidos = { title: '2 Título inválido' };
            await expect(TaskService.updateTask(userId, 1, dadosInvalidos)).rejects.toThrow(InvalidTaskNameError);
        });
    
        it('deve filtrar corretamente as tarefas por status "não concluído"', async () => {
            const filtros = { completed: 'false' };
            const tarefasNaoConcluidas = tarefasMock.filter(t => !t.completed);
            (prisma.task.findMany as jest.Mock).mockResolvedValue(tarefasNaoConcluidas);
            const resultado = await TaskService.getTasks(userId, filtros);
            expect(resultado).toEqual(tarefasNaoConcluidas);
        });
    
        it('deve atualizar apenas o status "completed" de uma tarefa', async () => {
            const taskId = 2;
            const dados = { completed: true };
            const tarefaAtualizada = { ...tarefasMock.find(t => t.id === taskId), ...dados };
            (prisma.task.update as jest.Mock).mockResolvedValue(tarefaAtualizada);
            const resultado = await TaskService.updateTask(userId, taskId, dados);
            expect(resultado.completed).toBe(true);
        });
    
        it('deve lançar TaskNotFoundError ao tentar deletar uma tarefa com ID que não existe', async () => {
            const idInexistente = 999;
            (prisma.task.delete as jest.Mock).mockRejectedValue(new TaskNotFoundError());
            await expect(TaskService.deleteTask(userId, idInexistente)).rejects.toBeInstanceOf(TaskNotFoundError);
        });
    });
});