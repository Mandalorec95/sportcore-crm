import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiGuard } from './public-api.guard';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AthletesModule } from '../athletes/athletes.module';
import { GroupsModule } from '../groups/groups.module';
import { CompetitionsModule } from '../competitions/competitions.module';
import { PaymentsModule } from '../payments/payments.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    ApiKeysModule,
    AthletesModule,
    GroupsModule,
    CompetitionsModule,
    PaymentsModule,
    AttendanceModule,
    ProgressModule,
  ],
  controllers: [PublicApiController],
  providers: [PublicApiGuard],
})
export class PublicApiModule {}
