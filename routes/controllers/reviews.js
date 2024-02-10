import express from 'express';
var router = express.Router();

router.get('/user', async(req, res) => {
    try {
        let reviews = await req.models.Reviews.find({reviewer_id: req.query.username})
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({'status': 'error', 'error': error});
    }
})

router.get('/restaurant', async(req, res) => {
    try {
        let reviews = await req.models.Reviews.find({restaurant_id: req.query.restaurant_id})
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({'status': 'error', 'error': error});
    }
})

router.delete('/', async(req, res) => {
    if (req.session.isAuthenticated) {
        try {
            let {reviewID} = req.body;
            let currentReview = await req.models.Reviews.findById(reviewID);
            const currentUser = req.session.account.username;
            if (currentReview.reviewer_id === currentUser) {
                let userAccount = await req.models.UserInfo.findOne({username: currentUser})
                let currentRestaurant = await req.models.Restaurant.findOne({restaurant_id: currentReview.restaurant_id})
                for (let i = userAccount.ratings.length - 1; i >=0; i--) {
                    if (userAccount.ratings[i] === currentReview.reviewer_rating) {
                        userAccount.ratings.splice(i, 1);
                        break;
                    }
                }
                for (let i = currentRestaurant.ratings.length - 1; i >=0; i--) {
                    if (currentRestaurant.ratings[i] === currentReview.reviewer_rating) {
                        currentRestaurant.ratings.splice(i, 1);
                        break;
                    }
                }
                await userAccount.save();
                await currentRestaurant.save();
                await currentReview.deleteOne();
                res.json({'status': 'success'})
            } else {
                res.status(401).json({status: 'error', error: 'you can only delete your own reviews'})
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({'status': 'error', 'error': error});
        }
    } else {
        res.status(401).json({status: 'error', error: 'not logged in'});
    }
})

export default router;
