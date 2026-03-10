import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UnionEntity } from '../../union/domain/entities/union.entity.js';
import { AssociationEntity } from '../../association/domain/entities/association.entity.js';
import { DistrictEntity } from '../../district/domain/entities/district.entity.js';
import { ChurchEntity } from '../../church/domain/entities/church.entity.js';
import { ActivityCategoryEntity } from '../../activity-category/domain/entities/activity-category.entity.js';
import { UserEntity } from '../../auth/domain/entities/user.entity.js';
import { DailyReportEntity } from '../../daily-report/domain/entities/daily-report.entity.js';
import { ACTIVITY_CATEGORY_SEEDS } from '../../activity-category/infrastructure/seeds/activity-category.seed.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'pastor_tracking',
    entities: [
      UnionEntity,
      AssociationEntity,
      DistrictEntity,
      ChurchEntity,
      ActivityCategoryEntity,
      UserEntity,
      DailyReportEntity,
    ],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Conexion a base de datos establecida.');

  // --- Clean up existing data (in correct order due to FK constraints) ---
  const reportRepo = dataSource.getRepository(DailyReportEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const churchRepo = dataSource.getRepository(ChurchEntity);
  const districtRepo = dataSource.getRepository(DistrictEntity);
  const assocRepo = dataSource.getRepository(AssociationEntity);
  const unionRepo = dataSource.getRepository(UnionEntity);
  const catRepo = dataSource.getRepository(ActivityCategoryEntity);

  console.log('Limpiando datos existentes...');
  await reportRepo.createQueryBuilder().delete().execute();
  await userRepo.createQueryBuilder().delete().execute();
  await churchRepo.createQueryBuilder().delete().execute();
  await districtRepo.createQueryBuilder().delete().execute();
  await assocRepo.createQueryBuilder().delete().execute();
  await unionRepo.createQueryBuilder().delete().execute();
  await catRepo.createQueryBuilder().delete().execute();
  console.log('Datos limpiados.');

  // --- Seed Unions ---
  const unionData = [
    { name: 'Union Colombiana del Norte', country: 'Colombia' },
    { name: 'Union Colombiana del Sur', country: 'Colombia' },
  ];
  const unions = await unionRepo.save(unionRepo.create(unionData));
  console.log(`${unions.length} uniones creadas.`);

  const unionNorte = unions.find((u) => u.name.includes('Norte'))!;
  const unionSur = unions.find((u) => u.name.includes('Sur'))!;

  // --- Seed Associations ---
  // 4 associations for Union Norte, 6 for Union Sur = 10 total
  const assocData = [
    // Union Norte (4)
    {
      name: 'Asociacion del Caribe Colombiano',
      unionId: unionNorte.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion Colombiana Centro Oriental',
      unionId: unionNorte.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion Colombiana Centro Occidental',
      unionId: unionNorte.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion del Llano Colombiano',
      unionId: unionNorte.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    // Union Sur (6)
    {
      name: 'Asociacion del Pacifico Colombiano',
      unionId: unionSur.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion Colombiana del Sur',
      unionId: unionSur.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion Colombiana Sur Oriental',
      unionId: unionSur.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion del Alto Magdalena',
      unionId: unionSur.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion del Cafe Colombiano',
      unionId: unionSur.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
    {
      name: 'Asociacion Colombiana Sur Occidental',
      unionId: unionSur.id,
      country: 'Colombia',
      reportDeadlineDay: 19,
    },
  ];
  const associations = await assocRepo.save(assocRepo.create(assocData));
  console.log(`${associations.length} asociaciones creadas.`);

  // --- Seed Districts (2 per association) ---
  const districtNames = [
    ['Distrito Norte', 'Distrito Sur'],
    ['Distrito Este', 'Distrito Oeste'],
    ['Distrito Central', 'Distrito Montanas'],
    ['Distrito Llanos', 'Distrito Ribera'],
    ['Distrito Costa', 'Distrito Valle'],
    ['Distrito Andino', 'Distrito Amazonia'],
    ['Distrito Sabana', 'Distrito Altiplano'],
    ['Distrito Magdalena Alto', 'Distrito Magdalena Bajo'],
    ['Distrito Cafetero Norte', 'Distrito Cafetero Sur'],
    ['Distrito Occidental Norte', 'Distrito Occidental Sur'],
  ];

  const districtData: Partial<DistrictEntity>[] = [];
  for (let i = 0; i < associations.length; i++) {
    const names = districtNames[i] || [`Distrito A-${i}`, `Distrito B-${i}`];
    for (const name of names) {
      districtData.push({ name, associationId: associations[i].id });
    }
  }
  const districts = await districtRepo.save(districtRepo.create(districtData));
  console.log(`${districts.length} distritos creados.`);

  // --- Seed Churches (3 per district) ---
  const churchSuffixes = [
    'Central', 'El Faro', 'Esperanza', 'Luz del Mundo', 'El Camino',
    'Fe y Vida', 'Nuevo Amanecer', 'Renacer', 'Bethel', 'El Redentor',
    'Emanuel', 'Monte Sion', 'El Calvario', 'Getsemani', 'Ebenezer',
    'Betel', 'Peniel', 'Sion', 'Horeb', 'Filadelfia',
    'Esmirna', 'Antioqui', 'Nazaret', 'La Roca', 'El Buen Pastor',
    'La Vid', 'Maranata', 'El Refugio', 'La Gracia', 'El Manantial',
  ];

  const churchData: Partial<ChurchEntity>[] = [];
  for (let i = 0; i < districts.length; i++) {
    for (let j = 0; j < 3; j++) {
      const suffixIndex = (i * 3 + j) % churchSuffixes.length;
      churchData.push({
        name: `Iglesia ${churchSuffixes[suffixIndex]}`,
        districtId: districts[i].id,
      });
    }
  }
  const churches = await churchRepo.save(churchRepo.create(churchData));
  console.log(`${churches.length} iglesias creadas.`);

  // --- Seed Activity Categories ---
  await catRepo.save(catRepo.create(ACTIVITY_CATEGORY_SEEDS));
  console.log(
    `${ACTIVITY_CATEGORY_SEEDS.length} categorias de actividad creadas.`,
  );

  // --- Seed Users ---
  const passwordHash = await bcrypt.hash('demo1234', 12);

  // Helper: get districts for an association
  const getDistrictsForAssociation = (assocId: string) =>
    districts.filter((d) => d.associationId === assocId);

  // Pastor names pool
  const pastorNames = [
    'Ptr. Carlos Mendoza', 'Ptr. Maria Gonzalez', 'Ptr. Juan Perez',
    'Ptr. Ana Rodriguez', 'Ptr. Luis Herrera', 'Ptr. Sofia Castro',
    'Ptr. Diego Ramirez', 'Ptr. Laura Torres', 'Ptr. Andres Morales',
    'Ptr. Carmen Vargas', 'Ptr. Pedro Ortiz', 'Ptr. Claudia Rios',
    'Ptr. Fernando Silva', 'Ptr. Patricia Nunez', 'Ptr. Roberto Diaz',
    'Ptr. Isabel Mejia', 'Ptr. Alejandro Pena', 'Ptr. Daniela Cruz',
    'Ptr. Ricardo Salazar', 'Ptr. Monica Gutierrez', 'Ptr. Gabriel Leon',
    'Ptr. Valentina Romero', 'Ptr. Santiago Cardenas', 'Ptr. Natalia Aguilar',
    'Ptr. Oscar Zambrano', 'Ptr. Camila Paredes', 'Ptr. Julio Espinoza',
    'Ptr. Angela Contreras', 'Ptr. Enrique Soto', 'Ptr. Melissa Acosta',
  ];

  let pastorIndex = 0;
  const userData: Partial<UserEntity>[] = [];

  // Generate 2-3 pastors per association (one per district)
  for (let assocIdx = 0; assocIdx < associations.length; assocIdx++) {
    const assoc = associations[assocIdx];
    const assocDistricts = getDistrictsForAssociation(assoc.id);

    for (const district of assocDistricts) {
      if (pastorIndex >= pastorNames.length) break;
      const emailPrefix = pastorNames[pastorIndex]
        .replace('Ptr. ', '')
        .toLowerCase()
        .replace(/ /g, '.');
      userData.push({
        name: pastorNames[pastorIndex],
        email: `${emailPrefix}@demo.com`,
        role: UserRole.PASTOR,
        passwordHash,
        associationId: assoc.id,
        districtId: district.id,
      });
      pastorIndex++;
    }
  }

  // Override first pastor email to keep demo credentials
  const firstPastorEntry = userData.find((u) =>
    u.name === 'Ptr. Carlos Mendoza',
  );
  if (firstPastorEntry) {
    firstPastorEntry.email = 'pastor@demo.com';
  }

  // Admin for main association (Asociacion del Caribe Colombiano)
  userData.push({
    name: 'Administrador',
    email: 'admin@demo.com',
    role: UserRole.ADMIN,
    passwordHash,
    associationId: associations[0].id,
  });

  // Super admins
  userData.push({
    name: 'Super Admin Norte',
    email: 'superadmin.norte@demo.com',
    role: UserRole.SUPER_ADMIN,
    passwordHash,
    unionId: unionNorte.id,
  });
  userData.push({
    name: 'Super Admin Sur',
    email: 'superadmin.sur@demo.com',
    role: UserRole.SUPER_ADMIN,
    passwordHash,
    unionId: unionSur.id,
  });

  const users = await userRepo.save(userRepo.create(userData));
  console.log(`${users.length} usuarios creados.`);

  // --- Seed Sample Reports (February AND March 2026) ---
  const categories = await catRepo.find();
  const pastors = users.filter((u) => u.role === UserRole.PASTOR);
  const reports: Partial<DailyReportEntity>[] = [];

  const observationPool = [
    'Preparar materiales para la proxima sesion.',
    'Excelente participacion de la comunidad.',
    'Se necesitan mas recursos para la proxima actividad.',
    'Reunion productiva con los lideres de la iglesia.',
    'Visitas a familias nuevas en la comunidad.',
    'Planificacion de evento especial para el proximo mes.',
    'Coordinacion con otros pastores del distrito.',
    'Seguimiento a miembros que no han asistido.',
    '',
  ];

  // February 2026 (days 1-28) and March 2026 (days 1-9)
  const months = [
    { year: 2026, month: 2, days: 28 },
    { year: 2026, month: 3, days: 9 },
  ];

  for (const pastor of pastors) {
    for (const { year, month, days } of months) {
      for (let day = 1; day <= days; day++) {
        // Skip some days randomly (30% chance of no report)
        if (Math.random() > 0.7) continue;

        // Skip Sundays (day of rest after Sabbath activities)
        const dateObj = new Date(year, month - 1, day);
        if (dateObj.getDay() === 0) continue;

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activities: any[] = [];
        const numActivities = Math.floor(Math.random() * 5) + 1;
        const usedSubcats = new Set<string>();

        for (let i = 0; i < numActivities; i++) {
          const cat =
            categories[Math.floor(Math.random() * categories.length)];
          const subcat =
            cat.subcategories[
              Math.floor(Math.random() * cat.subcategories.length)
            ];
          if (usedSubcats.has(subcat.id)) continue;
          usedSubcats.add(subcat.id);

          const isTransport = cat.id === 'transporte';
          activities.push({
            subcategoryId: subcat.id,
            categoryId: cat.id,
            description: '',
            quantity: Math.floor(Math.random() * 5) + 1,
            hours: subcat.hasHours
              ? Math.round((Math.random() * 4 + 0.5) * 10) / 10
              : undefined,
            amount: isTransport
              ? Math.round((Math.random() * 80000 + 5000) / 100) * 100
              : undefined,
          });
        }

        if (activities.length > 0) {
          reports.push({
            pastorId: pastor.id,
            date: dateStr,
            activities,
            observations:
              observationPool[
                Math.floor(Math.random() * observationPool.length)
              ],
          });
        }
      }
    }
  }

  // Save in batches
  const batchSize = 50;
  for (let i = 0; i < reports.length; i += batchSize) {
    const batch = reports.slice(i, i + batchSize);
    await reportRepo.save(reportRepo.create(batch));
  }
  console.log(`${reports.length} reportes de ejemplo creados.`);

  await dataSource.destroy();
  console.log('Seeds completados exitosamente.');
}

runSeeds().catch((err) => {
  console.error('Error ejecutando seeds:', err);
  process.exit(1);
});
