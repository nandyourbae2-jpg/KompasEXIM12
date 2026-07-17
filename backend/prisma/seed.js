const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMMY_USERS = [
  // ── Departemen: Import ──────────────────────────────────────────────────────
  {
    name: 'Yoda',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-IMP-02',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    name: 'Katon',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-IMP-03',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    name: 'Thomas',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-IMP-04',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },
  {
    name: 'Keenand',
    tipe_karyawan: 'Karyawan Magang',
    employee_id: 'EXIM-IMP-05',
    departemen: 'Import',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Export ──────────────────────────────────────────────────────
  {
    name: 'Nita L.',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-EXP-02',
    departemen: 'Export',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Administrasi Export (AE) ────────────────────────────────────
  {
    name: 'Maya C.',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-AE-02',
    departemen: 'Administrasi Export (AE)',
    level_otoritas: 'Staff Dept',
  },

  // ── Departemen: Account Officer ────────────────────────────────────────────
  {
    name: 'Anton D.',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-AO-01',
    departemen: 'Account Officer',
    level_otoritas: 'Staff Dept',
  },

  // ── Supervisor (sekarang per departemen) ──────────────────────────────────
  {
    name: 'Bapak SPV Import',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-SPV-IMP',
    departemen: 'Import',
    level_otoritas: 'Supervisor',
  },
  {
    name: 'Ibu SPV Export',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-SPV-EXP',
    departemen: 'Export',
    level_otoritas: 'Supervisor',
  },
  {
    name: 'Bapak SPV AE',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-SPV-AE',
    departemen: 'Administrasi Export (AE)',
    level_otoritas: 'Supervisor',
  },
  {
    name: 'Ibu SPV AO',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-SPV-AO',
    departemen: 'Account Officer',
    level_otoritas: 'Supervisor',
  },

  // ── Manager (lintas semua departemen) ─────────────────────────────────────
  {
    name: 'Jori',
    tipe_karyawan: 'Karyawan Tetap',
    employee_id: 'EXIM-MGR-01',
    departemen: null, // Manager doesn't have a specific department
    level_otoritas: 'Manager',
  },
];

async function main() {
  console.log('Start seeding...');
  for (const u of DUMMY_USERS) {
    const user = await prisma.user.upsert({
      where: { employee_id: u.employee_id },
      update: { name: u.name },
      create: {
        ...u,
        password: '123' // Simplified password to match 'password' requirements for users, though we planned 123456. Let's stick to 123456.
      },
    });
    console.log(`Created user with id: ${user.id} and name: ${user.name}`);
  }
  
  // Make sure they all have '123456' as password
  await prisma.user.updateMany({
    data: {
        password: '123456'
    }
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
