// src/modules/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private extendedClient: any;

  constructor() {
    super();
    this.extendedClient = this.$extends({
      result: {
        user: {
          assignedSchools: {
            needs: { assignedSchools: true },
            compute(user) {
              try { return JSON.parse(user.assignedSchools); } catch { return []; }
            },
          },
        },
        school: {
          location: { needs: { location: true }, compute(s) { try { return s.location ? JSON.parse(s.location) : null; } catch { return null; } } },
          administration: { needs: { administration: true }, compute(s) { try { return s.administration ? JSON.parse(s.administration) : null; } catch { return null; } } },
          enrollment: { needs: { enrollment: true }, compute(s) { try { return s.enrollment ? JSON.parse(s.enrollment) : null; } catch { return null; } } },
          staff: { needs: { staff: true }, compute(s) { try { return s.staff ? JSON.parse(s.staff) : null; } catch { return null; } } },
          infrastructure: { needs: { infrastructure: true }, compute(s) { try { return s.infrastructure ? JSON.parse(s.infrastructure) : null; } catch { return null; } } },
          materials: { needs: { materials: true }, compute(s) { try { return s.materials ? JSON.parse(s.materials) : null; } catch { return null; } } },
          timetable: { needs: { timetable: true }, compute(s) { try { return s.timetable ? JSON.parse(s.timetable) : null; } catch { return null; } } },
          performance: { needs: { performance: true }, compute(s) { try { return s.performance ? JSON.parse(s.performance) : null; } catch { return null; } } },
          finance: { needs: { finance: true }, compute(s) { try { return s.finance ? JSON.parse(s.finance) : null; } catch { return null; } } },
          profileAttendance: { needs: { profileAttendance: true }, compute(s) { try { return s.profileAttendance ? JSON.parse(s.profileAttendance) : null; } catch { return null; } } },
          health: { needs: { health: true }, compute(s) { try { return s.health ? JSON.parse(s.health) : null; } catch { return null; } } },
          programs: { needs: { programs: true }, compute(s) { try { return s.programs ? JSON.parse(s.programs) : null; } catch { return null; } } },
          profileDocuments: { needs: { profileDocuments: true }, compute(s) { try { return s.profileDocuments ? JSON.parse(s.profileDocuments) : null; } catch { return null; } } },
          profileAudit: { needs: { profileAudit: true }, compute(s) { try { return s.profileAudit ? JSON.parse(s.profileAudit) : null; } catch { return null; } } },
        },
        teacher: {
          professionalInfo: { needs: { professionalInfo: true }, compute(t) { try { return t.professionalInfo ? JSON.parse(t.professionalInfo) : null; } catch { return null; } } },
          performanceHistory: { needs: { performanceHistory: true }, compute(t) { try { return t.performanceHistory ? JSON.parse(t.performanceHistory) : null; } catch { return null; } } },
          achievementRecords: { needs: { achievementRecords: true }, compute(t) { try { return t.achievementRecords ? JSON.parse(t.achievementRecords) : null; } catch { return null; } } },
          documents: { needs: { documents: true }, compute(t) { try { return t.documents ? JSON.parse(t.documents) : null; } catch { return null; } } },
          audit: { needs: { audit: true }, compute(t) { try { return t.audit ? JSON.parse(t.audit) : null; } catch { return null; } } },
        },
        dailyAttendance: {
          learners: { needs: { learners: true }, compute(d) { try { return JSON.parse(d.learners); } catch { return {}; } } },
          teachers: { needs: { teachers: true }, compute(d) { try { return JSON.parse(d.teachers); } catch { return {}; } } },
        },
      },
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            const jsonFields: Record<string, string[]> = {
              User: ['assignedSchools'],
              School: ['location', 'administration', 'enrollment', 'staff', 'infrastructure', 'materials', 'timetable', 'performance', 'finance', 'profileAttendance', 'health', 'programs', 'profileDocuments', 'profileAudit'],
              Teacher: ['professionalInfo', 'performanceHistory', 'achievementRecords', 'documents', 'audit'],
              DailyAttendance: ['learners', 'teachers'],
              Inspection: ['photoUrls', 'categories', 'schoolDetails', 'teacherDetails', 'details'],
              Submission: ['data'],
              AuditLog: ['details'],
              MonthlyEnrolment: ['enrolment', 'dropouts'],
              IFAReport: ['girls6to9', 'boys6to12', 'girls10to12'],
              TeachersReturn: ['teachers'],
              TermlyReport: ['academicPerformance', 'activities', 'challenges'],
              AnnualCensus: ['infrastructure', 'materials', 'staffing'],
              JuniorResult: ['registered', 'sat', 'passed', 'failed'],
              StandardisedResult: ['scores'],
              PSLCEData: ['summary', 'selection', 'subjectGrades'],
              ExaminationResult: ['candidates', 'passed', 'standards', 'subjectPerformance'],
              OfficerOperation: ['activities', 'challenges', 'recommendations'],
              NESStandard: ['indicators'],
            };

            if ((operation === 'create' || operation === 'update' || operation === 'updateMany' || operation === 'upsert') && args.data) {
              const fields = jsonFields[model] || [];
              for (const field of fields) {
                if (args.data[field] !== undefined && typeof args.data[field] !== 'string') {
                  args.data[field] = JSON.stringify(args.data[field]);
                }
              }
            }
            return query(args);
          },
        },
      },
    });
  }

  // Handle the proxying for DI
  get client() {
    return this.extendedClient;
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL is missing. Database operations will fail.');
      return;
    }

    try {
      await this.$connect();
      // Test connection with a simple query
      if (dbUrl.includes('sqlite') || dbUrl.startsWith('file:')) {
        await this.$queryRaw`SELECT 1`;
        console.log('✅ Connected to SQLite Database');
      } else {
        await this.$executeRaw`SELECT 1`;
        console.log('✅ Connected to Database (PostgreSQL)');
      }
    } catch (error) {
      console.error('❌ Failed to connect to Database. Please check your connection string.');
      console.error(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
