import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AthletesModule } from './athletes/athletes.module';
import { GroupsModule } from './groups/groups.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PaymentsModule } from './payments/payments.module';
import { MedicalDocumentsModule } from './medical-documents/medical-documents.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { ProgressModule } from './progress/progress.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PublicApiModule } from './public-api/public-api.module';
import { CoachesModule } from './coaches/coaches.module';
import { ParentsModule } from './parents/parents.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    AuthModule,
    AthletesModule,
    GroupsModule,
    SessionsModule,
    AttendanceModule,
    PaymentsModule,
    MedicalDocumentsModule,
    CompetitionsModule,
    ProgressModule,
    NotificationsModule,
    AnalyticsModule,
    ApiKeysModule,
    PublicApiModule,
    CoachesModule,
    ParentsModule,
    TasksModule,
    UsersModule,
  ],
})
export class AppModule {}
