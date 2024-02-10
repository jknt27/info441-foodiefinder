async function init() {
    await loadIdentity();
    loadDetailInfo();
    loadReviews();
}

async function loadDetailInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurant_id = urlParams.get('restaurant_id');
    let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const data = await fetchJSON(`api/restaurants/${restaurant_id}`);
    const listedHours = data.hours.open;
    let hoursIndex = 0;
    const hoursOpen = days.map((day) => {
        let index = days.indexOf(day);
        if (listedHours[hoursIndex] !== undefined) {
            if(listedHours[hoursIndex].day === index) {
                let currentDay = `<strong>${day}</strong>: ${listedHours[hoursIndex].start} - ${listedHours[hoursIndex].end}`;
                hoursIndex++;
                return currentDay;
            } else {
                return `<span class="text-danger"><strong>${day}: CLOSED</strong></span>`
            }
        } else {
            return `<span class="text-danger"><strong>${day}: CLOSED</strong></span>`
        }
    })

    let output = 
    `
        <div class="" style="max-width: 720px;" id="${data.restaurant_id}">
            <div class="row g-0">
                <div class="col-md-4">
                    <img src="${data.image}" class="img-fluid rounded-start" alt="${data.name}" style="width: 100%;">
                </div>
                <div class="col-md-8">
                    <div class="card-body">
                        <h1 class="card-title">${data.name}</h1>
                        <p class="card-text">Cuisine: ${data.cuisine}</p>
                        <p class="card-text">Average Pricepoint: ${data.price} / $$$$</p>
                        <p class="card-text">Currently: ${data.hours.is_open_now ? '<span style="color: green;">Open</span>' : '<span style="color: red;">Closed</span>'}</p>
                        <p class="card-text">Location: ${data.location}</p>
                        <p class="card-text">Food Order Type: ${data.orderType.toString()}</p>
                        <p class="card-text">Phone Number: ${data.phoneNum}</p>
                        <p class="card-text">Number of Favorites: ${data.favoriteUsers.length}</p>
                        <p class="card-text">Number of Reviews: ${data.ratings.length}</p>
                        <p class="card-text">Average Foodie Finder Rating: ${data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b) / data.ratings.length).toFixed(2) : 0}</p>
                        <div class="d-flex justify-content-center">
                            <button type="button" class="btn btn-sm btn-warning m-2" onClick="favoriteRestaurant('${data.restaurant_id}')">Favorite</button>
                        </div>
                        <div
                        <div id="messages" class="d-flex justify-content-left">
                            <div id="restaurantStatus-${data.restaurant_id}" class="text-success"></div>
                            <div id="addFavoriteUnauth-${data.restaurant_id}" class="text-danger"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8" id="openHours">
                <h3>Opening Hours</h3>
                <p><em>NOTE: TIMES ARE IN 24-HOUR FORMAT</em></p>
                ${hoursOpen.map(day => `<p>${day}</p>`).join('\n')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('renderRestaurantInfo').innerHTML = output; 
}

async function addRestaurantUnauth(restaurantId) {
    document.getElementById(`addRestaurantUnauth-${restaurantId}`).innerHTML = 'Please Log In to Add to Foodie Finder!';
    await new Promise(resolve => setTimeout(resolve, 5000));
    document.getElementById(`addRestaurantUnauth-${restaurantId}`).innerHTML = '';
}

async function addFavoriteUnauth(restaurantId) {
    document.getElementById(`addFavoriteUnauth-${restaurantId}`).innerHTML = 'Please Log In to Add to Favorites!';
    await new Promise(resolve => setTimeout(resolve, 5000));
    document.getElementById(`addFavoriteUnauth-${restaurantId}`).innerHTML = '';
}

async function addRestaurantDb(restaurantId) {
    try {
        await fetchJSON(`api/restaurants/search_yelp`, {
            method: "POST",
            body: {restaurantId: restaurantId}
        })
        document.getElementById(`restaurantStatus-${restaurantId}`).innerHTML = 'Successfully added to Foodie Finder!';
    } catch (error) {
        addRestaurantUnauth(restaurantId);
    }
    // IMPLEMENT AFTER DB WORKS
    // loadRestaurants();
}


async function favoriteRestaurant(restaurantID){
    try {
        await fetchJSON(`api/restaurants/favorite`, {
            method: "POST",
            body: {restaurantID: restaurantID}
        })
    } catch (error) {
        addFavoriteUnauth(restaurantID)
    }
    // loadRestaurants();
}

async function unfavoriteRestaurant(restaurantID){
    await fetchJSON(`api/restaurants/unfavorite`, {
        method: "POST",
        body: {restaurantID: restaurantID}
    })
    // loadRestaurants();
}

async function submitReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurant_id = urlParams.get('restaurant_id');

    let reviewInput = document.getElementById('restaurantReviewInput').value;
    let rating = document.getElementById('restaurantRating').value;
    let recommend = document.querySelector('input[name="recommendRadio"]:checked').value;

    await fetchJSON('api/restaurants/addReview', {
        method: "POST",
        body: {restaurant_id, reviewInput, rating, recommend}
    })

    document.getElementById('reviewStatus').innerHTML = "Review Submitted Successfully!"
    // IMPLEMENT
    loadDetailInfo()
    loadReviews()
    document.getElementById('createreviews').reset();
    document.getElementById('reviewStatus').innerHTML = ""
}

async function loadReviews() {
    document.getElementById('allRestaurantReviews').innerHTML = "Loading Reviews..."

    const urlParams = new URLSearchParams(window.location.search);
    const restaurant_id = urlParams.get('restaurant_id');

    let data = await fetchJSON(`api/reviews/restaurant?restaurant_id=${restaurant_id}`)

    let preview = data.map(review => {
        return `<div id="${restaurant_id}-${review.reviewer_id}">
            <h3>Name: <a href="/userInfo.html?user=${review.reviewer_id}">${review.reviewer_id}</a></h3>
            <p>Rating: ${review.reviewer_rating}</p>
            <p>Would Recommend: ${review.would_recommend? 'Yes' : 'No'}</p>
            <p>${review.reviewer_post}</p>

        </div>`
    }).join('\n')
    document.getElementById('allRestaurantReviews').innerHTML = preview;
}
