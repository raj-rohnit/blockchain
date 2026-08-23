import { IsOptional, IsString } from 'class-validator';

export class RevokeCredentialDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
