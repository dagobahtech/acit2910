const express = require("express");
const port = process.env.PORT || 3000;
const path = require("path");
const bodyParser = require("body-parser");
const session = require ("express-session");
const pg = require("pg");

var app = express();
const server = require("http").createServer(app);
var io = require("socket.io")(server);

//import the restaurant class
const Restaurant = require("./kitchen-server/restaurant");

//initialize the restaurant
const dagobah = new Restaurant();
//just a reference to the kitchen object of the restaurant for easy access
const kitchen = dagobah.kitchen;
//declare routes
const admin = require('./routes/admin');
//@jed: I commented this out because I'll be using sockets for the kitchen
//const kitchen = require('./routes/kitchen');

// DanLi - Cloud Database Hosted on ElephantSQL.com credentials posted on GitHub
const dbURL = process.env.DATABASE_URL || "postgres://lpufbryv:FGc7GtCWBe6dyop0yJ2bu0pTXDoBJnEv@stampy.db.elephantsql.com:5432/lpufbryv";


var publicFolder = path.resolve(__dirname, "client/view");

var adminFolder = path.resolve(__dirname, "client/view/admin");
var pFolder = path.resolve(__dirname, "client/public");



// redirect to css and js folders
app.use("/scripts", express.static("client/buildjs"));
app.use("/styles", express.static("client/stylesheet"));


var adminFolder = path.resolve(__dirname, "client/admin");

// redirect to image, css and js folders
app.use("/scripts", express.static("client/build"));
app.use("/styles", express.static("client/src/css"));
app.use("/images", express.static("MenuPics"));


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "dagobahfastfoodsecret",
    resave: "true",
    saveUninitialized: true
}));

//set the home folder to client/build
app.use(express.static(path.join(__dirname, "client","/build")));

//Jed - kitchen testing client
//@JED testing kitchen
var kitchenFolder = path.resolve(__dirname, "client/kitchen-alt");
app.get("/kitchen", function (req, resp) {
    resp.sendFile(kitchenFolder+"/kitchen.html");
} );

// orderview get ajax
app.get("/orderview", function(req,resp) {
    resp.sendFile(pFolder+"/orderview.html");
});


app.use(express.static(path.join(__dirname, "client","/build")));


app.post("/admin/createItem", function(req, resp) {});

//setup the routes
app.use("/admin", admin);
//@jed: commented this, i'll be using sockets for kitchen
//app.use("/kitchen", kitchen);

/* Menu Access code section */

//var menuArray = [];     //server array of menu items to be sent to client.
var comboDiscount = 0.15;  //combo discount.  To be pulled from the database later on.

console.log("menuArray should be empty: "+ dagobah.menuItems.length);
function getMenuItems() {
    pg.connect(dbURL, function(err, client, done){
        if(err){
            console.log(err);
        }
        client.query("SELECT * FROM menu", function(err, results){
                done();
                dagobah.menuItems = results.rows;
                console.log("Menu array in the server updated!");
            });
    });
}

setTimeout(function() {console.log("menuArray after getMenuItems: " + dagobah.menuItems.length)}, 2000);

exports.getMenuItems = getMenuItems(); // DL - export the function to be used in "/routes/admin.js"


//add app.get before this call
app.get('*', function (request, response){
    response.sendFile(path.resolve(__dirname, 'client/build', 'index.html'))
});

//Server side order counter.
var startTime = new Date().getTime();
const dayInMS = 24 * 60 * 60 * 1000;  //a full day measured in millesconds.
var orderNumber = 0;
function orderNumberGenerator() {
    var currentTime = new Date().getTime();
    if (((currentTime - startTime) / dayInMS) >= 1){
        orderNumber = 1;
        startTime = new  Date().getTime();
    } else {
        orderNumber++;
    }
    return orderNumber;
}
// console.log("New Order Number: "+orderNumberGenerator());
// console.log("New Order Number: "+orderNumberGenerator());

//Discount Checker
function isDiscount (order){
    var discount = false;
    var category1 = false;
    var category2 = false;
    var category3 = false;
    for (var i = 0; i < order.items.length; i++){
        if (order.items[i].category == 1) {category1 = true;}
        if (order.items[i].category == 2) {category2 = true;}
        if (order.items[i].category == 3) {category3 = true;}
    }
    if (category1 && category2 && category3) {discount = true;}
    return discount;
}

//true Order Total
function calcTrueTotal(order) {
    var discountAmount = 0;
    var subTotal = 0;
    var total = 0;
    for (var i=0; i<order.items.length; i++){
        for(var j=0; j<dagobah.menuItems.length; j++){
            if (dagobah.menuItems[j].id == order.items[i].id){
                subTotal += order.items[i].quantity * dagobah.menuItems[j].price;
            }
        }
    }
    console.log(isDiscount(order));
    if (isDiscount(order)) {
        total = subTotal * (1 - comboDiscount);
    } else {
        total = subTotal;
    }
    order.subTotal = subTotal;
    order.total = total;

    return order;
}

//all communication with order page happens here
//Jed - added variables for cooking
let cookTimeout;
//these values we might want to send back to client
let cookName;
let cookQuantity;
io.on("connection", function(socket){

    //there should be 2 channels
    //1. Kitchen
    //2. Board
    //Server communication with customer is done via customer's socket
    socket.on("join", function (channel) {
        socket.channel = channel;
        socket.join(channel);
    });

    socket.on("get all orders", function () {
        //check if it is from the kitchen
        if(socket.channel === "kitchen") {
            io.to(socket.channel).emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders, kitchen._foodTray.items);
        }
    });

    //kitchen client requests to do a cook function
    socket.on("cook", function (id, quantity) {
        //make sure its from the kitchen
        if(socket.channel === "kitchen") {
            //its only valid to cook is nothing is cooking ATM
            if(cookTimeout === undefined) {
                //check if the kitchen can cook the quantity specified
                if(kitchen.canCook(quantity)) {
                    console.log("cooking");
                    //set up an initial delay.. delay can be changed
                    //in kitchen class
                    cookTimeout = setTimeout(function () {
                        kitchen.cook(id, quantity);
                        //after cooking set the remove the timeout so other foods
                        //can be prepped
                        cookTimeout = undefined;
                        //then send back status of orders and foodtray back to kitchen client
                        io.to(socket.channel).emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders, kitchen._foodTray.items);
                        io.to(socket.channel).emit("status", false);
                        io.to("board").emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders);
                    }, kitchen.COOK_DELAY );
                } else {
                    //else send a message saying that the quantity is not valid
                    io.to(socket.channel).emit("problem", "invalid quantity");
                }

            } else {
                //something is cooking
                io.to(socket.channel).emit("problem", "Something is already cooking");
            }
        }
    });

    //Kitchen client requests a discard
    socket.on("discard", function (fromOrder, itemIndex, orderIndex) {
        //make sure its from the kitchen
        if(socket.channel === "kitchen") {
            kitchen.discard(fromOrder, itemIndex, orderIndex);
            if(fromOrder) {
                io.to(socket.channel).emit("orders", kitchen._orderQueue.orders, kitchen._foodTray.items);
            } else
            {
                io.to(socket.channel).emit("update","foodtray", kitchen._foodTray.items);
            }
        }
    } );

    //Kitchen client requests a serve function
    socket.on("serve", function (index) {
        if(socket.channel === "kitchen") {
            kitchen.serve(index);
            io.to(socket.channel).emit("update","ready", kitchen._readyQueue.orders);
            io.to("board").emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders);
        }
    } );

    //Kitchen client requests for cooking status
    socket.on("status", function () {
        if(socket.channel === "kitchen") {
            if(cookTimeout) {
                socket.emit("status", true)
            } else {
                socket.emit("status", false);
            }
        }
    } );

    //Customer client requests for menu items
	socket.on("getItems", function(){
        socket.emit("sendData", dagobah.menuItems);
	});

	//when order is received
	socket.on("send order", function (order) {

        let userOrderNumber = kitchen.addOrder(order);
        let order_date = null;

        function dbInsertOrder() {
            pg.connect(dbURL, function (err, client, done) {
                if (err) {
                    console.log
                }
                let dbQuery = "INSERT INTO order_submitted (total) VALUES ($1) RETURNING id, date";
                client.query(dbQuery, [order.total], function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("Result first query: ");
                    let order_id = result.rows[0].id;
                    order_date = result.rows[0].date; // create new obj key with date value
                    console.log(order_id);
                    console.log(order_date);

                    for (let i = 0; i < order.items.length; i++) {
                        let dbQuery2 = "INSERT INTO item_in_order (order_id, item_id) VALUES ($1, $2)";
                        client.query(dbQuery2, [order_id, order.items[i].id], function (err, result) {
                        });
                    }
                    done();

                    socket.emit("orderinfo", userOrderNumber, order_date);
                    io.to("board").emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders);
                    console.log("Order Saved in db");
                });
            });
        }

        // setTimeout set to 0 forces an async function
        setTimeout(dbInsertOrder, 0);


        //console.log it for now
        console.log("Log the order: ");
        console.log(order);
        console.log("Ends order log");

		//console.log it for now
		console.log(order);
		//socket.emit("orderinfo", userOrderNumber);

        


    order = calcTrueTotal(order);

		//send order id to customer

        // console.log(userOrderNumber);
        //inProgress.push(userOrderNumber);
        // console.log(inProgress);

        //after receiving an order
        //send it to kitchen

        io.to("kitchen").emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders, kitchen._foodTray.items);
	});

    socket.on("load orders", function(){
        io.to("board").emit("orders", kitchen._orderQueue.orders, kitchen._readyQueue.orders);
    });



});


server.listen(port, function(err){
    if (err) {
        console.log(err);
        return false;
    }

    console.log("Server is running on port " + port);
});
