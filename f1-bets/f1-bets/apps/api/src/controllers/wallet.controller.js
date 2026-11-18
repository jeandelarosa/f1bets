import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const transactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const findWallet = async (userId) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new AppError(404, 'Wallet not found');
  return wallet;
};

export const getWallet = async (req, res) => {
  const wallet = await findWallet(req.user.id);
  res.json({ id: wallet.id, balance: wallet.balance });
};

export const getTransactions = async (req, res) => {
  const { limit, offset } = transactionsQuerySchema.parse(req.query);
  const wallet = await findWallet(req.user.id);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where: { walletId: wallet.id } }),
  ]);

  res.json({ transactions, total, limit, offset });
};
