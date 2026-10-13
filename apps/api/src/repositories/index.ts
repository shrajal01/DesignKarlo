import { isDbConnected } from '../config/db';
import { inMemoryAttemptRepository } from './inMemoryAttemptRepository';
import { mongoAttemptRepository } from './mongoAttemptRepository';
import type { IAttemptRepository } from './types';

export * from './types';
export * from './inMemoryAttemptRepository';
export * from './mongoAttemptRepository';

export function getRepository(): IAttemptRepository {
  if (isDbConnected()) {
    return mongoAttemptRepository;
  }
  return inMemoryAttemptRepository;
}
