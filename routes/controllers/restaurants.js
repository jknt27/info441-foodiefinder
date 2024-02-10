import express from "express";
import 'dotenv'
import api from 'api';
import yelp from 'yelp-fusion';
const client = yelp.client(process.env.YELP_API_KEY);
const sdk = api('@yelp-developers/v1.0#xtskmqwlofwyovu');
sdk.auth(process.env.YELP_API_SDK_KEY);

var router = express.Router();

function getCurrentTime() {
    const currentTime = new Date();

    // Get hours and minutes
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // Format hours and minutes as a string
    const formattedTime = `${hours < 10 ? '0' : ''}${hours}${minutes < 10 ? '0' : ''}${minutes}`;

    // Get current day of week
    const dayOfWeek = currentTime.toLocaleDateString('en-us', {weekday: 'long'})

    return [dayOfWeek, formattedTime];
}

function checkHours(restaurantHours, currentTime) {
    let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    let currentDay = days.indexOf(currentTime[0]);
    const time = parseInt(currentTime[1]);

    const isCurrentlyOpen = restaurantHours.some(day => {
        const startTime = parseInt(day.start);
        const endTime = parseInt(day.end);
        return day.day === currentDay && time >= startTime && time <= endTime;
    })

    return isCurrentlyOpen;

}

router.get('/', async (req, res) => {
    let restaurantList = await req.models.Restaurant.find();
    try {
        const queryUsername = req.query.username;
        let filteredRestaurants = restaurantList;

        if (queryUsername !== undefined) {
            filteredRestaurants = posts.filter((restaurant) => restaurant.username === queryUsername);
        }
        filteredRestaurants = filteredRestaurants.map((restaurant) => {
            let checkOpen = checkHours(restaurant.hours.open, getCurrentTime());
            
            restaurant.hours.is_open_now = checkOpen;

            return restaurant;
        })

        res.json(filteredRestaurants)
    } catch (error) {
        res.status(500).json({'status': 'error', 'error': error});
    }
    
})

router.get('/search_yelp', async (req, res) => {
    let { restaurant, location, numrestaurant } = req.query;

    let restaurants = (numrestaurant || 5) > 10 ? 10 : (numrestaurant || 5);
    const delay = restaurants > 5 ? 1000 : 0;
    
    const searchRequest = {
        term: restaurant,
        location: location,
    };

    try {
        const response = await client.search(searchRequest);
        let toprestaurants = response.jsonBody.businesses.slice(0, restaurants);
        let results = await Promise.all(toprestaurants.map(async (restaurantInfo) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        let {data} = await sdk.v3_business_info({locale: 'en_US', business_id_or_alias: restaurantInfo.alias})

        return `
            <div class="card m-3" style="max-width: 540px;" id="${data.alias}">
                <div class="row g-0">
                    <div class="col-md-4">
                        <img src="${data.image_url}" class="img-fluid rounded-start" ('alt="${data.name}" style="width: 100%;">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${data.name}</h5>
                            <p class="card-text">Average Pricepoint: ${data.price} / $$$$</p>
                            <p class="card-text">Currently: ${data.hours[0].is_open_now ? '<span style="color: green;">Open</span>' : '<span style="color: red;">Closed</span>'}</p>
                            <p class="card-text">Location: ${data.location.display_address.join(", ")}</p>
                            <p class="card-text">Food Order Type: ${data.transactions.join(", ")}</p>
                            <p class="card-text">Phone Number: ${data.display_phone}</p>
                            <div class="d-flex justify-content-center">
                                <button type="button" class="btn btn-sm btn-success m-2" onClick="addRestaurantDb('${data.alias}')">Add to Foodie Finder</button>
                                <button type="button" class="btn btn-sm btn-warning m-2" onClick="favoriteRestaurant('${data.alias}')">Favorite</button>
                            </div>
                            <div id="messages" class="d-flex justify-content-center">
                                <div id="restaurantStatus-${data.alias}" class="text-success"></div>
                                <div id="addRestaurantUnauth-${data.alias}" class="text-danger"></div>
                                <div id="addFavoriteUnauth-${data.alias}" class="text-danger"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
        }))

        results = results.join("\n")
        let htmlResponse = `
            <h2>Yelp Search Results for: ${restaurant}</h2>
            <h3>Location: ${location}</h3>
            <p><em>Not what you're looking for? Consider adding the restaurant to Foodie Finder to view more details!</em></p>
            <button type="button" class="btn btn-outline-danger" onClick="clearSearchHistory()">Clear Results</button>
            <div class="container d-flex flex-wrap justify-content-center">${results}</div>
        `;
        res.type('html').send(htmlResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", error: error.message });
    }
});


router.post('/search_yelp', async(req, res) => {
    if (req.session.isAuthenticated) {
        try {
            let {restaurantId} = req.body;
            if (!await req.models.Restaurant.exists({restaurant_id: restaurantId})) {

                let {data} = await sdk.v3_business_info({locale: 'en_US', business_id_or_alias: restaurantId})
        
                const newRestaurant = new req.models.Restaurant({
                    restaurant_id: data.alias,
                    name: data.name,
                    image: data.image_url,
                    phoneNum: data.display_phone,
                    location: data.location.display_address.join(", "),
                    coordinates: data.coordinates,
                    cuisine: data.categories.map(category => category.title),
                    orderType: data.transactions,
                    ratings: 0,
                    price: data.price,
                    hours: data.hours[0],
                    favoriteUsers: []
                })
        
                await newRestaurant.save()
        
                res.json({'status': 'success'})
            } else {
                console.error(`${restaurantId} has already been added to Foodie Finder.`)
                alert(`Restaurant has already been added to Foodie Finder.`)
            }
        } catch (error) {
            console.error(error)
            res.status(500).json({'status': 'error', 'error': error});
        }
    } else {
        res.status(401).send({status: 'error', error: 'not logged in'});
    }
    
})

// Get a soecific restaurant page
router.get('/:restaurant_id', async (req, res) => {
    try {
        let data = await req.models.Restaurant.find({restaurant_id: req.params.restaurant_id});

        let checkOpen = checkHours(data[0].hours.open, getCurrentTime());

        data[0].hours.is_open_now = checkOpen;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({'status': 'error', 'error': error});
    }
})

router.post('/addReview', async (req, res) => {
    if (req.session.isAuthenticated) {
        try {
            let {restaurant_id, reviewInput, rating, recommend} = req.body;
            const currentUser = req.session.account.username;
            
            let currentRestaurant = await req.models.Restaurant.findOne({restaurant_id: restaurant_id});
            const newReview = new req.models.Reviews({restaurant_name: currentRestaurant.name, restaurant_id: restaurant_id, reviewer_id: currentUser, reviewer_post: reviewInput, reviewer_rating: rating, would_recommend: recommend});

            currentRestaurant.ratings.push(rating);
            
            let userProfile = await req.models.UserInfo.findOne({username: currentUser}); 
            
            userProfile.ratings.push(rating);

            await currentRestaurant.save();
            await newReview.save();
            await userProfile.save();

            res.json({'status': 'Sucess'})
        } catch(error) {
            console.error(error);
            res.status(500).json({'status': 'error', 'error': error});
        }
    } else {
        res.status(401).json({status: 'error', error: 'not logged in'});
    }
})

export default router;
