import express from 'express';

var router = express.Router();

router.get('/save-restaurant', async (req, res) => {
    const { restaurantId } = req.query;
    const username = req.session.account.username;

    if (req.session.isAuthenticated) {
      try {
        const user = await req.models.UserInfo.findOne({'username': username});
        const restaurants = await req.models.Restaurant.findOne({restaurant_id: restaurantId});
        if (!user.SavedRestaurant.includes(restaurants._id)) {
          user.SavedRestaurant.push(restaurants._id)
          await user.save();
        }
        res.json({'status': 'success'});
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    } else {
      res.status(401).json({ "status": "error", "error": "not logged in" });
    }
  });

router.get('/get-favorite', async (req, res) => {
  try {
    const { user } = req.query;
    const searchUser = await req.models.UserInfo.findOne({'username': user});
    const restaurant = await req.models.Restaurant.find({_id: {$in: searchUser.SavedRestaurant}});
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }

})

router.get('/remove-restaurant', async (req, res) => {
  const { restaurantId, username } = req.query;
  const currentUser = req.session.account.username;

  if (req.session.isAuthenticated && username === currentUser) {
    try {
      const user = await req.models.UserInfo.findOne({'username': currentUser});
      const restaurants = await req.models.Restaurant.findOne({restaurant_id: restaurantId});
      if (user.SavedRestaurant.includes(restaurants._id)) {
        let index = user.SavedRestaurant.indexOf(restaurants._id)
        user.SavedRestaurant.splice(index, 1)
        await user.save();
      }
      res.json({'status': 'success'});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(401).json({ "status": "error", "error": "not logged in" });
  }
})

export default router;
