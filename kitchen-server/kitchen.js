'use-strict'

const OrderQueue = require("./order-queue");
const Item = require("./item");
const Order = require("./order");
const ItemList = require("./item-list");
const FoodTray = require("./food-tray");

//import the restuarant constraints class
const SysConstraints = require('./system-constraints');
//initialise the constraints for a file.


//var menuArray = [];     //server array of menu items to be sent to client.
// var comboDiscount = restConstrains.comboDiscount;  //combo discount.

//define constants
//valid quantities to cook
const VALID_QUANTITIES = [1,2,6];
// const DEFAULT_MAX_ORDER = 10;
// const DEFAULT_COOK_DELAY = 5000;
// const DEFAULT_MAX_ITEM_COUNT = 10;
// const DEFAULT_MAX_ITEM_QUANTITY = 6;

class Kitchen {

    constructor() {
         this._readyQueue = new OrderQueue();
         this._orderQueue = new OrderQueue();
         this._foodTray = new FoodTray();
         this.constraints = new SysConstraints();
         this._orderNumber = 1;
         // this._maxOrderNumber = restConstrains.maxOrders;
         // this._cookDelay = restConstrains.cookTime; //in milliseconds. set for 1 for now. change in the future
         // this._maxItemPerOrder = restConstrains.;
         // this._maxQuantityPerItem = restConstrains.maxPerItem;
         // this._comboDiscount = restConstrains;
        // cannot modify if store is closed
        // max items: 1 - 15 : add this to ini
        // max qty per item: 1 - 10
        // max orders: 5 - 20
        // combo discount: 0 - .30

        this._ORDERS_MAX =20;
        this._ORDERS_MIN =5;

        this._ITEMS_MAX = 15;
        this._ITEMS_MIN = 1;

        this._QTY_MIN = 1;
        this._QTY_MAX = 10;

        this._COMBO_MIN = 0;
        this._COMBO_MAX = 0.30;

    }

    // kitchen.saveConstraints(req.body.orders, req.body.items, req.body.qty, req.body.discount);
    saveConstraints(orders, items, qty, combo) {

        if(orders < this._ORDERS_MIN || orders > this._ORDERS_MAX ||
           items < this._ITEMS_MIN || items > this._ITEMS_MAX ||
           qty < this._QTY_MIN || qty > this._QTY_MAX ||
           combo < this._COMBO_MIN || combo > this._COMBO_MAX) {
            return false;
        }

        this.constraints.maxItemPerOrder = items;
        this.constraints.maxOrders = orders;
        this.constraints.comboDiscount = combo;
        this.constraints.maxPerItem = qty;

        this.constraints.writeToFile();

        return true;
    }

    set comboDiscount(newDiscount) {
        this.constraints.comboDiscount = newDiscount;
    }

    get comboDiscount() {
        return parseFloat(this.constraints.comboDiscount);
    }

    set maxItemPerOrder(newCount) {
        this.constraints.maxItemPerOrder = newCount;
    }

    get maxItemPerOrder() {
        return parseInt(this.constraints.maxItemPerOrder);
    }

    set maxQuantityPerItem(newQuantity) {
        this.constraints.maxPerItem = newQuantity;
    }

    get maxQuantityPerItem() {
        return parseInt(this.constraints.maxPerItem);
    }

    get maxOrders() {
        return parseInt(this.constraints.maxOrders);
    }

    set maxOrders(value) {
        this.constraints.maxOrders = value;
    }

    set cookDelay(newDelay) {
        this.constraints.cookTime = newDelay;
    }

    get cookDelay() {
        return parseInt(this.constraints.cookTime);
    }
    get orderQueue() {
        return this._orderQueue;
    }

    get readyQueue() {
        return this._readyQueue;
    }

    get foodTray() {
        return this._foodTray;
    }


    // set cookDelay(newDelay) {
    //     this._cookDelay = newDelay;
    // };
    //
    // get cookDelay() {
    //     return this._cookDelay;
    // }

    //TODO need to refactor this shit. this shit is too smurfing long. is it because of error handling? :(
    /*
    * @params
    * order: Object
    *   Order object coming from client side. needs to be parsed before adding to the order queue
    * @returns
    *   orderNumber: Integer*/
    addOrder(order) {
        if(this._orderQueue.orders.length === this.maxOrders) {
            throw "Orders maxed";
        }
        try {
            //check order
            //it needs to be defined and have an items property
            if(order && typeof(order.items) !== 'undefined') {

                let newOrder = new Order(this._orderNumber);
                //create a list of items to be added to this order
                newOrder.items = this._createOrderItemsList(order.items);
                //an empty order is not considered an order
                if(!newOrder.items.isEmpty()) {
                    this._orderQueue.addOrder(newOrder);
                } else {
                    throw "empty order"
                }

            } else {
                throw 'bad structure'
            }
        } catch(error) {
            throw error
        }
        //only increment order number if
        //order successfully added
        let orderNumber = this._orderNumber;
        this._orderNumber++;

        //TODO moving to ready queue
        //after adding order, check all the orders.
        //this order might be finished if food tray has all it needs
        //move all finished orders to ready queue
        this._updateReadyQueue(); //TODO still a stub function
        return orderNumber;
    }

    popReadyItems(orderserved){
        this._readyQueue.splice(orderServed,1);
    }

    /*
    * rest the values of the kitchen
    * */
    reset() {
        this._orderNumber = 0; //goes back to zero;
        this._readyQueue.clear();
        this._orderQueue.clear();
        this._foodTray.clear();
    }

    //function to check if quantity can be cooked
    canCook(quantity) {
        return (VALID_QUANTITIES.includes(quantity));
    }

    //function to cook food
    //this is called after a 5 seconds delay
    /*
    * @params
    * item : Item
    *   item to be cooked
    *  quantity : Integer
    *   how many items are to be cooked*/
    cook(item, quantity){

        //since this is called after the delay
        //we'll get the time here, and it will be the time
        //that the food is cooked
        let cookedTime = new Date().getTime();
        //get pointer to all possible items starting from
        //the priority order
        let items = this._getPossibleItems(item.id);
        console.log("possible items found", items.length); //print debug statement. will be removed later
        //then prep them, by the set quantity
        //and use the cookedTime as the time when they
        //are finished cooking
        this._prep(items, quantity, cookedTime);

        //if the quantity to be cooked is greater than
        //the items in the oder. we have an excess
        let excess = Math.max(0, quantity - items.length);
        //put the excess food in food tray by passing a reference item
        //so the function can copy it. Passed the cookedTime here too
        //so they are consistent with the ones above
        this._putToFoodTray(item, excess, cookedTime);

        //TODO moving to ready queue
        //after cooking something, check all the orders.
        //move all finished orders to ready queue
        this._updateReadyQueue(); //TODO still a stub function

        //print debug statements. will be removed later
        console.log("there is an excess of", excess);
        this.printOrderQueue();
        this.printFoodTray();
        this.printReadyQueue();
    }

    serve(index) {
        this._readyQueue.removeAtIndex(index);
    }

    //TODO discards
    //two cases for discards
    //discarding from order just means resetting its values to not done
    //discarding food tray items is completely removing them
    /*
    * @params
    * fromOrder: boolean
    *   true - came from order
    *   false - came from food tray
    * orderNumber: integer
    *   order of the discard item
    * index: integer
    *   index of item to be discarded in the order*/
    discard(fromOrder, itemIndex, orderIndex) {

        if(fromOrder) {
            console.log(itemIndex, orderIndex);
            let order = this._orderQueue.orders[orderIndex];
            let item = order.items._items[itemIndex];
            //check the food tray first before settings this
            let foodTrayItems = this._foodTray.items;
            for(let x = 0 ; x < foodTrayItems.length ; x++) {
                if(foodTrayItems[x]._id === item._id) {
                    item._isDone = foodTrayItems[x]._isDone;
                    item._time = foodTrayItems[x]._time;
                    foodTrayItems.splice(x, 1);
                    return
                }
            }

            item._isDone = false;
            item._time = 0;

        } else {
            this._foodTray.items.splice(itemIndex, 1);
        }
    }

    /*
    * Print statements for debugging purposes
    * */
    printOrderQueue() {

        let orders=this._orderQueue.orders;
        console.log("\n=============================================")
        console.log("ORDER QUEUE")
        console.log("=============================================")
        console.log("NUMBER OF ORDERS:", orders.length);
        for(let x = 0 ; x < orders.length ; x++) {
            orders[x].printOrder();
        }
    }

    printFoodTray() {
        console.log("\n=============================================");
        console.log("FOOD TRAY");
        console.log("=============================================");
        console.log("Number of foods:", this._foodTray.size);
        for(let x = 0 ; x < this._foodTray.size ; x++) {
            console.log(this._foodTray.foodAtIndex(x).toString());
        }
    }

    printReadyQueue() {
        let orders=this._readyQueue.orders;
        console.log("\n=============================================")
        console.log("READY QUEUE")
        console.log("=============================================")
        console.log("NUMBER OF ORDERS:", orders.length);
        for(let x = 0 ; x < orders.length ; x++) {
            orders[x].printOrder();
        }
    }

    /*
    * private functions
    * */

    //create order items based on clients orders
    //data structure for the item for order is
    // { id, name, done, time}
    /*
    * @params
    * items: Object
    *   Item structure coming from the client side
    *
    * @returns
    * ItemList
    *   list of items to be added in the order*/
    //TODO this probably needs some refactoring
    _createOrderItemsList(items) {

        let newItemList = new ItemList();

        //loop through order's items
        for(let x = 0 ; x < items.length ; x++) {
            let item = items[x];
            //check if item has property name and quantity
            //and that quantity is an integer
            if(typeof(item.name) !== 'undefined' && typeof(item.quantity) === 'number' &&
                item.quantity === parseInt(item.quantity, 10)) {
                //iterate through items and add them individually
                for(let count = 0 ; count < item.quantity ; count++) {
                    //check the foodtray
                    let index = -1;
                    if((index = this._foodTray.indexOf(item)) !== -1) {
                        //if food is found in tray, remove it in tray and add it as done
                        //in this order
                        let item = this._foodTray.removeAtIndex(index);
                        //the real item is at index zero since splice returns an array
                        newItemList.addItem(item[0]);
                    } else {
                        //else make a new item and add it to order
                        let newItem = new Item(item.id, item.name, false, 0);
                        newItemList.addItem(newItem);

                    }
                }
            }
        }

        return newItemList;
    }

    //prep the items in the list
    //set it to done when done prepping
    /*
    * @params
    * items: Item[]
    *   List of items to be prepped
    * quantity: Integer
    *   Number of items to be prepped
    * time: Integer
    *   Cooked time*/
    _prep(items, quantity, time) {

        for(let x = 0, count = 0 ; x < items.length && count < quantity ; x++, count++) {
            items[x].done();
            items[x].time = time;
        }
    }

    //create new foods based on item and quantity
    //and puts them in the food tray
    _putToFoodTray(item, quantity, time) {

        let foodItem = new Item(item.id, item.name, true, 0);
        for(let x = 0 ; x < quantity ; x++) {
            let newItem = Object.assign(new Item(), foodItem);
            //set it to done
            newItem.done();
            //and set the time
            newItem.time = time;
            //also set the time
            this._foodTray.add(newItem);
        }
    }

    //get all the possible items that can be cooked
    _getPossibleItems(itemId) {
        let result = [];
        //iterate through the order queue
        for(let x = 0, orders = this._orderQueue.orders; x < orders.length ; x++) {
            //only get the items that are not done yet
            //concatenate the results
            result = result.concat(orders[x].getItemsByIdNotDone(itemId));
        }
        return result;
    }

    _updateReadyQueue() {

        let orderQueue = this._orderQueue;
        let readyQueue = this._readyQueue;
        let orders = this._orderQueue.orders;

        console.log("updating the ready queue");

        for(let x = 0 ; x < orders.length ; x++) {
            //console.log("checking " + orders[x]._orderNumber , x);
            if(orders[x].isDone()) {
                console.log("found done");
                console.log(orders.length);
                //remove the order in order queue
                let order = orderQueue.removeAtIndex(x);
                x--; //cancel incrementing
                //then queue it in ready queue
                readyQueue.addOrder(order);
            }
        }
    }


}

module.exports = Kitchen;