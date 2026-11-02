import { ConflictException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  const staffUser = {
    id: 'staff1',
    email: 'front@irondistrict.test',
    firstName: 'Raj',
    lastName: 'Front',
    platformRole: 'USER' as const,
    staffAssignments: [
      { gymId: 'gym-iron', role: 'RECEPTIONIST' as const },
    ],
  };

  it('rejects duplicate same-day check-in without override', async () => {
    const member = {
      id: 'gm1',
      gymId: 'gym-iron',
      memberId: 'GYM-7K92P4',
      isActive: true,
      user: { id: 'u1', firstName: 'Leo', lastName: 'Member', email: 'm@t.com', avatarUrl: null },
      memberships: [
        {
          id: 'mem1',
          status: 'ACTIVE',
          endDate: new Date(Date.now() + 86400000 * 10),
          plan: { name: 'Monthly' },
        },
      ],
    };

    const prisma = {
      gymMember: { findFirst: jest.fn().mockResolvedValue(member) },
      attendance: {
        findUnique: jest.fn().mockResolvedValue({ id: 'att1' }),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    const audit = { log: jest.fn() } as any;
    const tenant = {
      assertStaff: jest.fn().mockReturnValue({ gymId: 'gym-iron', role: 'RECEPTIONIST' }),
      getAssignment: jest.fn().mockReturnValue(staffUser.staffAssignments[0]),
      isSuperAdmin: jest.fn().mockReturnValue(false),
    } as any;

    const service = new AttendanceService(prisma, audit, tenant);

    await expect(
      service.checkIn(staffUser, 'gym-iron', { memberId: 'GYM-7K92P4' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.attendance.create).not.toHaveBeenCalled();
  });
});
