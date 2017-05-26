/**
 * Created by Jed on 2017-05-20.
 */
$(document).ready(function() {
   console.log("ready!");
    
   document.getElementById("showPassword").addEventListener("mousedown", function() {
       showPassword();
   });
   document.getElementById("showPassword").addEventListener("mouseup", function() {
       showPassword();
   });
   function showPassword() {
       var passInput = document.getElementById("pass");
       if(passInput.type == "text") {
           passInput.type = "password";
       } else if (passInput.type == "password"){
           passInput.type = "text";
       }
   }
   //
   // document.getElementById("d-showPassword").addEventListener("mousedown", function() {
   //     showPassword2();
   // });
   // document.getElementById("d-showPassword").addEventListener("mouseup", function() {
   //     showPassword2();
   // });
   function showPassword2() {
       var passInput = document.getElementById("d-pass");
       if(passInput.type == "text") {
           passInput.type = "password";
       } else if (passInput.type == "password"){
           passInput.type = "text";
       }
   }
    
   document.getElementById("createBut").addEventListener("click", function() {
       console.log("working");
       var user = document.getElementById("user").value;
       var pass = document.getElementById("pass").value;
       var type = document.getElementById("type_id").account_type.value;
       
       if(user.length > 0 && pass.length > 0) {
       console.log("working2");
           $.ajax({
               url: "/admin/createAdmin",
               type: "post",
               data: {
                   username: user,
                   password: pass,
                   type: type
               },
               success: function(response) {
                   if(response.status = "fail"){
                       showModal("Invalid Login", response.message, 1);
                   } else{
                       var errBox = document.getElementById("c-error");
                       console.log(response);
                       errBox.style.backgroundColor = "#5cb85c";
                       errBox.style.opacity = "1";
                       errBox.style.borderColor = "#5cb85c";
                       errBox.innerHTML = "Success!";
                   }
               }
           });
       }
   });

   /*
   document.getElementById("deleteBut").addEventListener("click", function() {
       console.log("working");
       var hideDiv = document.getElementById("d-hide");
       console.log(hideDiv);
       hideDiv.style.display = "flex";
       setTimeout(function() {
           hideDiv.style.marginTop = "0";
           hideDiv.style.opacity = "1";
       }, 50);
       for(i = 0; i < hideDiv.childNodes.length; i++) {
           hideDiv.childNodes[i].disabled = "";
       }
   });

   var finalBut = document.getElementById("d-final");
   finalBut.addEventListener("mouseover", function() {
       finalBut.innerHTML = "Are you sure?";
   });
   finalBut.addEventListener("mouseout", function() {
       finalBut.innerHTML = "Delete";
   });
   finalBut.addEventListener("click", function() {
       $.ajax({
           url: "/admin/deleteUser",
           type: "post",
           data: {
               username: document.getElementById("d-user").value,
              password: document.getElementById("d-pass").value
           },
           success: function(response) {
               console.log(response);
               if(response == "error") {
                   document.getElementById("d-error").style.opacity = "1";
                   document.getElementById("d-error").innerHTML = "Error, wrong password";
               }
               else {
                   window.location.href = "admin/logout";
               }
           }
       });
   });
   */
});