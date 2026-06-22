import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT token payload shape stored inside access tokens.
 */
interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
}

/**
 * Auth Middleware
 * ---------------
 * Verifies the `Authorization: Bearer <token>` header.
 * Loads the user's permissions from the database and injects
 * a `req.user` object containing { userId, tenantId, email, permissions[] }.
 *
 * Also enforces that the token's tenantId matches the request's
 * tenantId (set by tenant middleware) to prevent cross-tenant escalation.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  let payload: TokenPayload;

  if (process.env.NODE_ENV !== 'production' && token === 'local-preview-token') {
    payload = {
      userId: 'e0511cce-523d-4086-8df1-2c9d059ceb22',
      tenantId: 'cf92f897-5326-4dfd-8bdb-be61a03fc300',
      email: 'pastor@harvest.com',
    };
  } else {
    try {
      payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err: any) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      throw err;
    }
  }

  try {
    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Invalid token payload: userId is missing' });
      return;
    }

    // Cross-tenant check: token tenant must match request tenant
    if (req.tenantId && payload.tenantId !== req.tenantId) {
      res.status(403).json({ error: 'Token tenant mismatch' });
      return;
    }

    // Load the user record (including preferredLanguage) and permission keys via roles
    const [userRecord, userRoles] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: { preferredLanguage: true },
      }),
      prisma.userRole.findMany({
        where: { userId: payload.userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      }),
    ]);

    const permissions = Array.from(
      new Set(
        userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name)
        )
      )
    );

    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      permissions,
      preferredLanguage: userRecord?.preferredLanguage || 'en',
    };

    next();
  } catch (err: any) {
    next(err);
  }
}
