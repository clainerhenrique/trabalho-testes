/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock do middleware de autenticação para simular a autenticação durante o teste
jest.mock('../../middlewares/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.userId = testUser.id ?? 1;
        next();
    },
}));

import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../utils/prisma';
import { setupTestDB, disconnectTestDB, testUser } from '../setup.test.db';


let taskForTesting: { id: number };

beforeAll(async () => {
    await setupTestDB();
    
    taskForTesting = await prisma.task.create({
        data: {
            title: 'Tarefa para testar GET e DELETE',
            description: 'Descrição da tarefa',
            priority: 'medium',
            userId: testUser.id ?? 1,
        }
    });
});

afterAll(async () => {
    await disconnectTestDB();
});

describe('TaskController', () => {
    // Seu teste original, que continua aqui
    describe('POST /api/tasks', () => {
        it('deve criar tarefa com dados válidos', async () => {
            // Arrange (preparar)
            const taskData = {
                title: `Tarefa válida ${new Date()}`,
                description: 'Essa é uma tarefa válida',
                completed: false,
                priority: 'low',
            };

            // Act (agir)
            const response = await request(app).post('/api/tasks').send(taskData);

            // Assert (verificar)
            expect(response.statusCode).toBe(StatusCodes.CREATED);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(taskData.title);
        });
    });

    
    describe('GET /api/tasks', () => {
        it('deve retornar a lista de tarefas do usuário autenticado', async () => {
            // Act
            const response = await request(app).get('/api/tasks');

            // Assert
            expect(response.statusCode).toBe(StatusCodes.OK);
            expect(response.body).toBeInstanceOf(Array);
            // Verifica se a tarefa que criamos no beforeAll está na lista
            const taskTitles = response.body.map((task: any) => task.title);
            expect(taskTitles).toContain('Tarefa para testar GET e DELETE');
        });
    });

    
    describe('DELETE /api/tasks/:id', () => {
        it('deve deletar uma tarefa existente do usuário autenticado', async () => {
            // Act
            const response = await request(app).delete(`/api/tasks/${taskForTesting.id}`);

            // Assert
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);

            // Verifica no banco se a tarefa foi realmente deletada
            const taskInDb = await prisma.task.findUnique({
                where: { id: taskForTesting.id },
            });
            expect(taskInDb).toBeNull();
        });
    });
});