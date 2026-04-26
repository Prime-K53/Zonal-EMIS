// src/modules/users/users.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(data: { name: string; email: string; role: any; assignedSchools: string[] }) {
    const hashedPassword = await bcrypt.hash('Welcome123!', 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: hashedPassword,
        assignedSchools: JSON.stringify(data.assignedSchools),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSchools: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSchools: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.assignedSchools) updateData.assignedSchools = JSON.stringify(data.assignedSchools);

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSchools: true,
      },
    });
  }

  async updateAssignments(id: string, schools: string[]) {
    return this.prisma.user.update({
      where: { id },
      data: { assignedSchools: JSON.stringify(schools) },
    });
  }
}
