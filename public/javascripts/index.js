async function init(){
    await loadIdentity();
    await loadFoodieFinder();
}

async function loadFoodieFinder() {
    document.getElementById('foodieFinderPreview').innerText = 'Loading Restaurants...'
    let restaurantList = await fetchJSON('api/restaurants');
    let list = restaurantList.map(data => {
        return `
                <div class="card m-3" style="max-width: 540px;" id="${data.restaurant_id}">
                    <div class="row g-0" style="width: 100%; box-shadow: 4px 4px 8px 0 rgba(0,0,0,0.2);">
                        <div class="col-md-4 d-flex align-items-center" style="padding-left: 14px;">
                            <img src="${data.image}" class="img-fluid rounded" style="border: 1px solid #2c3038; width: 100%;" alt="${data.name}" style="width: 100%;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title" style="font-size: 24px;">${data.name}</h5>
                                <p class="card-text">Average Pricepoint: ${data.price} / $$$$</p>
                                <p class="card-text">Average Foodie Finder Rating: ${data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b) / data.ratings.length).toFixed(2) : 0}</p>
                                <p class="card-text">Currently: ${data.hours.is_open_now ? '<span style="color: green;">Open</span>' : '<span style="color: red;">Closed</span>'}</p>
                                <p class="card-text">Location: ${data.location}</p>
                                <p class="card-text">Food Order Type: ${data.orderType.join(", ")}</p>
                                <p class="card-text">Phone Number: ${data.phoneNum}</p>
                                <div class="d-flex justify-content-center">
                                    <button type="button" class="btn btn-sm btn-success m-2"><a href="/restaurantInfo.html?restaurant_id=${data.restaurant_id}" style="color: inherit; text-decoration: none;">View Details</a></button>
                                    <button type="button" class="btn btn-sm btn-warning m-2" onClick="saveRestaurant('${data.restaurant_id}')">Favorite</button>
                                </div>
                                <div id="messages" class="d-flex justify-content-center">
                                    <div id="restaurantStatus-${data.restaurant_id}" class="text-success"></div>
                                    <div id="addRestaurantUnauth-${data.restaurant_id}" class="text-danger"></div>
                                    <div id="addFavoriteUnauth-${data.restaurant_id}" class="text-danger"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ` 
    })
    document.getElementById('foodieFinderPreview').innerHTML = list.join('\n')
}

async function searchRestaurant() {
    document.getElementById("yelpDataStatus").innerHTML = "Gathering Results..."
    let restaurant = document.getElementById("restaurantInput").value;
    let location = document.getElementById("locationInput").value;
    let numRestaurant = document.getElementById("numberRestaurants").value;    

    try{
        let response = await fetch(`api/restaurants/search_yelp?restaurant=${restaurant}&location=${location}&numrestaurant=${numRestaurant}`)
        let previewHtml = await response.text()
        document.getElementById("yelp_restaurant_preview").innerHTML = previewHtml;
    } catch (error) {
        document.getElementById("yelpDataStatus").innerText = "Error"
        throw(error)
    }

    document.getElementById("yelpDataStatus").innerHTML = "Search Successful!";
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.getElementById("yelpDataStatus").innerHTML = "";
}

async function clearSearchHistory(){
    document.getElementById("yelp_restaurant_preview").innerHTML = "Clearing Results...";
    await new Promise(resolve => setTimeout(resolve, 500));
    document.getElementById("yelp_restaurant_preview").innerHTML = "";
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
        loadFoodieFinder();
        document.getElementById(`restaurantStatus-${restaurantId}`).innerHTML = 'Successfully added to Foodie Finder!';
    } catch (error) {
        addRestaurantUnauth(restaurantId);
    }
}

