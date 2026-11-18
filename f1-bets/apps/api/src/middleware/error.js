import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const notFound = (req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
};

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(400).json({ error: { message: 'Validation error', details } });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Invalid JSON body' } });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: { message: 'Resource already exists' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
};
