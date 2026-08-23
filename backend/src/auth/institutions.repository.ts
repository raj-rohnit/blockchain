import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Institution } from './interfaces/institution.interface';

function toInstitution(row: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}): Institution {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class InstitutionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; email: string; passwordHash: string }): Promise<Institution> {
    const row = await this.prisma.institution.create({ data });
    return toInstitution(row);
  }

  async findByEmail(email: string): Promise<Institution | null> {
    const row = await this.prisma.institution.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    return row ? toInstitution(row) : null;
  }
}
