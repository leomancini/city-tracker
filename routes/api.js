import { Router } from 'express';
import citiesRouter from './cities.js';
import usersRouter from './users.js';
import importRouter from './import.js';

const router = Router();

router.use('/cities', citiesRouter);
router.use('/users', usersRouter);
router.use('/users', importRouter);

export default router;
