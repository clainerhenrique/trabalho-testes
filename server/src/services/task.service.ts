import { InvalidTaskNameError } from '../errors/task/InvalidTaskNameError';
import { TaskNotFoundError } from '../errors/task/TaskNotFoundError';
import { prisma } from '../utils/prisma';

export class TaskService {
    static async createTask(
        userId: number,
        data: {
            title: string;
            description?: string;
            dueDate?: string | null;
            priority?: string;
        },
    ) {
        // Validação de título vazio ou começando com número
        if (!data.title || /^\d/.test(data.title)) {
            throw new InvalidTaskNameError();
        }

        // --- LÓGICA DE DATA ADICIONADA AQUI ---
        if (data.dueDate) {
            const dueDate = new Date(data.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas as datas

            if (dueDate < today) {
                throw new Error('A data de vencimento não pode ser no passado');
            }
        }

        const validPriorities = ['low', 'medium', 'high'];
        const priority = data.priority && validPriorities.includes(data.priority) ? data.priority : null;

        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                priority: priority,
                userId,
            },
        });

        return task;
    }

    static async getTasks(userId: number, filters: { completed?: string; priority?: string }) {
        const { completed, priority } = filters;

        const tasks = await prisma.task.findMany({
            where: {
                userId,
                ...(completed !== undefined && { completed: completed === 'true' }),
                ...(priority && { priority }),
            },
            orderBy: { createdAt: 'desc' },
        });

        return tasks;
    }

    static async getTaskById(userId: number, id: number) {
        const task = await prisma.task.findUnique({
            where: { id, userId },
        });

        if (!task) {
            throw new TaskNotFoundError();
        }

        return task;
    }

    static async updateTask(
        userId: number,
        id: number,
        data: {
            title?: string;
            description?: string;
            completed?: boolean;
            dueDate?: string | null;
            priority?: string;
        },
    ) {
        // Validação de título na atualização
        if (data.title !== undefined) {
            if (!data.title || /^\d/.test(data.title)) {
                throw new InvalidTaskNameError();
            }
        }

        // Validação de data na atualização
        if (data.dueDate) {
            const dueDate = new Date(data.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                throw new Error('A data de vencimento não pode ser no passado');
            }
        }

        try {
            const updatedTask = await prisma.task.update({
                where: { id, userId },
                data: {
                    title: data.title,
                    description: data.description,
                    completed: data.completed,
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    priority: data.priority,
                },
            });

            return updatedTask;
        } catch (error) {
            throw new TaskNotFoundError();
        }
    }

    static async deleteTask(userId: number, id: number) {
        try {
            await prisma.task.delete({
                where: { id, userId },
            });
        } catch (error) {
            throw new TaskNotFoundError();
        }
    }
}