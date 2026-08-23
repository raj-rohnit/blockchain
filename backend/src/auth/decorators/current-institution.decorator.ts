import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { InstitutionTokenPayload } from '../interfaces/institution.interface';

export const CurrentInstitution = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): InstitutionTokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.institution;
  },
);
