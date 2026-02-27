import { Module } from '@nestjs/common';
import { ChoicesController } from './choices.controller';
import { ChoicesService } from './choices.service';

@Module({
  controllers: [ChoicesController],
  providers: [ChoicesService],
  exports: [ChoicesService],
})
export class ChoicesModule {}
