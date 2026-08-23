import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkVerifyDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one credential ID or roll number is required' })
  @ArrayMaxSize(500, { message: 'A single bulk verification is limited to 500 entries' })
  @IsString({ each: true })
  queries!: string[];
}
