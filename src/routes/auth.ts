import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
// Body: { email, password, firstName, lastName }
// Creates a User, a linked Member profile, and assigns the
// default "Admin" role (auto-created for the tenant if missing).
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const tenantId = req.tenantId!;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'email, password, firstName, lastName are required' });
      return;
    }

    // Check for duplicate email within tenant
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (existing) {
      res.status(409).json({ error: 'Email already registered in this church' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Transaction: create user + member + assign default role
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { tenantId, email, passwordHash },
      });

      const member = await tx.member.create({
        data: {
          tenantId,
          userId: user.id,
          firstName,
          lastName,
          membershipStatus: 'member',
        },
      });

      // Find or create the "Admin" role for this tenant
      let adminRole = await tx.role.findFirst({
        where: { tenantId, name: 'Admin' },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: { tenantId, name: 'Admin', description: 'Full access administrator', isCustom: false },
        });

        // Attach all existing permissions to Admin role
        const allPerms = await tx.permission.findMany();
        if (allPerms.length > 0) {
          await tx.rolePermission.createMany({
            data: allPerms.map((p) => ({ roleId: adminRole!.id, permissionId: p.id })),
          });
        }
      }

      await tx.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      return { user, member };
    });

    // Issue JWT
    const token = jwt.sign(
      { userId: result.user.id, tenantId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        member: {
          id: result.member.id,
          firstName: result.member.firstName,
          lastName: result.member.lastName,
        },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenantId!;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: { member: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, tenantId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        member: user.member
          ? { id: user.member.id, firstName: user.member.firstName, lastName: user.member.lastName }
          : null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
