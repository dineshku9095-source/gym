import { ForbiddenException } from '@nestjs/common';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  it('never grants gym access from client gymId alone', () => {
    const prisma = {} as any;
    const tenant = new TenantService(prisma);
    const user = {
      id: 'u1',
      email: 'front@irondistrict.test',
      firstName: 'Raj',
      lastName: 'Front',
      platformRole: 'USER' as const,
      staffAssignments: [{ gymId: 'gym-iron', role: 'RECEPTIONIST' as const }],
    };

    expect(() => tenant.assertStaff(user, 'gym-peak')).toThrow(ForbiddenException);
    expect(tenant.assertStaff(user, 'gym-iron').gymId).toBe('gym-iron');
  });
});
