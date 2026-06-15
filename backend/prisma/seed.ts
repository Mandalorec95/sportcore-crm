import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding SportPass CRM...');

  const hash = (p: string) => bcrypt.hash(p, 10);

  // Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-demo-001' },
    update: {},
    create: {
      id: 'org-demo-001',
      name: 'Клуб единоборств "Феникс"',
      sportTypes: ['boxing', 'wrestling', 'sambo'],
      city: 'Москва',
    },
  });
  console.log('✅ Organization:', org.name);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sportcrm.ru' },
    update: {},
    create: {
      id: 'user-admin-001',
      orgId: org.id,
      email: 'admin@sportcrm.ru',
      passwordHash: await hash('demo123'),
      fullName: 'Иванов Пётр Алексеевич',
      role: 'admin',
    },
  });

  // Coach 1
  const coachUser1 = await prisma.user.upsert({
    where: { email: 'coach@sportcrm.ru' },
    update: {},
    create: {
      id: 'user-coach-001',
      orgId: org.id,
      email: 'coach@sportcrm.ru',
      passwordHash: await hash('demo123'),
      fullName: 'Исмаилов Рустам Магомедович',
      role: 'coach',
    },
  });
  const coach1 = await prisma.coach.upsert({
    where: { userId: coachUser1.id },
    update: {},
    create: { id: 'coach-001', userId: coachUser1.id, orgId: org.id, sportTypes: ['boxing', 'sambo'] },
  });

  // Coach 2
  const coachUser2 = await prisma.user.upsert({
    where: { email: 'coach2@sportcrm.ru' },
    update: {},
    create: {
      id: 'user-coach-002',
      orgId: org.id,
      email: 'coach2@sportcrm.ru',
      passwordHash: await hash('demo123'),
      fullName: 'Магомедов Алибек Садулаевич',
      role: 'coach',
    },
  });
  const coach2 = await prisma.coach.upsert({
    where: { userId: coachUser2.id },
    update: {},
    create: { id: 'coach-002', userId: coachUser2.id, orgId: org.id, sportTypes: ['wrestling'] },
  });
  console.log('✅ Coaches created');

  // Groups
  const group1 = await prisma.trainingGroup.upsert({
    where: { id: 'group-001' },
    update: {},
    create: {
      id: 'group-001', orgId: org.id, name: 'Самбо 8–10 лет', sportType: 'sambo',
      coachId: coach1.id, ageFrom: 8, ageTo: 10, capacity: 20, level: 'beginner', monthlyFee: 3500,
    },
  });
  const group2 = await prisma.trainingGroup.upsert({
    where: { id: 'group-002' },
    update: {},
    create: {
      id: 'group-002', orgId: org.id, name: 'Бокс 11–13 лет', sportType: 'boxing',
      coachId: coach1.id, ageFrom: 11, ageTo: 13, capacity: 16, level: 'intermediate', monthlyFee: 4000,
    },
  });
  const group3 = await prisma.trainingGroup.upsert({
    where: { id: 'group-003' },
    update: {},
    create: {
      id: 'group-003', orgId: org.id, name: 'Борьба 14–16 лет', sportType: 'wrestling',
      coachId: coach2.id, ageFrom: 14, ageTo: 16, capacity: 15, level: 'advanced', monthlyFee: 4500,
    },
  });

  // Schedules
  for (const [gid, days] of [
    ['group-001', ['mon', 'wed', 'fri']],
    ['group-002', ['tue', 'thu', 'sat']],
    ['group-003', ['mon', 'wed', 'fri']],
  ] as [string, string[]][]) {
    for (const day of days) {
      await prisma.schedule.create({
        data: { groupId: gid, weekday: day as any, startTime: '17:00', endTime: '18:30', location: 'Зал №1' },
      }).catch(() => {});
    }
  }
  console.log('✅ Groups & schedules created');

  // Athletes + Parents
  const athletesData = [
    { id: 'ath-001', fn: 'Адам', ln: 'Мусаев', bd: '2015-03-12', group: group1.id, parentName: 'Мусаева Амина', parentPhone: '+79991234501', parentEmail: 'parent@sportcrm.ru', medExpiry: 30, payStatus: 'paid' },
    { id: 'ath-002', fn: 'Ислам', ln: 'Ахмадов', bd: '2015-07-22', group: group1.id, parentName: 'Ахмадова Зайнаб', parentPhone: '+79991234502', parentEmail: 'parent2@sportcrm.ru', medExpiry: -5, payStatus: 'debt' },
    { id: 'ath-003', fn: 'Саид', ln: 'Темиров', bd: '2016-01-15', group: group1.id, parentName: 'Темирова Патимат', parentPhone: '+79991234503', parentEmail: 'parent3@sportcrm.ru', medExpiry: 10, payStatus: 'partial' },
    { id: 'ath-004', fn: 'Алихан', ln: 'Дадаев', bd: '2014-09-30', group: group2.id, parentName: 'Дадаева Хеда', parentPhone: '+79991234504', parentEmail: 'parent4@sportcrm.ru', medExpiry: 60, payStatus: 'paid' },
    { id: 'ath-005', fn: 'Муса', ln: 'Исаев', bd: '2014-05-18', group: group2.id, parentName: 'Исаева Лейла', parentPhone: '+79991234505', parentEmail: 'parent5@sportcrm.ru', medExpiry: 8, payStatus: 'debt' },
    { id: 'ath-006', fn: 'Хасан', ln: 'Умаров', bd: '2013-11-05', group: group2.id, parentName: 'Умарова Таус', parentPhone: '+79991234506', parentEmail: 'parent6@sportcrm.ru', medExpiry: 45, payStatus: 'paid' },
    { id: 'ath-007', fn: 'Арби', ln: 'Магомадов', bd: '2011-04-20', group: group3.id, parentName: 'Магомадова Седа', parentPhone: '+79991234507', parentEmail: 'parent7@sportcrm.ru', medExpiry: 90, payStatus: 'paid' },
    { id: 'ath-008', fn: 'Шамиль', ln: 'Гайтаев', bd: '2010-08-14', group: group3.id, parentName: 'Гайтаева Марет', parentPhone: '+79991234508', parentEmail: 'parent8@sportcrm.ru', medExpiry: -10, payStatus: 'debt' },
    { id: 'ath-009', fn: 'Турпал', ln: 'Нальгиев', bd: '2012-02-28', group: group3.id, parentName: 'Нальгиева Асет', parentPhone: '+79991234509', parentEmail: 'parent9@sportcrm.ru', medExpiry: 20, payStatus: 'paid' },
    { id: 'ath-010', fn: 'Рамзан', ln: 'Хучиев', bd: '2015-12-01', group: group1.id, parentName: 'Хучиева Нура', parentPhone: '+79991234510', parentEmail: 'parent10@sportcrm.ru', medExpiry: 5, payStatus: 'debt' },
  ];

  // Используем первого родителя как demo parent для входа
  let demoParentUserId = '';

  for (const a of athletesData) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + a.medExpiry);
    const daysLeft = a.medExpiry;
    const medStatus = daysLeft < 0 ? 'expired' : daysLeft <= 14 ? 'expires_soon' : 'valid';

    await prisma.athlete.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id, orgId: org.id, firstName: a.fn, lastName: a.ln,
        birthDate: new Date(a.bd), sportType: group1.sportType ?? 'sambo',
        status: 'active', level: 'beginner', groupId: a.group,
      },
    });

    const isFirstParent = a.id === 'ath-001';
    const parentEmail = isFirstParent ? 'parent@sportcrm.ru' : a.parentEmail;

    let parentUser = await prisma.user.findUnique({ where: { email: parentEmail } });
    if (!parentUser) {
      parentUser = await prisma.user.create({
        data: {
          orgId: org.id, email: parentEmail, passwordHash: await hash('demo123'),
          fullName: a.parentName, role: 'parent',
        },
      });
    }
    if (isFirstParent) demoParentUserId = parentUser.id;

    const parent = await prisma.parent.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: { userId: parentUser.id, orgId: org.id, phone: a.parentPhone, relation: 'mother' },
    });

    await prisma.athleteParent.upsert({
      where: { athleteId_parentId: { athleteId: a.id, parentId: parent.id } },
      update: {},
      create: { athleteId: a.id, parentId: parent.id, isPrimary: true },
    });

    await prisma.medicalDocument.create({
      data: {
        athleteId: a.id, docType: 'medical_cert',
        issuedAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        validUntil, status: medStatus as any,
      },
    }).catch(() => {});

    const amount = 3500;
    const paid = a.payStatus === 'paid' ? amount : a.payStatus === 'partial' ? amount / 2 : 0;
    const status = a.payStatus as any;
    const month = new Date().toISOString().slice(0, 7);

    await prisma.payment.create({
      data: {
        athleteId: a.id, orgId: org.id, periodMonth: month, amount, paidAmount: paid,
        status, dueDate: new Date(new Date().setDate(10)),
        paymentDate: paid > 0 ? new Date() : null,
      },
    }).catch(() => {});
  }
  console.log('✅ Athletes, parents, documents, payments created');

  // Training sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2);
    for (const gid of ['group-001', 'group-002']) {
      const session = await prisma.trainingSession.create({
        data: {
          groupId: gid, coachId: coach1.id, sessionDate: d,
          startTime: '17:00', endTime: '18:30', location: 'Зал №1',
          status: i === 0 ? 'planned' : 'completed',
        },
      });

      if (i > 0) {
        const athletes = gid === 'group-001'
          ? ['ath-001', 'ath-002', 'ath-003', 'ath-010']
          : ['ath-004', 'ath-005', 'ath-006'];

        for (const aid of athletes) {
          const statuses = ['present', 'present', 'present', 'absent'];
          await prisma.attendance.create({
            data: {
              sessionId: session.id, athleteId: aid,
              status: statuses[Math.floor(Math.random() * statuses.length)] as any,
            },
          }).catch(() => {});
        }
      }
    }
  }
  console.log('✅ Sessions & attendance created');

  // Competition
  const comp = await prisma.competition.create({
    data: {
      orgId: org.id, name: 'Открытый турнир клуба "Феникс"',
      compDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      location: 'Москва, ул. Спортивная 15', sportType: 'sambo',
    },
  }).catch(async () => prisma.competition.findFirst({ where: { orgId: org.id } }));

  if (comp) {
    for (const [aid, place, medal] of [['ath-001', 1, 'gold'], ['ath-002', 3, 'bronze'], ['ath-003', 2, 'silver']] as [string, number, string][]) {
      await prisma.competitionResult.create({
        data: {
          competitionId: comp.id, athleteId: aid, discipline: 'sambo',
          category: 'до 35 кг', place, medal: medal as any, result: `${place} место`,
        },
      }).catch(() => {});
    }
  }
  console.log('✅ Competition & results created');

  // Progress records
  const skills = ['Техника', 'Выносливость', 'Физическая форма', 'Дисциплина', 'Спарринг'];
  for (const aid of ['ath-001', 'ath-002', 'ath-003', 'ath-004']) {
    for (const skill of skills) {
      for (let m = 2; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        await prisma.progressRecord.create({
          data: {
            athleteId: aid, coachId: coach1.id, skillName: skill,
            score: Math.floor(Math.random() * 2) + 3 + (2 - m > 0 ? 1 : 0),
            comment: m === 0 ? 'Хорошая работа на тренировке' : null,
            measuredAt: d,
          },
        }).catch(() => {});
      }
    }
  }
  console.log('✅ Progress records created');

  // Demo API key
  const { randomBytes } = await import('crypto');
  const demoKey = `sk_live_demo_${randomBytes(12).toString('hex')}`;
  const keyHash = await hash(demoKey);
  await prisma.apiKey.create({
    data: {
      orgId: org.id, name: 'Demo API Key',
      keyHash, keyPrefix: demoKey.slice(0, 14),
      scopes: ['athletes:read', 'groups:read', 'schedule:read', 'payments:read', 'competitions:read'],
    },
  }).catch(() => {});

  // Notifications
  if (demoParentUserId) {
    await prisma.notification.createMany({
      data: [
        { orgId: org.id, recipientId: demoParentUserId, type: 'payment_debt', title: 'Напоминание об оплате', message: 'Оплата за июнь не поступила. Сумма: 3 500 ₽', isRead: false },
        { orgId: org.id, recipientId: demoParentUserId, type: 'doc_expiring', title: 'Медсправка истекает', message: 'Медсправка вашего ребёнка истекает через 30 дней', isRead: false },
        { orgId: org.id, recipientId: demoParentUserId, type: 'competition', title: 'Соревнования 22 июня', message: 'Ваш ребёнок заявлен на турнир клуба "Феникс"', isRead: true },
      ],
    }).catch(() => {});
  }

  console.log('\n🎉 Seed completed!');
  console.log('Demo accounts:');
  console.log('  Admin:   admin@sportcrm.ru  / demo123');
  console.log('  Coach:   coach@sportcrm.ru  / demo123');
  console.log('  Parent:  parent@sportcrm.ru / demo123');
  console.log(`  Demo API Key: ${demoKey}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
