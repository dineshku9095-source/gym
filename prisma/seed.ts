import { PrismaClient, GymStatus, MembershipStatus, PaymentMethod, PaymentStatus, PlatformRole, StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD = 'Password123!';

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding Gymverse…');
  const passwordHash = await hash(PASSWORD);

  await prisma.notificationLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.membershipEvent.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.gymImage.deleteMany();
  await prisma.gymFacility.deleteMany();
  await prisma.gymMember.deleteMany();
  await prisma.gymStaff.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.platformSubscription.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gymverse.app',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  const ironOwner = await prisma.user.create({
    data: {
      email: 'owner@irondistrict.test',
      passwordHash,
      firstName: 'Ava',
      lastName: 'Iron',
      phone: '+91-9000000001',
    },
  });

  const ironManager = await prisma.user.create({
    data: {
      email: 'manager@irondistrict.test',
      passwordHash,
      firstName: 'Mia',
      lastName: 'Manager',
      phone: '+91-9000000002',
    },
  });

  const ironFront = await prisma.user.create({
    data: {
      email: 'front@irondistrict.test',
      passwordHash,
      firstName: 'Raj',
      lastName: 'Front',
      phone: '+91-9000000003',
    },
  });

  const peakOwner = await prisma.user.create({
    data: {
      email: 'owner@peakform.test',
      passwordHash,
      firstName: 'Noah',
      lastName: 'Peak',
      phone: '+91-9000000004',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'member1@test.com',
      passwordHash,
      firstName: 'Leo',
      lastName: 'Member',
      phone: '+91-9000000010',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'member2@test.com',
      passwordHash,
      firstName: 'Sara',
      lastName: 'Singh',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'member3@test.com',
      passwordHash,
      firstName: 'Dev',
      lastName: 'Patel',
    },
  });

  const pendingOwner = await prisma.user.create({
    data: {
      email: 'owner@fitforge.test',
      passwordHash,
      firstName: 'Kai',
      lastName: 'Forge',
    },
  });

  const iron = await prisma.gym.create({
    data: {
      name: 'Iron District',
      slug: 'iron-district',
      description: 'Bold strength training, HIIT, and recovery in the heart of the city.',
      address: '12 Forge Lane',
      city: 'Mumbai',
      state: 'MH',
      country: 'IN',
      postalCode: '400001',
      phone: '+91-22-40001000',
      email: 'hello@irondistrict.test',
      timezone: 'Asia/Kolkata',
      coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600',
      status: GymStatus.APPROVED,
      ownerId: ironOwner.id,
      facilities: {
        create: [
          { name: 'Free Weights', description: 'Olympic platforms & dumbbells', icon: 'dumbbell', sortOrder: 1 },
          { name: 'Cardio Zone', description: 'Treadmills, bikes, rowers', icon: 'heart', sortOrder: 2 },
          { name: 'Recovery', description: 'Sauna & stretch area', icon: 'sparkles', sortOrder: 3 },
        ],
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200', alt: 'Iron District floor', isCover: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200', alt: 'Training', sortOrder: 1 },
        ],
      },
    },
  });

  const peak = await prisma.gym.create({
    data: {
      name: 'Peak Form',
      slug: 'peak-form',
      description: 'Performance coaching for athletes and professionals.',
      address: '88 Summit Road',
      city: 'Bengaluru',
      state: 'KA',
      country: 'IN',
      postalCode: '560001',
      phone: '+91-80-40002000',
      email: 'hello@peakform.test',
      timezone: 'Asia/Kolkata',
      coverUrl: 'https://images.unsplash.com/photo-1571902943202-507c506eadfc?w=1600',
      status: GymStatus.APPROVED,
      ownerId: peakOwner.id,
      facilities: {
        create: [
          { name: 'Strength Floor', sortOrder: 1 },
          { name: 'Turf / Sled Track', sortOrder: 2 },
        ],
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1571902943202-507c506eadfc?w=1200', alt: 'Peak Form', isCover: true },
        ],
      },
    },
  });

  const pending = await prisma.gym.create({
    data: {
      name: 'Fit Forge',
      slug: 'fit-forge',
      description: 'Community gym awaiting platform approval.',
      city: 'Pune',
      state: 'MH',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      status: GymStatus.PENDING,
      ownerId: pendingOwner.id,
    },
  });

  await prisma.gymStaff.createMany({
    data: [
      { gymId: iron.id, userId: ironOwner.id, role: StaffRole.OWNER },
      { gymId: iron.id, userId: ironManager.id, role: StaffRole.MANAGER },
      { gymId: iron.id, userId: ironFront.id, role: StaffRole.RECEPTIONIST },
      { gymId: peak.id, userId: peakOwner.id, role: StaffRole.OWNER },
      { gymId: pending.id, userId: pendingOwner.id, role: StaffRole.OWNER },
    ],
  });

  await prisma.platformSubscription.createMany({
    data: [
      { gymId: iron.id, planName: 'pro', status: 'active' },
      { gymId: peak.id, planName: 'starter', status: 'active' },
      { gymId: pending.id, planName: 'free', status: 'trial' },
    ],
  });

  const ironMonthly = await prisma.membershipPlan.create({
    data: {
      gymId: iron.id,
      name: 'Monthly Unlimited',
      description: 'Full floor access for 30 days',
      durationDays: 30,
      price: 2499,
      sortOrder: 1,
    },
  });

  const ironQuarterly = await prisma.membershipPlan.create({
    data: {
      gymId: iron.id,
      name: 'Quarterly Strength',
      description: '90 days + 2 PT intros',
      durationDays: 90,
      price: 6499,
      sortOrder: 2,
    },
  });

  const peakMonthly = await prisma.membershipPlan.create({
    data: {
      gymId: peak.id,
      name: 'Peak Monthly',
      durationDays: 30,
      price: 2999,
    },
  });

  const gm1 = await prisma.gymMember.create({
    data: {
      gymId: iron.id,
      userId: member1.id,
      memberId: 'GYM-7K92P4',
    },
  });

  const gm2 = await prisma.gymMember.create({
    data: {
      gymId: iron.id,
      userId: member2.id,
      memberId: 'GYM-A3B8C1',
    },
  });

  const gm3 = await prisma.gymMember.create({
    data: {
      gymId: peak.id,
      userId: member3.id,
      memberId: 'GYM-P9X2M7',
    },
  });

  const gmPeakMember1 = await prisma.gymMember.create({
    data: {
      gymId: peak.id,
      userId: member1.id,
      memberId: 'GYM-PF1L90',
    },
  });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 10);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  const m1 = await prisma.membership.create({
    data: {
      gymId: iron.id,
      gymMemberId: gm1.id,
      planId: ironMonthly.id,
      status: MembershipStatus.ACTIVE,
      startDate: start,
      endDate: end,
      amountDue: 2499,
      amountPaid: 2499,
      activatedAt: start,
      events: {
        create: [
          { type: 'REQUESTED', toStatus: 'REQUESTED', actorUserId: member1.id },
          { type: 'ACTIVATED', fromStatus: 'REQUESTED', toStatus: 'ACTIVE', actorUserId: ironOwner.id, note: 'Paid cash at desk' },
        ],
      },
    },
  });

  const m2Start = new Date(now);
  m2Start.setDate(m2Start.getDate() - 95);
  const m2End = new Date(m2Start);
  m2End.setDate(m2End.getDate() + 90);

  await prisma.membership.create({
    data: {
      gymId: iron.id,
      gymMemberId: gm2.id,
      planId: ironQuarterly.id,
      status: MembershipStatus.EXPIRED,
      startDate: m2Start,
      endDate: m2End,
      amountDue: 6499,
      amountPaid: 6499,
      activatedAt: m2Start,
      events: {
        create: [{ type: 'EXPIRED', fromStatus: 'ACTIVE', toStatus: 'EXPIRED' }],
      },
    },
  });

  await prisma.membership.create({
    data: {
      gymId: peak.id,
      gymMemberId: gm3.id,
      planId: peakMonthly.id,
      status: MembershipStatus.ACTIVE,
      startDate: start,
      endDate: end,
      amountDue: 2999,
      amountPaid: 1500,
      activatedAt: start,
      events: {
        create: [{ type: 'ACTIVATED', toStatus: 'ACTIVE', actorUserId: peakOwner.id }],
      },
    },
  });

  await prisma.membership.create({
    data: {
      gymId: peak.id,
      gymMemberId: gmPeakMember1.id,
      planId: peakMonthly.id,
      status: MembershipStatus.REQUESTED,
      amountDue: 2999,
      amountPaid: 0,
      events: {
        create: [{ type: 'REQUESTED', toStatus: 'REQUESTED', actorUserId: member1.id }],
      },
    },
  });

  await prisma.payment.create({
    data: {
      gymId: iron.id,
      gymMemberId: gm1.id,
      membershipId: m1.id,
      amount: 2499,
      method: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      paidAt: start,
      referenceNumber: 'CASH-001',
      notes: 'Desk payment',
      recordedById: ironFront.id,
    },
  });

  await prisma.payment.create({
    data: {
      gymId: peak.id,
      gymMemberId: gm3.id,
      amount: 1500,
      method: PaymentMethod.UPI,
      status: PaymentStatus.PARTIAL,
      referenceNumber: 'UPI-8821',
      notes: 'Partial — balance due',
      recordedById: peakOwner.id,
    },
  });

  const localDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  await prisma.attendance.create({
    data: {
      gymId: iron.id,
      gymMemberId: gm1.id,
      membershipId: m1.id,
      localDate,
      staffUserId: ironFront.id,
      notes: 'Seed check-in',
    },
  });

  await prisma.notificationPreference.createMany({
    data: [
      { userId: member1.id },
      { userId: member2.id },
      { userId: member3.id },
    ],
  });

  await prisma.platformSetting.createMany({
    data: [
      { key: 'reminder.offsets', value: [7, 3, 1, 0, -1] },
      { key: 'platform.name', value: 'Gymverse' },
      { key: 'attendance.allowSameDayOverrideRoles', value: ['OWNER', 'MANAGER'] },
    ],
  });

  await prisma.supportTicket.create({
    data: {
      gymId: iron.id,
      requesterId: ironOwner.id,
      subject: 'Need invoice branding options',
      body: 'Can we add gym logo to printable receipts?',
      priority: 'MEDIUM',
    },
  });

  await prisma.auditLog.create({
    data: {
      gymId: iron.id,
      actorId: admin.id,
      action: 'SEED',
      entityType: 'Platform',
      entityId: 'bootstrap',
      meta: { note: 'Initial seed completed' },
    },
  });

  console.log('Seed complete.');
  console.log('Password for all demo users:', PASSWORD);
  console.log('Gyms:', iron.slug, peak.slug, pending.slug, `(${pending.status})`);
  console.log('Member ID demo:', 'GYM-7K92P4');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
