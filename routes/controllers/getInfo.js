import express from 'express';

var router = express.Router();

router.get('/', async (req, res) => {
    try {
        console.log(req.query.username)
        let userInfo = await req.models.UserInfo.find({username: req.query.username})
        res.json(userInfo);
    } catch (error) {
        console.log(error);
        res.status(500).json({'status': 'error', 'error': error})
    }
})

router.post('/', async (req, res) => {
    if (req.session.isAuthenticated) {
        try {
            let {name, zipcode, favCuisine, favDish, favRestaurant, allergies, diet} = req.body;
            const currentUser = req.session.account.username;
            await req.models.UserInfo.deleteMany({username: currentUser});
            const userInfo = new req.models.UserInfo({username: currentUser, name: name, zipCode: zipcode, favorite_cuisine: favCuisine, favorite_dish: favDish, favorite_restaurant: favRestaurant, allergies: allergies, diet: diet})
            await userInfo.save()
            res.json({'status': 'success'})
        } catch (error) {
            console.log(error);
            res.status(500).json({'status': 'error', 'error': error});
        }
    } else {
        res.status(401).json({status: 'error', error: 'not logged in'});
    }
})

export default router;
