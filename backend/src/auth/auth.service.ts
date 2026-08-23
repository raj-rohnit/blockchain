import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InstitutionsRepository } from './institutions.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InstitutionTokenPayload } from './interfaces/institution.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.institutionsRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An institution with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const institution = await this.institutionsRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.buildAuthResponse(institution);
  }

  async login(dto: LoginDto) {
    const institution = await this.institutionsRepository.findByEmail(dto.email);
    if (!institution) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, institution.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(institution);
  }

  private buildAuthResponse(institution: { id: string; name: string; email: string }) {
    const payload: InstitutionTokenPayload = {
      id: institution.id,
      name: institution.name,
      email: institution.email,
    };
    const token = this.jwtService.sign(payload);
    return { token, institution: payload };
  }
}
