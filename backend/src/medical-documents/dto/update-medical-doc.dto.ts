import { PartialType } from '@nestjs/swagger';
import { CreateMedicalDocDto } from './create-medical-doc.dto';

export class UpdateMedicalDocDto extends PartialType(CreateMedicalDocDto) {}
