import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/auth.service';
import { prisma } from '../../utils/prisma';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../utils/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

describe('AuthService', () => {
    const mockUser = {
        id: 1,
        email: 'usuario@exemplo.teste',
        name: 'Usuário Exemplo',
        createdAt: new Date(),
    };
    
    const hashedPassword = 'senha-criptografada';
    const password = 'senha-valida';

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('deve cadastrar um novo usuário e retornar o seu token', async () => {
            // Arrange (preparar)
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                ...mockUser,
                password: hashedPassword,
            });
            (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

            // Act (agir)
            const result = await AuthService.registerUser(mockUser.email, password, mockUser.name);

            // Assert (verificar)
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: mockUser.email },
            });
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: mockUser.email,
                    password: hashedPassword,
                    name: mockUser.name,
                },
            });
            expect(result.token).toBe('mockedToken');
            expect(result.user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
            });
        });
    });

    describe('loginUser', () => {
        it('deve realizar o login do usuário e retornar o seu token', async () => {
            // Arrange (preparar)
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

            // Act (agir)
            const result = await AuthService.loginUser(mockUser.email, password);

            // Assert (verificar)
            expect(result.token).toBe('mockedToken');
            expect(result.user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
            });
        });
    });

    describe('getUserById', () => {
        it('deve retornar o usuário com base no seu identificador', async () => {
            // Arrange (preparar)
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            // Act (agir)
            const user = await AuthService.getUserById(1);

            // Assert (verificar)
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                select: { id: true, email: true, name: true, createdAt: true },
            });
            expect(user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                createdAt: mockUser.createdAt,
            });
        });
    });

    describe('getUserFromTokenPayload', () => {
        it('deve retornar dados do usuário com base no identificador retornado pelo token', async () => {
            // Arrange (preparar)
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            // Act (agir)
            const user = await AuthService.getUserFromTokenPayload(1);

            // Assert (verificar)
            expect(user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                createdAt: mockUser.createdAt,
            });
        });
    });

    describe('refreshToken', () => {
        it('deve retornar um token novo ao atualizar token se o token antigo for válido', () => {
            // Arrange (preparar)
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
            (jwt.sign as jest.Mock).mockReturnValue('tokenNovo');

            // Act (agir)
            const newToken = AuthService.refreshToken('tokenAntigo');

            // Assert (verificar)
            expect(newToken).toBe('tokenNovo');
        });
    });


    describe('AuthService - Testes adicionais', () => {
        const emailExistente = 'usuario@exemplo.teste';
      
        it('não deve cadastrar usuário se e-mail já estiver em uso', async () => {
          (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue({
            id: 1,
            email: emailExistente,
            name: 'Usuário',
            password: 'senha-criptografada',
            createdAt: new Date(),
          });
      
          await expect(
            AuthService.registerUser(emailExistente, '123456', 'Usuário')
        ).rejects.toThrow('Usuário já cadastrado');
    });

    
    describe('AuthService - Cenários de Falha e Validação', () => {

        const emailInexistente = 'naoexiste@exemplo.com';
        const senhaCorreta = 'senha';
        const senhaIncorreta = 'senha-errada';

        it('deve lançar erro ao tentar fazer login com um e-mail que não existe', async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
            // Act & Assert
            await expect(AuthService.loginUser(emailInexistente, senhaCorreta)).rejects.toThrow('Credenciais inválidas');
        });
    
        it('deve lançar erro ao tentar fazer login com a senha incorreta', async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false); // A senha não bate
    
            // Act & Assert
            await expect(AuthService.loginUser(mockUser.email, senhaIncorreta)).rejects.toThrow('Credenciais inválidas');
        });
    
        it('deve lançar erro ao tentar registrar com um formato de e-mail inválido', async () => {
            // Arrange
            const emailInvalido = 'email-invalido';
            
            // Act & Assert
            // Este teste espera que a validação esteja no serviço.
            await expect(AuthService.registerUser(emailInvalido, senhaCorreta, 'Nome')).rejects.toThrow('Formato de e-mail inválido');
        });
    
        it('deve lançar erro ao tentar registrar com uma senha muito curta', async () => {
            // Arrange
            const senhaCurta = '123';
    
            // Act & Assert
            await expect(AuthService.registerUser(mockUser.email, senhaCurta, 'Nome')).rejects.toThrow('A senha deve ter pelo menos 6 caracteres');
        });
    
    });
});
});