import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const INITIAL_BALANCE = 1000;

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const signToken = (userId) => jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  const { email, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      wallet: {
        create: {
          balance: INITIAL_BALANCE,
          transactions: { create: { type: 'INITIAL_BONUS', amount: INITIAL_BALANCE } },
        },
      },
    },
    include: { wallet: true },
  });

  res.status(201).json({
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    wallet: { balance: user.wallet.balance },
    token: signToken(user.id),
  });
};

export const login = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new AppError(401, 'Invalid credentials');

  res.json({
    user: { id: user.id, email: user.email },
    token: signToken(user.id),
  });
};
