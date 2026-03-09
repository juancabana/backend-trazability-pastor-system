import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AssociationEntity } from '../../association/domain/entities/association.entity.js';
import { DistrictEntity } from '../../district/domain/entities/district.entity.js';
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
      AssociationEntity,
      DistrictEntity,
      ActivityCategoryEntity,
      UserEntity,
      DailyReportEntity,
    ],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Conexion a base de datos establecida.');

  // --- Seed Associations ---
  const assocRepo = dataSource.getRepository(AssociationEntity);
  const existingAssoc = await assocRepo.find();
  let associations: AssociationEntity[];

  if (existingAssoc.length > 0) {
    console.log(`Ya existen ${existingAssoc.length} asociaciones. Saltando...`);
    associations = existingAssoc;
  } else {
    const assocData = [
      {
        name: 'Asociacion del Caribe Colombiano',
        union: 'Union Colombiana del Norte',
        country: 'Colombia',
        reportDeadlineDay: 19,
      },
      {
        name: 'Asociacion del Pacifico Colombiano',
        union: 'Union Colombiana del Sur',
        country: 'Colombia',
        reportDeadlineDay: 19,
      },
      {
        name: 'Asociacion Colombiana Centro Oriental',
        union: 'Union Colombiana del Norte',
        country: 'Colombia',
        reportDeadlineDay: 19,
      },
    ];
    associations = await assocRepo.save(assocRepo.create(assocData));
    console.log(`${associations.length} asociaciones creadas.`);
  }

  const mainAssociation = associations[0];

  // --- Seed Districts ---
  const districtRepo = dataSource.getRepository(DistrictEntity);
  const existingDistricts = await districtRepo.find();
  let districts: DistrictEntity[];

  if (existingDistricts.length > 0) {
    console.log(
      `Ya existen ${existingDistricts.length} distritos. Saltando...`,
    );
    districts = existingDistricts;
  } else {
    const districtData = [
      { name: 'Distrito Norte', associationId: mainAssociation.id },
      { name: 'Distrito Sur', associationId: mainAssociation.id },
      { name: 'Distrito Este', associationId: mainAssociation.id },
      { name: 'Distrito Oeste', associationId: mainAssociation.id },
      { name: 'Distrito Central', associationId: mainAssociation.id },
    ];
    districts = await districtRepo.save(districtRepo.create(districtData));
    console.log(`${districts.length} distritos creados.`);
  }

  // --- Seed Activity Categories ---
  const catRepo = dataSource.getRepository(ActivityCategoryEntity);
  const existingCats = await catRepo.find();

  if (existingCats.length > 0) {
    console.log(`Ya existen ${existingCats.length} categorias. Saltando...`);
  } else {
    await catRepo.save(catRepo.create(ACTIVITY_CATEGORY_SEEDS));
    console.log(
      `${ACTIVITY_CATEGORY_SEEDS.length} categorias de actividad creadas.`,
    );
  }

  // --- Seed Users ---
  const userRepo = dataSource.getRepository(UserEntity);
  const existingUsers = await userRepo.find();
  let users: UserEntity[];

  if (existingUsers.length > 0) {
    console.log(`Ya existen ${existingUsers.length} usuarios. Saltando...`);
    users = existingUsers;
  } else {
    const passwordHash = await bcrypt.hash('demo1234', 12);
    const userData = [
      {
        name: 'Ptr. Carlos Mendoza',
        email: 'pastor@demo.com',
        role: UserRole.PASTOR,
        passwordHash,
        associationId: mainAssociation.id,
        districtId: districts[0].id,
      },
      {
        name: 'Ptr. Maria Gonzalez',
        email: 'maria@demo.com',
        role: UserRole.PASTOR,
        passwordHash,
        associationId: mainAssociation.id,
        districtId: districts[1].id,
      },
      {
        name: 'Ptr. Juan Perez',
        email: 'juan@demo.com',
        role: UserRole.PASTOR,
        passwordHash,
        associationId: mainAssociation.id,
        districtId: districts[2].id,
      },
      {
        name: 'Ptr. Ana Rodriguez',
        email: 'ana@demo.com',
        role: UserRole.PASTOR,
        passwordHash,
        associationId: mainAssociation.id,
        districtId: districts[3].id,
      },
      {
        name: 'Ptr. Luis Herrera',
        email: 'luis@demo.com',
        role: UserRole.PASTOR,
        passwordHash,
        associationId: mainAssociation.id,
        districtId: districts[4].id,
      },
      {
        name: 'Administrador',
        email: 'admin@demo.com',
        role: UserRole.ADMIN,
        passwordHash,
        associationId: mainAssociation.id,
        districtId: undefined,
      },
    ];
    users = await userRepo.save(userRepo.create(userData));
    console.log(`${users.length} usuarios creados.`);
  }

  // --- Seed Sample Reports ---
  const reportRepo = dataSource.getRepository(DailyReportEntity);
  const existingReports = await reportRepo.find();

  if (existingReports.length > 0) {
    console.log(`Ya existen ${existingReports.length} reportes. Saltando...`);
  } else {
    const categories = await catRepo.find();
    const pastors = users.filter((u) => u.role === 'pastor');
    const reports: Partial<DailyReportEntity>[] = [];

    for (const pastor of pastors) {
      for (let day = 1; day <= 25; day++) {
        if (Math.random() > 0.3) {
          const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
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
                Math.random() > 0.7
                  ? 'Preparar materiales para la proxima sesion.'
                  : '',
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
  }

  await dataSource.destroy();
  console.log('Seeds completados exitosamente.');
}

runSeeds().catch((err) => {
  console.error('Error ejecutando seeds:', err);
  process.exit(1);
});
