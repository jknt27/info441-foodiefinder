let myIdentity = undefined;

async function loadIdentity(){
    let identity_div = document.getElementById("identity_div");

    try{
        let identityInfo = await fetchJSON(`api/users/myIdentity`)
        
        if(identityInfo.status == "loggedin"){
            myIdentity = identityInfo.userInfo.username;
            identity_div.innerHTML = `
            <div class="dropdown">
                <a href="#" class="dropdown-toggle navlink-account" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Account</a>
                <ul class="dropdown-menu text-end mt-3" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item" href="/userInfo.html?user=${encodeURIComponent(identityInfo.userInfo.username)}">User Profile</a></li>
                    <li><a class="dropdown-item" href="/favorites.html?user=${encodeURIComponent(identityInfo.userInfo.username)}">Favorite Restaurants</a></li>
                    <li><a class="dropdown-item" href="/friends.html?user=${encodeURIComponent(identityInfo.userInfo.username)}">Friends</a></li>
                    <hr class="my-2">
                    <li><a class="dropdown-item" href="signout">Log out</a></li>
                </ul>
            </div>`;
        } else { //logged out
            myIdentity = undefined;
            identity_div.innerHTML = `
            <a href="signin" class="btn btn-secondary" role="button">Log in</a>`;
        }   
    } catch(error){
        myIdentity = undefined;
        identity_div.innerHTML = `<div>
        <button onclick="loadIdentity()">retry</button>
        Error loading identity: <span id="identity_error_span"></span>
        </div>`;
        document.getElementById("identity_error_span").innerText = error;
    }
}
