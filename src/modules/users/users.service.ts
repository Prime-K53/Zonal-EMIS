// src/modules/users/users.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  private toPublicUser<T extends { passwordHash?: string; assignedSchools?: string | string[] | null }>(user: T) {
    const { passwordHash, assignedSchools, ...rest } = user;

    const parsedAssignments = Array.isArray(assignedSchools)
      ? assignedSchools
      : (() => {
          if (!assignedSchools) return [];

          try {
            return JSON.parse(assignedSchools);
          } catch {
            return [];
          }
        })();

    return {
      ...rest,
      assignedSchools: parsedAssignments,
    };
  }

  async create(data: { name: string; email: string; role: any; assignedSchools: string[] }) {
    const hashedPassword = await bcrypt.hash('Welcome123!', 10);
    const user = await this.prisma.user.create({
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toPublicUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSchools: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map(user => this.toPublicUser(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async update(id: string, data: any) {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.assignedSchools) updateData.assignedSchools = JSON.stringify(data.assignedSchools);

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedSchools: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toPublicUser(user);
  }

  async updateAssignments(id: string, schools: string[]) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { assignedSchools: JSON.stringify(schools) },
    });

    return this.toPublicUser(user);
  }

  async remove(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { id, deleted: true };
  }
}
