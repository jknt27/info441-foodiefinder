async function init() {
    await loadIdentity();
    loadUserInfo();
}

async function saveUserInfo() {
    let name = document.getElementById('name').value;
    let zipcode = document.getElementById('zipcode').value;
    let favCuisine = document.getElementById('favCuisine').value;
    let favDish = document.getElementById('favDish').value;
    let favRestaurant = document.getElementById('favRestaurant').value;
    let allergies = document.getElementById('allergies').value;
    let diet = document.getElementById('diet').value;

    let responseJson = await fetchJSON(`api/getInfo`, {
        method: "POST",
        body: { name: name, zipcode: zipcode, favCuisine: favCuisine, favDish: favDish, favRestaurant: favRestaurant, allergies: allergies, diet: diet }
    })

    document.getElementById('name').value = "";
    document.getElementById('zipcode').value = "";
    document.getElementById('favCuisine').value = "";
    document.getElementById('favDish').value = "";
    document.getElementById('favRestaurant').value = "";
    document.getElementById('allergies').value = "";
    document.getElementById('diet').value = "";
    document.getElementById('saveUserInfoStatus').innerHTML = 'Successfully Saved Information!';

    loadUserInfo();

    await new Promise(resolve => setTimeout(resolve, 2500));

    document.getElementById('saveUserInfoStatus').innerHTML = '';
}

async function loadUserInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    if (username == myIdentity) {
        document.getElementById("username-span").innerText = `You (${username})`;
        document.getElementById("user_info_new_div").classList.remove("d-none");

    } else {
        document.getElementById("username-span").innerText = username;
        document.getElementById("user_info_new_div").classList.add("d-none");
    }

    document.getElementById('user_info_div').innerText = 'Loading...';
    let userInfoJson = await fetchJSON(`api/getInfo?username=${username}`);

    let userInfo = userInfoJson.map(user => {
        return `
        <div class="userInfo">
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Total Reviews:</strong> ${user.ratings.length > 0 ? user.ratings.length : 0}</p>
            <p><strong>Average User Rating:</strong> ${user.ratings.length > 0 ? (user.ratings.reduce((a, b) => a + b) / user.ratings.length).toFixed(2) : 0}</p>
            <p><strong>Total Friends:</strong> ${user.friends.length > 0 ? user.friends.length : 0}</p>

            <p><strong>Zip Code:</strong> ${user.zipCode}</p>
            <p><strong>Favorite Cuisine:</strong> ${user.favorite_cuisine}</p>
            <p><strong>Favorite Dish:</strong> ${user.favorite_dish}</p>
            <p><strong>Favorite Restaurant:</strong> ${user.favorite_restaurant}</p>
            <p><strong>Allergies:</strong> ${user.allergies}</p>
            <p><strong>Diet:</strong> ${user.diet}</p>
            <hr>
        </div>
        `
    }).join("\n");
    document.getElementById('user_info_div').innerHTML = userInfo;

    loadUserReviews(username);
}


async function loadReviews() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    loadUserReviews(username);
}

// LOAD USER REVIEWS
async function loadUserReviews(username) {
    document.getElementById("reviews_box").innerText = "Loading...";
    let reviewsJson = await fetchJSON(`api/reviews/user?username=${encodeURIComponent(username)}`);
    let reviewsHtml = reviewsJson.map(reviewInfo => {
        return `
        <div class="review-box">
            <div class="mb-2" style="font-size: 20px;"><a href="/restaurantInfo.html?restaurant_id=${encodeURIComponent(reviewInfo.restaurant_id)}">${escapeHTML(reviewInfo.restaurant_name)}</a></div>
            <p>Rating: ${reviewInfo.reviewer_rating}</p>
            <p>Would Recommend: ${reviewInfo.would_recommend ? 'Yes' : 'No'}</p>
            <p>Review Wrote: ${reviewInfo.reviewer_post}</p>
            <p>Date Reviewed: ${escapeHTML(reviewInfo.created_date)}</p>
            <div><button onclick='deleteReview("${reviewInfo._id}")' class="${reviewInfo.reviewer_id == myIdentity ? "" : "d-none"} btn btn-outline-danger">Delete</button></div>
        </div>`
    }).join("\n");
    document.getElementById("reviews_box").innerHTML = reviewsHtml;    
}

// DELETE REVIEWS
async function deleteReview(reviewID) {
    let responseJson = await fetchJSON(`api/reviews`, {
        method: "DELETE",
        body: { reviewID: reviewID }
    })
    loadUserInfo();
}

async function LoadFriendRecommendation() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        let friendRecJson = await fetchJSON(`api/users/friendsRec?username=${encodeURIComponent(username)}`);
        let friendRecHtml = friendRecJson.map(friendRecINFO => {
            return `
            <div style="border: 1px solid #ccc; padding: 15px; margin: 10px; text-align: center; max-width: 350px;">
            <h2 style="margin: 0;"> ${escapeHTML(friendRecINFO.name)}</h2>
            <p style="margin: 5px 0;">Username: ${escapeHTML(friendRecINFO.username)}</p>
            <p style="margin: 5px 0;">Favorite Cuisine: ${escapeHTML(friendRecINFO.favorite_cuisine)}</p>
            <p style="margin: 5px 0;">Favorite Restaurant: ${escapeHTML(friendRecINFO.favorite_restaurant)}</p>
            <button style="padding: 5px 10px; margin: 5px;border-radius: 10px; border: None; background-color: #3498db; color: #fff;" onclick='sendRequest("${friendRecINFO.username}")'>Send Request</button>
            <button style="padding: 5px 10px; margin: 5px;border-radius: 10px;border: None; "onclick='undsendRequest("${friendRecINFO.username}")'>Unsend Request</button>
        </div>
        `
        }).join("\n");
        document.getElementById("friendRec_box").innerHTML = friendRecHtml;
    } catch (error) {
        console.error(error);
    }
}

async function sendRequest(ReceverName) {
    try {
        await fetchJSON(`api/users/friendsSendAccpet?ReceverName=${encodeURIComponent(ReceverName)}`);
    } catch (error) {
        console.error(error);
    }
}
async function undsendRequest(ReceverName) {
    try {
        await fetchJSON(`api/users/friendsUnSendAccpet?ReceverName=${encodeURIComponent(ReceverName)}`);
    } catch (error) {
        console.error(error);
    }
}
async function LoadpendingInvitation() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        let friendRecJson = await fetchJSON(`api/users/pending?username=${encodeURIComponent(username)}`);
        let friendRecHtml = friendRecJson.map(friendRecINFO => {
            return `
            <div style="border: 1px solid #ccc; padding: 15px; margin: 10px; text-align: center; max-width: 350px;">
            <h2 style="margin: 0;"> ${escapeHTML(friendRecINFO.receiverName)}</h2>
            <p style="margin: 5px 0;">Status: ${escapeHTML(friendRecINFO.Status)}</p>
        </div>
        `
        }).join("\n");
        document.getElementById("pending").innerHTML = friendRecHtml;
    } catch (error) {
        console.error(error);
    }
}

async function LoadFriend() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        let friendRecJson = await fetchJSON(`api/users/friend?username=${encodeURIComponent(username)}`);
        let friendRecHtml = friendRecJson.map(friendRecINFO => {
            return `
            <div style="border: 1px solid #ccc; padding: 15px; margin: 10px; text-align: center; max-width: 350px;">
            <h2 style="margin: 0;"> ${escapeHTML(friendRecINFO.name)}</h2>
            <p style="margin: 5px 0;">Username: ${escapeHTML(friendRecINFO.username)}</p>
            <p style="margin: 5px 0;">Favorite Cuisine: ${escapeHTML(friendRecINFO.favorite_cuisine)}</p>
            <p style="margin: 5px 0;">Favorite Restaurant: ${escapeHTML(friendRecINFO.favorite_restaurant)}</p>

            <br>
            <button onclick='toggleMessage("${friendRecINFO.username}")'>View/Hide Message</button>
            <div id='message-box-${friendRecINFO.username}' class="comments-box d-none">
                <button onclick='refreshMessage("${friendRecINFO.username}")'>refresh comments</button> 
                <div id='message-${friendRecINFO.username}'></div>
                <div class="new-message-box">
                    New Message:
                    <textarea type="textbox" id="new-message-${friendRecINFO.username}"></textarea>
                    <button onclick='postMessage("${friendRecINFO.username}")'>Post Message</button>
                </div>
            </div>

            <br>

            <button style="padding: 5px 10px; margin: 5px;border-radius: 10px;border: None; "onclick='unfriend("${friendRecINFO.username}")'>Unfriend</button>
        </div>
        `
        }).join("\n");
        document.getElementById("friend_box").innerHTML = friendRecHtml;
    } catch (error) {
        console.error(error);
    }
}

function getCommentHTML(messageJSON) {
    return messageJSON.map(messageInfo => {
        return `
        <div class="individual-comment-box">
            <div>${escapeHTML(messageInfo.message)}</div>
            <div> - by ${encodeURIComponent(messageInfo.senderName)}, ${escapeHTML(messageInfo.date)} </div>
        </div>`
    }).join(" ");
}

async function toggleMessage(FriendUserName) {
    let element = document.getElementById(`message-box-${FriendUserName}`);
    if (!element.classList.contains("d-none")) {
        element.classList.add("d-none");
    } else {
        element.classList.remove("d-none");
        let messageElement = document.getElementById(`message-${FriendUserName}`);
        if (messageElement.innerHTML == "") { // load comments if not yet loaded
            messageElement.innerHTML = "loading..."

            let messageJSON = await fetchJSON(`api/users/getmessage?ReceverName=${encodeURIComponent(FriendUserName)}`);

            messageElement.innerHTML = getCommentHTML(messageJSON);
        }
    }
}

async function refreshMessage(FriendUserName) {
    let messageElement = document.getElementById(`message-${FriendUserName}`);
    messageElement.innerHTML = "loading..."

    let messageJSON = await fetchJSON(`api/users/getmessage?ReceverName=${encodeURIComponent(FriendUserName)}`);
    messageElement.innerHTML = getCommentHTML(messageJSON);
}

async function postMessage(FriendUserName) {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    let message = document.getElementById(`new-message-${FriendUserName}`).value;
    await fetchJSON(`api/users/message?ReceverName=${encodeURIComponent(FriendUserName)}`, {
        method: "POST",
        body: { senderName: username, receiverName: FriendUserName, message: message, date: new Date() }
    });
    refreshMessage(FriendUserName);
}

async function unfriend(ReceverName) {
    try {
        await fetchJSON(`api/users/unfriend?ReceverName=${encodeURIComponent(ReceverName)}`);
    } catch (error) {
        console.error(error);
    }
}

async function LoadFriendInvitation() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        let friendRecJson = await fetchJSON(`api/users/request?username=${encodeURIComponent(username)}`);
        let friendRecHtml = friendRecJson.map(friendRecINFO => {
            return `
                <div style="border: 1px solid #ccc; padding: 15px; margin: 10px; text-align: center; max-width: 350px;">
                <h2 style="margin: 0;"> ${escapeHTML(friendRecINFO.name)}</h2>
                <p style="margin: 5px 0;">Username: ${escapeHTML(friendRecINFO.username)}</p>
                <p style="margin: 5px 0;">Favorite Cuisine: ${escapeHTML(friendRecINFO.favorite_cuisine)}</p>
                <p style="margin: 5px 0;">Favorite Restaurant: ${escapeHTML(friendRecINFO.favorite_restaurant)}</p>
                <button style="padding: 5px 10px; margin: 5px;border-radius: 10px; border: None; background-color: #3498db; color: #fff;" onclick='acceptRequest("${friendRecINFO.username}")'>Accept Request</button>
                <button style="padding: 5px 10px; margin: 5px;border-radius: 10px;border: None; "onclick='undsendRequest("${friendRecINFO.username}")'>Reject Request</button>
            </div>
            `
        }).join("\n");
        document.getElementById("friend_invitebox").innerHTML = friendRecHtml;
    } catch (error) {
        console.error(error);
    }
}

async function acceptRequest(ReceverName) {
    try {
        await fetchJSON(`api/users/friendAccpet?ReceverName=${encodeURIComponent(ReceverName)}`);
    } catch (error) {
        console.error(error);
    }
}
