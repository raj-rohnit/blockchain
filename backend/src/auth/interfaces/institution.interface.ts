export interface Institution {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface InstitutionTokenPayload {
  id: string;
  name: string;
  email: string;
}
