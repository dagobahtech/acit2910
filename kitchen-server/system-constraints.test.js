/**
 * Created by Brett Dixon on 2017-05-22.
 */
const SysConstraints = require('./system-constraints');

var newConstraints = new SysConstraints();
var initialValues = {
    comboDiscount : newConstraints.comboDiscount,
    cookTime : newConstraints.cookTime,
    maxOrders : newConstraints.maxOrders,
    maxPerItem : newConstraints.maxPerItem,
    maxItemPerOrder : newConstraints.maxItemPerOrder,
    discardTime : newConstraints.discardTime
};

beforeAll(() => {
    return newConstraints;
});

test("Can set max items per order", () => {
    newConstraints.maxItemPerOrder = 5;
    newConstraints.writeToFile();
    expect(newConstraints.maxItemPerOrder).toEqual(5);
});

test("Can set discount", () => {
    newConstraints.comboDiscount = 0.01;
    newConstraints.writeToFile();
    expect(newConstraints.comboDiscount).toEqual(0.01);
});

test("Can set cook time", () => {
    newConstraints.cookTime = 6000;
    newConstraints.writeToFile();
    expect(newConstraints.cookTime).toEqual(6000);
});

test("Can set max orders", () => {
    newConstraints.maxOrders = 11;
    newConstraints.writeToFile();
    expect(newConstraints.maxOrders).toEqual(11);
});

test("Can set max quantity per item", () => {
    newConstraints.maxPerItem = 7;
    newConstraints.writeToFile();
    expect(newConstraints.maxPerItem).toEqual(7);
});

test("Can set discard time", () => {
    newConstraints.discardTime = 3000;
    newConstraints.writeToFile();
    expect(newConstraints.discardTime).toEqual(3000);
});

afterAll(() => {
    newConstraints.comboDiscount = initialValues.comboDiscount;
    newConstraints.cookTime = initialValues.cookTime;
    newConstraints.maxOrders = initialValues.maxOrders;
    newConstraints.maxPerItem = initialValues.maxPerItem;
    newConstraints.maxItemPerOrder = initialValues.maxItemPerOrder;
    newConstraints.discardTime = initialValues.discardTime;
    console.log(newConstraints.comboDiscount);
    console.log(newConstraints.cookTime);
    console.log(newConstraints.maxOrders);
    console.log(newConstraints.maxPerItem);
    console.log(newConstraints.maxItemPerOrder);
    console.log(newConstraints.discardTime);
    return newConstraints;
});