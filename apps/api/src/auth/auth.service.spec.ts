import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const passwordHash =
    '$2b$10$rQZ8K8Y5Y5Y5Y5Y5Y5Y5YuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  it('rejects invalid login credentials', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    const jwt = { signAsync: jest.fn() } as any;
    const audit = { log: jest.fn() } as any;
    const service = new AuthService(prisma, jwt, audit);

    await expect(service.login('nobody@test.com', 'Password123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('issues token for valid bcrypt password', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Password123!', 10);
    const user = {
      id: 'u1',
      email: 'member1@test.com',
      passwordHash: hash,
      isActive: true,
      firstName: 'Leo',
      lastName: 'Member',
      platformRole: 'USER',
      phone: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      staffAssignments: [],
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce({ ...user, staffAssignments: [] }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ ...user, staffAssignments: [] }),
      },
    } as any;
    const jwt = { signAsync: jest.fn().mockResolvedValue('tok') } as any;
    const audit = { log: jest.fn() } as any;
    const service = new AuthService(prisma, jwt, audit);

    const result = await service.login('member1@test.com', 'Password123!');
    expect(result.accessToken).toBe('tok');
    expect(result.user.email).toBe('member1@test.com');
    expect(audit.log).toHaveBeenCalled();
    void passwordHash;
  });
});
