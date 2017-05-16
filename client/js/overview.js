$(document).ready(function() {
	console.log("This is ready");


	const socket = io();

	socket.emit("join","board");

	socket.emit("load orders");

	socket.on("test1", function(test1){
		socket.emit("test2");
	});

	socket.on("orders", function(orders, ready){
		console.log(orders);
		console.log(ready);
		document.getElementById("in-Progress").innerHTML = "";
		document.getElementById("serving-Now").innerHTML = "";
		for (var i = 0; i < orders.length; i++) {
			var newOrder = document.createElement("div");
			newOrder.innerHTML = orders[i]._orderNumber;
			console.log(orders[i]._orderNumber);
			newOrder.className = "order-Number col-sm-4 offset-sm-1 col-lg-5 offset-lg-1";
			document.getElementById("in-Progress").appendChild(newOrder);
		}
		for (var x = 0; x < ready.length; x++){
			var nowServe = document.createElement("div");
			nowServe.innerHTML = ready[x]._orderNumber;
			nowServe.className = "order-Number col-sm-4 offset-sm-1 col-lg-5 offset-lg-1";
			document.getElementById("serving-Now").appendChild(nowServe);
		}
	});
		
});


