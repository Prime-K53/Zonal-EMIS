import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AggregationService } from '../../services/aggregation.service';
import { ValidationService } from '../../services/validation/validation.service';
import { AuditService } from '../../services/audit/audit.service';

const ENTITY_TO_MODULE_MAP: Record<string, 'attendance' | 'enrollment' | 'activities' | 'teachers'> = {
  'daily-attendance': 'attendance',
  'monthly-enrolment': 'enrollment',
  'annual-census': 'enrollment',
  'learners': 'enrollment',
  'teachers': 'teachers',
  'smc-meetings': 'activities',
  'inspections': 'activities',
};

const VALIDATED_ENTITIES = [
  'daily-attendance',
  'learners',
  'smc-meetings',
  'inspections',
];

@Injectable()
export class EmisService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AggregationService) private aggregationService: AggregationService,
    @Inject(ValidationService) private validationService: ValidationService,
    @Inject(AuditService) private auditService: AuditService,
  ) {}

  private parseJsonField<T>(value: string | null | undefined, fallback: T): T {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private hydrateSchoolRecord(record: any) {
    return {
      ...record,
      location: this.parseJsonField(record.location, null),
      administration: this.parseJsonField(record.administration, null),
      enrollment: this.parseJsonField(record.enrollment, null),
      staff: this.parseJsonField(record.staff, null),
      infrastructure: this.parseJsonField(record.infrastructure, null),
      materials: this.parseJsonField(record.materials, null),
      timetable: this.parseJsonField(record.timetable, null),
      performance: this.parseJsonField(record.performance, null),
      finance: this.parseJsonField(record.finance, null),
      profileAttendance: this.parseJsonField(record.profileAttendance, null),
      health: this.parseJsonField(record.health, null),
      programs: this.parseJsonField(record.programs, null),
      profileDocuments: this.parseJsonField(record.profileDocuments, []),
      profileAudit: this.parseJsonField(record.profileAudit, null),
    };
  }

  async getAllDataSummary() {
    const [schools, teachers, inspections, tpd, resources] = await Promise.all([
      this.prisma.school.findMany(),
      this.prisma.teacher.findMany(),
      this.prisma.inspection.findMany(),
      this.prisma.tPDProgram.findMany(),
      this.prisma.resource.findMany(),
    ]);

    return {
      schools: schools.map(record => this.hydrateSchoolRecord(record)),
      teachers,
      inspections,
      tpd,
      resources,
      timestamp: new Date().toISOString(),
    };
  }

  private getModel(entity: string) {
    // Map URL friendly names to Prisma models
    const modelMap: Record<string, any> = {
      'daily-attendance': this.prisma.dailyAttendance,
      'monthly-enrolment': this.prisma.monthlyEnrolment,
      'ifa-reports': this.prisma.iFAReport,
      'teachers-returns': this.prisma.teachersReturn,
      'termly-reports': this.prisma.termlyReport,
      'annual-census': this.prisma.annualCensus,
      'junior-results': this.prisma.juniorResult,
      'standardised-results': this.prisma.standardisedResult,
      'pslce-data': this.prisma.pSLCEData,
      'examination-results': this.prisma.examinationResult,
      'exam-administration': this.prisma.examAdministration,
      'continuous-assessments': this.prisma.continuousAssessment,
      'maintenance-logs': this.prisma.maintenanceLog,
      'smc-meetings': this.prisma.sMCMeeting,
      'departments': this.prisma.department,
      'officer-operations': this.prisma.officerOperation,
      'nes-standards': this.prisma.nESStandard,
      'tpd-programs': this.prisma.tPDProgram,
      'leave-requests': this.prisma.leaveRequest,
      'inspections': this.prisma.inspection,
      'tpd-history': this.prisma.tPDHistory,
      'transfer-history': this.prisma.transferHistory,
      'leave-records': this.prisma.leaveRecord,
      'enrollment-stats': (this.prisma as any).enrollmentStat || (this.prisma as any).enrollmentStats,
      'promotion-records': this.prisma.promotionRecord,
      'schools': this.prisma.school,
      'teachers': this.prisma.teacher,
      'learners': this.prisma.learner,
      'resources': this.prisma.resource,
      'audit-logs': this.prisma.auditLog,
      'submissions': this.prisma.submission,
      'academic-years': this.prisma.academicYear,
      'terms': this.prisma.term,
      'standard-classes': this.prisma.standardClass,
      'system-settings': this.prisma.systemSettings,
    };

    const model = modelMap[entity];
    if (!model) {
      console.warn(`[EmisService] Model NOT found for entity: ${entity}. Available models:`, Object.keys(this.prisma).filter(k => !k.startsWith('_')));
      throw new BadRequestException(`Unknown entity: ${entity}`);
    }
    return model;
  }

  private prepareData(entity: string, data: any) {
    const prepared = { ...data };
    
    // 1. Remove ID and other metadata fields that are never directly written
    delete prepared.id;
    delete prepared.lastUpdated;
    delete prepared._count;
    
    // 2. Clear out common relationship objects if they are passed as whole objects
    // Prisma expectations are usually ID fields (e.g., schoolId) not the whole object
    const relationshipObjects = ['school', 'teacher', 'user', 'academicYear'];
    relationshipObjects.forEach(obj => delete prepared[obj]);

    // 3. Entity-specific cleanup for models that don't have certain standard fields
    const modelsWithoutUpdatedAt = [
      'daily-attendance', 'monthly-enrolment', 'ifa-reports', 'teachers-returns',
      'termly-reports', 'annual-census', 'junior-results', 'standardised-results',
      'pslce-data', 'examination-results', 'maintenance-logs',
      'smc-meetings', 'nes-standards', 'tpd-programs', 'inspections',
      'tpd-history', 'enrollment-stats', 'promotion-records',
      'audit-logs', 'standard-classes'
    ];
    
    if (modelsWithoutUpdatedAt.includes(entity)) {
      delete prepared.updatedAt;
    }

    // 4. Number field conversion
    const numberFields = [
      'quantity', 'registered', 'sat', 'passed', 'failed', 'boys', 'girls', 'year', 'term', 
      'score', 'totalMarks', 'participants', 'staffCount', 'number', 'participantsCount', 
      'daysRequested', 'classrooms', 'staffHouses', 'toiletsBoys', 'toiletsGirls',
      'yearEstablished', 'latitude', 'longitude', 'cost'
    ];
    
    numberFields.forEach(field => {
      if (prepared[field] !== undefined && typeof prepared[field] === 'string' && prepared[field] !== '') {
        const n = parseFloat(prepared[field]);
        if (!isNaN(n)) {
          // If it's likely an integer (most our schema fields are Int except score/cost/lat/long)
          const intFields = ['quantity', 'registered', 'sat', 'passed', 'failed', 'boys', 'girls', 'year', 'term', 'totalMarks', 'participants', 'staffCount', 'number', 'participantsCount', 'daysRequested', 'classrooms', 'staffHouses', 'toiletsBoys', 'toiletsGirls', 'yearEstablished'];
          prepared[field] = intFields.includes(field) ? Math.round(n) : n;
        }
      }
    });

    // 5. Fixes for specific entities
    if (entity === 'system-settings') {
      const allowedKeys = ['currentAcademicYearId', 'currentTermId', 'systemEmail', 'maintenanceMode', 'districtName', 'zoneName', 'tdcName', 'updatedAt', 'createdAt'];
      Object.keys(prepared).forEach(key => {
        if (!allowedKeys.includes(key)) {
          delete prepared[key];
        }
      });
    }

    // Fix for academic-years: Map name to year and provide default dates if missing
    if (entity === 'academic-years') {
      if (prepared.name && !prepared.year) {
        prepared.year = prepared.name;
      }
      
      // Default dates if missing
      if (!prepared.startDate) prepared.startDate = new Date().toISOString();
      if (!prepared.endDate) {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        prepared.endDate = endDate.toISOString();
      }

      // Strip non-existent fields
      const allowedKeys = ['year', 'status', 'startDate', 'endDate', 'updatedAt', 'createdAt'];
      Object.keys(prepared).forEach(key => {
        if (!allowedKeys.includes(key)) {
          delete prepared[key];
        }
      });
    }

    // Fix for terms: Provide default dates if missing
    if (entity === 'terms') {
      if (!prepared.startDate) prepared.startDate = new Date().toISOString();
      if (!prepared.endDate) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        prepared.endDate = endDate.toISOString();
      }
      // academicYearId is required in schema, hope it's provided
      
      // Map name
      if (prepared.number && !prepared.name) {
        prepared.name = `Term ${prepared.number}`;
      }
      
      // Strip non-existent fields
      const allowedKeys = ['academicYearId', 'name', 'startDate', 'endDate', 'status', 'updatedAt', 'createdAt'];
      Object.keys(prepared).forEach(key => {
        if (!allowedKeys.includes(key)) {
          delete prepared[key];
        }
      });
    }

    // Fix for resources: Strip non-existent fields like 'lastUpdated'
    if (entity === 'resources') {
      const allowedKeys = ['schoolId', 'name', 'category', 'quantity', 'condition', 'createdAt', 'updatedAt'];
      Object.keys(prepared).forEach(key => {
        if (!allowedKeys.includes(key)) {
          delete prepared[key];
        }
      });
    }

    // Fix for teachers: Strip unknown fields (like retirementDate)
    if (entity === 'teachers') {
      const allowedKeys = [
        'emisCode', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'nationalId',
        'employmentNumber', 'status', 'schoolId', 'qualification', 'specialization',
        'joiningDate', 'email', 'phone', 'address', 'tradingCenter', 'traditionalAuthority',
        'district', 'registrationNumber', 'dateOfFirstAppointment', 'dateOfPresentStandard',
        'grade', 'remarks', 'teachingClass', 'professionalInfo', 'performanceHistory',
        'achievementRecords', 'documents', 'audit', 'createdAt', 'updatedAt'
      ];
      Object.keys(prepared).forEach(key => {
        if (!allowedKeys.includes(key)) {
          delete prepared[key];
        }
      });
    }

    // Common date fields that need conversion from string to Date
    const dateFields = ['startDate', 'endDate', 'submittedAt', 'approvalDate', 'effectiveDate', 'requestDate', 'joiningDate', 'dateOfBirth', 'createdAt', 'updatedAt', 'timestamp', 'date'];
    
    dateFields.forEach(field => {
      // Don't convert fields that are strings in schema for specific entities
      if (field === 'date') {
        const stringDateModels = ['daily-attendance', 'officer-operations', 'tpd-programs'];
        if (stringDateModels.includes(entity)) return;
      }
      
      if (prepared[field] && typeof prepared[field] === 'string') {
        const d = new Date(prepared[field]);
        if (!isNaN(d.getTime())) {
          prepared[field] = d;
        }
      }
    });

    // SQLite compatibility: Stringify JSON/Array fields
    const jsonFieldsMap: Record<string, string[]> = {
      'daily-attendance': ['learners', 'teachers'],
      'schools': ['location', 'administration', 'enrollment', 'staff', 'infrastructure', 'materials', 'timetable', 'performance', 'finance', 'profileAttendance', 'health', 'programs', 'profileDocuments', 'profileAudit'],
      'teachers': ['professionalInfo', 'performanceHistory', 'achievementRecords', 'documents', 'audit'],
      'inspections': ['photoUrls', 'categories', 'schoolDetails', 'teacherDetails', 'details'],
      'submissions': ['data'],
      'audit-logs': ['details'],
      'monthly-enrolment': ['enrolment', 'dropouts'],
      'ifa-reports': ['girls6to9', 'boys6to12', 'girls10to12'],
      'teachers-returns': ['teachers'],
      'termly-reports': ['academicPerformance', 'activities', 'challenges'],
      'annual-census': ['infrastructure', 'materials', 'staffing'],
      'junior-results': ['registered', 'sat', 'passed', 'failed'],
      'standardised-results': ['scores'],
      'pslce-data': ['summary', 'selection', 'subjectGrades'],
      'examination-results': ['candidates', 'passed', 'standards', 'subjectPerformance'],
      'officer-operations': ['activities', 'challenges', 'recommendations'],
      'nes-standards': ['indicators'],
    };

    const fieldsToJSON = jsonFieldsMap[entity] || [];
    fieldsToJSON.forEach(field => {
      if (prepared[field] !== undefined && typeof prepared[field] !== 'string') {
        prepared[field] = JSON.stringify(prepared[field]);
      }
    });

    return prepared;
  }

  async create(entity: string, data: any) {
    if (VALIDATED_ENTITIES.includes(entity)) {
      const validation = await this.validationService.validate(entity, data);
      this.validationService.throwIfInvalid(validation, entity);
    }

    const schoolId = data.schoolId;
    let zone: string | undefined;
    if (schoolId) {
      const schoolData = await this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { zone: true },
      });
      zone = schoolData?.zone;
    }

    const model = this.getModel(entity);
    const preparedData = this.prepareData(entity, data);
    const result = await model.create({ data: preparedData });

    await this.auditService.logInsert(entity, result.id, result, { schoolId, zone });

    if (schoolId && zone) {
      const module = ENTITY_TO_MODULE_MAP[entity] || 'attendance';
      const recordDate = data.date ? new Date(data.date) : new Date();
      await this.aggregationService.onDataChanged(schoolId, zone, module, recordDate, 'create');
    }
    
    await this.handlePostCreateSideEffects(entity, data, result);
    
    return result;
  }

  private async handlePostCreateSideEffects(entity: string, originalData: any, createdRecord: any) {
    try {
      const schoolId = originalData.schoolId || createdRecord.schoolId;
      if (!schoolId) return;

      if (entity === 'annual-census') {
        const censusInfra = originalData.infrastructure;
        const materials = originalData.materials;
        const staffing = originalData.staffing;
        
        const updateData: any = {};
        
        if (censusInfra) {
          const totalClassrooms = (censusInfra.classrooms?.good || 0) + (censusInfra.classrooms?.fair || 0) + (censusInfra.classrooms?.poor || 0);
          const totalToiletsBoys = censusInfra.toilets?.boys || 0;
          const totalToiletsGirls = censusInfra.toilets?.girls || 0;
          const totalStaffHouses = censusInfra.houses || 0;

          // Update flat fields for quick summary/search
          updateData.classrooms = totalClassrooms;
          updateData.toiletsBoys = totalToiletsBoys;
          updateData.toiletsGirls = totalToiletsGirls;
          updateData.staffHouses = totalStaffHouses;

          // Update structured infrastructure for profile detail view
          const infrastructureProfile = {
            classrooms: totalClassrooms,
            classroomsPermanent: censusInfra.classrooms?.good || 0,
            classroomsTemporary: censusInfra.classrooms?.fair || 0,
            classroomsOpenAir: censusInfra.classrooms?.poor || 0, // Mapping poor to open-air for now as a guestimate if needed
            toiletsBoys: totalToiletsBoys,
            toiletsGirls: totalToiletsGirls,
            toiletsTeachers: censusInfra.toilets?.teachers || 0,
            staffHouses: totalStaffHouses,
            condition: (censusInfra.classrooms?.poor > 0) ? 'Poor' : (censusInfra.classrooms?.fair > 0) ? 'Fair' : 'Good'
          };
          updateData.infrastructure = JSON.stringify(infrastructureProfile);
        }
        
        if (materials) {
          updateData.materials = JSON.stringify(materials);
        }
        
        if (staffing) {
          const staffProfile = {
            totalTeachers: (staffing.qualified || 0) + (staffing.unqualified || 0),
            qualifiedTeachers: staffing.qualified || 0,
            unqualifiedTeachers: staffing.unqualified || 0,
            timestamp: new Date().toISOString()
          };
          updateData.staff = JSON.stringify(staffProfile);
        }

        if (Object.keys(updateData).length > 0) {
          await this.prisma.school.update({
            where: { id: schoolId },
            data: updateData
          });
          console.log(`✅ [EmisService] School profile updated from annual-census for school ${schoolId}`);
        }
      }

      if (entity === 'monthly-enrolment') {
        const enrolment = originalData.enrolment;
        if (enrolment) {
          let total = 0;
          Object.values(enrolment).forEach((std: any) => {
            total += (std.boys || 0) + (std.girls || 0);
          });
          const enrolmentProfile = {
             ...enrolment,
             total,
             month: originalData.month,
             year: originalData.year
          };
          await this.prisma.school.update({
            where: { id: schoolId },
            data: { enrollment: JSON.stringify(enrolmentProfile) }
          });
        }
      }

      if (entity === 'termly-reports') {
        const academicPerformance = originalData.academicPerformance;
        if (academicPerformance) {
           await this.prisma.school.update({
             where: { id: schoolId },
             data: { performance: JSON.stringify(academicPerformance) }
           });
        }
      }

      if (entity === 'daily-attendance') {
        const attendance = {
          date: originalData.date,
          boysPresent: originalData.boysPresent,
          girlsPresent: originalData.girlsPresent,
          teachersPresent: originalData.teachersPresent,
          timestamp: new Date().toISOString()
        };
        await this.prisma.school.update({
          where: { id: schoolId },
          data: { profileAttendance: JSON.stringify(attendance) }
        });
      }

      if (entity === 'examination-results') {
        const performanceProfile = {
          candidates: originalData.candidates,
          passed: originalData.passed,
          standards: originalData.standards,
          year: originalData.year,
          updatedAt: new Date().toISOString()
        };
        await this.prisma.school.update({
          where: { id: schoolId },
          data: { performance: JSON.stringify(performanceProfile) }
        });
      }

      if (entity === 'ifa-reports') {
        const healthProfile = {
          lastIFAReport: {
            month: originalData.month,
            stockBalance: originalData.stockBalance,
            girls6to9: originalData.girls6to9,
            boys6to12: originalData.boys6to12,
            girls10to12: originalData.girls10to12
          },
          updatedAt: new Date().toISOString()
        };
        await this.prisma.school.update({
          where: { id: schoolId },
          data: { health: JSON.stringify(healthProfile) }
        });
      }
    } catch (error) {
      console.error(`❌ [EmisService] Failed to handle side effects for ${entity}:`, error);
      // Don't throw error to avoid breaking the main creation flow
    }
  }

  async findAll(entity: string, query: any) {
    console.log(`🔍 [EmisService] findAll for entity: ${entity}`, query);
    const model = this.getModel(entity);
    const { skip, take, days, ...where } = query;
    
    // Clean query parameters
    const cleanWhere: any = {};
    Object.keys(where).forEach(key => {
      if (where[key] !== undefined && where[key] !== '') {
        cleanWhere[key] = where[key];
      }
    });

    // Special handling for 'days' in daily-attendance
    if (entity === 'daily-attendance' && days) {
      const daysCount = parseInt(days);
      if (!isNaN(daysCount)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysCount);
        const startDateStr = startDate.toISOString().split('T')[0];
        cleanWhere.date = { gte: startDateStr };
      }
    }

    const orderBy: any = {};
    // Only attempt to order by createdAt if it likely exists
    // (most our models have it, but we handle the error gracefully anyway)
    try {
      return await model.findMany({
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
        where: cleanWhere,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      // Graceful fallback for models that don't have createdAt or other sorting issues
      return model.findMany({
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
        where: cleanWhere
      });
    }
  }

  async findOne(entity: string, id: string) {
    const model = this.getModel(entity);
    const record = await model.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`${entity} with ID ${id} not found`);
    return record;
  }

  private async getEntitySchoolId(entity: string, id: string): Promise<{schoolId?: string, zone?: string} | null> {
    const model = this.getModel(entity);
    try {
      const record = await model.findUnique({ where: { id }, select: { schoolId: true } });
      if (!record?.schoolId) return null;
      const school = await this.prisma.school.findUnique({
        where: { id: record.schoolId },
        select: { zone: true },
      });
      return { schoolId: record.schoolId, zone: school?.zone };
    } catch {
      return null;
    }
  }

  async update(entity: string, id: string, data: any) {
    if (VALIDATED_ENTITIES.includes(entity)) {
      const validation = await this.validationService.validate(entity, data, id);
      this.validationService.throwIfInvalid(validation, entity);
    }

    const schoolInfo = await this.getEntitySchoolId(entity, id);
    const oldRecord = await this.getModel(entity).findUnique({ where: { id } });
    
    const model = this.getModel(entity);
    const preparedData = this.prepareData(entity, data);
    const result = await model.update({
      where: { id },
      data: preparedData,
    });

    if (oldRecord) {
      await this.auditService.logUpdate(entity, id, oldRecord, result, {
        schoolId: schoolInfo?.schoolId,
        zone: schoolInfo?.zone,
      });
    }
    
    if (schoolInfo?.schoolId && schoolInfo.zone) {
      const module = ENTITY_TO_MODULE_MAP[entity] || 'attendance';
      const recordDate = data.date ? new Date(data.date) : new Date();
      await this.aggregationService.onDataChanged(schoolInfo.schoolId, schoolInfo.zone, module, recordDate, 'update');
    }
    
    return result;
  }

  async remove(entity: string, id: string) {
    const schoolInfo = await this.getEntitySchoolId(entity, id);
    const oldRecord = await this.getModel(entity).findUnique({ where: { id } });
    
    const model = this.getModel(entity);
    const result = await model.delete({ where: { id } });

    if (oldRecord) {
      await this.auditService.logDelete(entity, id, oldRecord, {
        schoolId: schoolInfo?.schoolId,
        zone: schoolInfo?.zone,
      });
    }
    
    if (schoolInfo?.schoolId && schoolInfo.zone) {
      const module = ENTITY_TO_MODULE_MAP[entity] || 'attendance';
      await this.aggregationService.onDataChanged(schoolInfo.schoolId, schoolInfo.zone, module, new Date(), 'delete');
    }
    
    return result;
  }
}
