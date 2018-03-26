/**
 * Created by Brett Dixon on 2017-05-24.
 */
var modalMsg = document.getElementById("modalMessage");
var modalTitle = document.getElementById("modalTitle");

document.getElementById("loginButton").addEventListener("click", function() {
    $.ajax({
        url: "/login",
        type: "POST",
        data: {
            username: document.getElementById("usernameInput").value,
            password: document.getElementById("passwordInput").value
        },
        success: function(response) {

            if(response.status === "success") {
                if(response.type === 1){
                    location.href = "/admin"
                } else if (response.type === 2) {
                    location.href = "/kitchen"
                }
            } else if (response.status === "invalid login") {
                modalTitle.innerHTML = "Invalid Login";
                modalMsg.innerHTML = response.message;
                $('#loginModal').modal('show');
            } else {
                modalTitle.innerHTML = "Incorrect Login";
                modalMsg.innerHTML = "Incorrect username or password.  Please try again.";
                $('#loginModal').modal('show');
            }
        }
    });
});