/**
 * Created by Brett Dixon on 2017-05-15.
 */
const itemClass = require("./item");

var item = new itemClass(1, "Elephont Burger", false, 0);

beforeAll(() => {
    return item;
});

afterAll(() => {
    item = null;
    return item;
});

test("Has an id number", () => {
   expect(item.id).toBe(1);
});

test("Has a name", () => {
   expect(item.name).toBe("Elephont Burger");
});

test("Is completed", () => {
    item.done();
    expect(item.isDone).toBeTruthy;
});

test("Has a string with updated time.", ()=>{
    const currentTime = new Date().getTime();
    item.time = currentTime;
    expect(item.toString()).toBe("1 Elephont Burger true "+currentTime);
});

test("Item is expired", () => {
    var pastTime = new Date().getTime() - 130000; //made more than a 120 seconds ago.
    item.time = pastTime;
    expect(item.isExpired()).toBeTruthy;
});