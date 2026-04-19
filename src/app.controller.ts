import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Aplicación')
@Controller()
export class AppController {
  constructor() {}
}
