import { IsNotEmpty, IsString } from 'class-validator';

export class IssueCredentialDto {
  @IsString()
  @IsNotEmpty()
  studentName!: string;

  @IsString()
  @IsNotEmpty()
  studentRollNo!: string;

  @IsString()
  @IsNotEmpty()
  courseName!: string;

  @IsString()
  @IsNotEmpty()
  cgpa!: string;

  @IsString()
  @IsNotEmpty()
  issueDate!: string;
}
