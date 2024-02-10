async function init() {
    await loadIdentity();
    await loadFavorites()
}

async function loadFavorites() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    document.getElementById('favoritestitle').innerText = `Favorite Restaurants of: ${username}`
    document.getElementById('favoritescontainer').innerText = 'Loading Favorites...'
    const restaurants = await fetchJSON(`api/interactions/get-favorite?user=${username}`);

    let list = restaurants.map(data => {
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
                                    <button onclick='removeRestaurant("${data.restaurant_id}")' class="${username == myIdentity ? "" : "d-none"} btn btn-outline-danger">Unfavorite</button></div>
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
    document.getElementById('favoritescontainer').innerHTML = list.join('\n')
}

async function saveRestaurant(restaurantId) {
    try {
      await fetchJSON(`api/interactions/save-restaurant?restaurantId=${encodeURIComponent(restaurantId)}`)
      alert('Successfully Added to Favorites!')
    } catch (error) {
      console.error('Error saving restaurant:', error);
    }
  }
  
async function removeRestaurant(restaurantId) {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('user');
  try {
    await fetchJSON(`api/interactions/remove-restaurant?restaurantId=${encodeURIComponent(restaurantId)}&username=${encodeURIComponent(username)}`)
  } catch (error) {
    console.error('Error saving restaurant:', error);
  }
  loadFavorites()
}