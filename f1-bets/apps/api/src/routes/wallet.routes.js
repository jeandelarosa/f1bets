import { Router } from 'express';
import { getTransactions, getWallet } from '../controllers/wallet.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getWallet);
router.get('/transactions', getTransactions);

export default router;
