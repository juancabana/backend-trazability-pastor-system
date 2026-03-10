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

  // --- Seed Districts for Asociacion del Caribe Colombiano (real data) ---
  const caribbeAssoc = associations.find(
    (a) => a.name === 'Asociacion del Caribe Colombiano',
  )!;

  const realDistrictNames = [
    'Achi Bolivar',
    'Bajo Sinu',
    'C/gena Bosque',
    'C/gena Central',
    'C/gena Emaus',
    'C/gena Oriental',
    'Carmen de Bolivar',
    'C/gena Norte',
    'Chinu',
    'Ebenezer',
    'Guaranda',
    'Magangue',
    'Majagual',
    'Maranatha',
    'Maria la Baja',
    'Monteria Central',
    'Monteria Occidental',
    'Montes de Maria',
    'Plato',
    'Sabana',
    'San Jorge',
    'San Juan',
    'San Sebastian',
    'Sinu Central',
    'Sincelejo Central',
    'Sincelejo Norte',
    'Sucre',
    'Turbaco',
    'T/A Occidental',
    'T/A Central',
    'Valencia',
  ];

  const districtData: Partial<DistrictEntity>[] = realDistrictNames.map(
    (name) => ({ name, associationId: caribbeAssoc.id }),
  );

  // Also add generic districts for other associations
  const otherAssociations = associations.filter(
    (a) => a.id !== caribbeAssoc.id,
  );
  const genericDistrictNames = [
    ['Distrito Norte', 'Distrito Sur'],
    ['Distrito Este', 'Distrito Oeste'],
    ['Distrito Central', 'Distrito Montanas'],
    ['Distrito Llanos', 'Distrito Ribera'],
    ['Distrito Costa', 'Distrito Valle'],
    ['Distrito Andino', 'Distrito Amazonia'],
    ['Distrito Sabana', 'Distrito Altiplano'],
    ['Distrito Magdalena Alto', 'Distrito Magdalena Bajo'],
    ['Distrito Cafetero Norte', 'Distrito Cafetero Sur'],
  ];

  for (let i = 0; i < otherAssociations.length; i++) {
    const names = genericDistrictNames[i] || [
      `Distrito A-${i}`,
      `Distrito B-${i}`,
    ];
    for (const name of names) {
      districtData.push({ name, associationId: otherAssociations[i].id });
    }
  }

  const districts = await districtRepo.save(districtRepo.create(districtData));
  console.log(`${districts.length} distritos creados.`);

  // --- Seed Churches (3 per district) ---
  const churchSuffixes = [
    'Central',
    'El Faro',
    'Esperanza',
    'Luz del Mundo',
    'El Camino',
    'Fe y Vida',
    'Nuevo Amanecer',
    'Renacer',
    'Bethel',
    'El Redentor',
    'Emanuel',
    'Monte Sion',
    'El Calvario',
    'Getsemani',
    'Ebenezer',
    'Betel',
    'Peniel',
    'Sion',
    'Horeb',
    'Filadelfia',
    'Esmirna',
    'Antioqui',
    'Nazaret',
    'La Roca',
    'El Buen Pastor',
    'La Vid',
    'Maranata',
    'El Refugio',
    'La Gracia',
    'El Manantial',
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

  // Helper: find district by name
  const findDistrict = (name: string) => districts.find((d) => d.name === name);

  // Real pastors and ministers for Asociacion del Caribe Colombiano
  const realPastors: {
    district: string;
    name: string;
    position: string;
    email: string;
    phone: string;
  }[] = [
    {
      district: 'Achi Bolivar',
      name: 'Jairo Jose Soto Alvarez',
      position: 'Ministro',
      email: 'jairosotoa7@gmail.com',
      phone: '316 388 8577',
    },
    {
      district: 'Bajo Sinu',
      name: 'Luis Gabriel Molina Cardenas',
      position: 'Ministro',
      email: 'mishbotigabriel@hotmail.com',
      phone: '301 661 7837',
    },
    {
      district: 'C/gena Bosque',
      name: 'Jesus Alberto Fandino Rodriguez',
      position: 'Pastor',
      email: 'jafar63misioncaribe@hotmail.com',
      phone: '311 660 0185',
    },
    {
      district: 'C/gena Central',
      name: 'Edgardo Enrique Carmona Olivares',
      position: 'Ministro',
      email: 'elied1528@hotmail.com',
      phone: '311 660 0197',
    },
    {
      district: 'C/gena Emaus',
      name: 'Odma Elier Florez Paez',
      position: 'Pastor',
      email: 'odma77@hotmail.com',
      phone: '311 660 0193',
    },
    {
      district: 'C/gena Oriental',
      name: 'Gilberto Jose Cabana Suarez',
      position: 'Pastor',
      email: 'pastorcentralad7@hotmail.com',
      phone: '314 568 5747',
    },
    {
      district: 'Carmen de Bolivar',
      name: 'Ever Murillo Banqueth',
      position: 'Ministro',
      email: 'ever_murillo@hotmail.com',
      phone: '310 351 0463',
    },
    {
      district: 'C/gena Norte',
      name: 'Fabian Jesus Blanco Ramos',
      position: 'Pastor',
      email: 'teamoms5@hotmail.com',
      phone: '310 545 5787',
    },
    {
      district: 'Chinu',
      name: 'Lien Enrique Pineda Villadiego',
      position: 'Pastor',
      email: 'lien0874@hotmail.com',
      phone: '311 660 0312',
    },
    {
      district: 'Ebenezer',
      name: 'Libardo Nicolas Cuesta Sarabia',
      position: 'Pastor',
      email: 'lcuestas67@hotmail.com',
      phone: '314 874 1576',
    },
    {
      district: 'Guaranda',
      name: 'Edilberto Miguel Ospino Rivera',
      position: 'Ministro',
      email: 'eospino@unac.edu.co',
      phone: '310 368 7640',
    },
    {
      district: 'Magangue',
      name: 'Damian Jose Castro Cervantes',
      position: 'Pastor',
      email: 'dajocacecom@gmail.com',
      phone: '320 734 8226',
    },
    {
      district: 'Majagual',
      name: 'Beimer Manuel Negrete Ortiz',
      position: 'Ministro',
      email: 'bnegrete1@hotmail.com',
      phone: '322 607 7270',
    },
    {
      district: 'Maranatha',
      name: 'David Enrique Mauris De la Osa',
      position: 'Ministro',
      email: 'mauryosa@gmail.com',
      phone: '300 593 1815',
    },
    {
      district: 'Maria la Baja',
      name: 'Doiler Fidel Torres Davila',
      position: 'Ministro',
      email: 'doilerfidel89@hotmail.com',
      phone: '312 675 3018',
    },
    {
      district: 'Monteria Central',
      name: 'Walmer Guzman Vergara',
      position: 'Pastor',
      email: 'wguzman@unac.edu.co',
      phone: '312 660 0652',
    },
    {
      district: 'Monteria Occidental',
      name: 'Roberto Jose Leal Arrieta',
      position: 'Ministro',
      email: 'robertoleal65@hotmail.es',
      phone: '322 783 6267',
    },
    {
      district: 'Montes de Maria',
      name: 'Yorman Enrique Tamara Diaz',
      position: 'Ministro',
      email: 'yetd_32@hotmail.com',
      phone: '312 200 3103',
    },
    {
      district: 'Plato',
      name: 'Armando Torres Acosta',
      position: 'Ministro',
      email: 'gomita21_@hotmail.com',
      phone: '320 362 7173',
    },
    {
      district: 'Sabana',
      name: 'Franco Aldair Ramos Jimenez',
      position: 'Pastor',
      email: 'elgranzebu@gmail.com',
      phone: '313 645 5102',
    },
    {
      district: 'San Jorge',
      name: 'Juan Eudes Gallego Sanchez',
      position: 'Pastor',
      email: 'jugalio274@hotmail.com',
      phone: '321 779 9987',
    },
    {
      district: 'San Juan',
      name: 'Andres Mauricio Restrepo Jimenez',
      position: 'Ministro',
      email: 'arestrepojimenez@gmail.com',
      phone: '314 561 3891',
    },
    {
      district: 'San Sebastian',
      name: 'Joel Jose Doria Doria',
      position: 'Pastor',
      email: 'ilseatencia@gmail.com',
      phone: '311 660 0195',
    },
    {
      district: 'Sinu Central',
      name: 'Diego Fernando Doria Ramos',
      position: 'Ministro',
      email: 'diegofdoriar98@outlook.com',
      phone: '320 510 5341',
    },
    {
      district: 'Sincelejo Central',
      name: 'Edwin Jose Diaz Castellar',
      position: 'Pastor',
      email: 'viviyedwin@hotmail.com',
      phone: '311 660 0183',
    },
    {
      district: 'Sincelejo Norte',
      name: 'Over Luis Pena Jimenez',
      position: 'Pastor',
      email: 'over_pena@hotmail.com',
      phone: '314 547 1322',
    },
    {
      district: 'Sucre',
      name: 'Luis Carlos Perez Macias',
      position: 'Ministro',
      email: 'lperezmacia@gmail.com',
      phone: '313 880 8311',
    },
    {
      district: 'Turbaco',
      name: 'Jose David Rocha Velasquez',
      position: 'Ministro',
      email: 'davidrochavr7@gmail.com',
      phone: '322 305 8275',
    },
    {
      district: 'T/A Occidental',
      name: 'Wilfrido Mejia Torres',
      position: 'Ministro',
      email: 'wilmejia@unac.edu.co',
      phone: '318 543 3126',
    },
    {
      district: 'T/A Central',
      name: 'Jaminson Romana Romana',
      position: 'Pastor',
      email: 'jromana25@hotmail.com',
      phone: '321 638 8561',
    },
    {
      district: 'Valencia',
      name: 'Jose Daniel Puentes Rocha',
      position: 'Ministro',
      email: 'jpuentesrocha@hotmail.com',
      phone: '310 801 1499',
    },
  ];

  const userData: Partial<UserEntity>[] = [];

  // Create real pastors/ministers for Caribe association
  for (const pastor of realPastors) {
    const district = findDistrict(pastor.district);
    userData.push({
      name: pastor.name,
      email: pastor.email.toLowerCase(),
      role: UserRole.PASTOR,
      passwordHash,
      associationId: caribbeAssoc.id,
      districtId: district?.id ?? null,
      position: pastor.position,
      phone: pastor.phone,
    });
  }

  // Generic pastors for other associations (one per district)
  const getDistrictsForAssociation = (assocId: string) =>
    districts.filter((d) => d.associationId === assocId);

  const genericPastorNames = [
    'Carlos Mendoza',
    'Maria Gonzalez',
    'Juan Perez',
    'Ana Rodriguez',
    'Luis Herrera',
    'Sofia Castro',
    'Diego Ramirez',
    'Laura Torres',
    'Andres Morales',
    'Carmen Vargas',
    'Pedro Ortiz',
    'Claudia Rios',
    'Fernando Silva',
    'Patricia Nunez',
    'Roberto Diaz',
    'Isabel Mejia',
    'Alejandro Pena',
    'Daniela Cruz',
  ];
  let genericIdx = 0;

  for (const assoc of otherAssociations) {
    const assocDistricts = getDistrictsForAssociation(assoc.id);
    for (const district of assocDistricts) {
      if (genericIdx >= genericPastorNames.length) break;
      const name = genericPastorNames[genericIdx];
      const emailPrefix = name.toLowerCase().replace(/ /g, '.');
      userData.push({
        name,
        email: `${emailPrefix}@demo.com`,
        role: UserRole.PASTOR,
        passwordHash,
        associationId: assoc.id,
        districtId: district.id,
        position: genericIdx % 2 === 0 ? 'Pastor' : 'Ministro',
        phone: null,
      });
      genericIdx++;
    }
  }

  // Keep demo credentials: override first real pastor email
  userData[0].email = 'pastor@demo.com';

  // Admin for main association (Asociacion del Caribe Colombiano)
  userData.push({
    name: 'Administrador',
    email: 'admin@demo.com',
    role: UserRole.ADMIN,
    passwordHash,
    associationId: caribbeAssoc.id,
    position: null,
    phone: null,
  });

  // Super admins
  userData.push({
    name: 'Super Admin Norte',
    email: 'superadmin.norte@demo.com',
    role: UserRole.SUPER_ADMIN,
    passwordHash,
    unionId: unionNorte.id,
    position: null,
    phone: null,
  });
  userData.push({
    name: 'Super Admin Sur',
    email: 'superadmin.sur@demo.com',
    role: UserRole.SUPER_ADMIN,
    passwordHash,
    unionId: unionSur.id,
    position: null,
    phone: null,
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
          const cat = categories[Math.floor(Math.random() * categories.length)];
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
