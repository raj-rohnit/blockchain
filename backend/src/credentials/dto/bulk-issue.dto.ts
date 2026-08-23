import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { IssueCredentialDto } from './issue-credential.dto';

export class BulkIssueDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one credential row is required' })
  @ArrayMaxSize(500, { message: 'A single bulk upload is limited to 500 rows' })
  @ValidateNested({ each: true })
  @Type(() => IssueCredentialDto)
  rows!: IssueCredentialDto[];
}
