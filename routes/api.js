import express from 'express';
var router = express.Router();

import businessRouter from './controllers/restaurants.js';
import usersRouter from './controllers/users.js'
import reviewsRouter from './controllers/reviews.js';
import getInfoRouter from './controllers/getInfo.js';
import userFavoriteRestaurantsRouter from './controllers/userFavoriteRestaurants.js';

router.use('/restaurants', businessRouter);
router.use('/users', usersRouter);
router.use('/reviews', reviewsRouter);
router.use('/getInfo', getInfoRouter);
router.use('/interactions', userFavoriteRestaurantsRouter);


export default router;
