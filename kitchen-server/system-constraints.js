/**
 * Created by Brett Dixon on 2017-05-22.
 */
'use-strict';
const file = './kitchen-server/sys-constraints.ini';

const fs = require('fs')
const ini = require('ini');

var properties = ini.parse(fs.readFileSync(file, 'utf-8'));

class SysConstraints {

    constructor() {
        this._comboDiscount = properties.main.comboDiscount;
        this._cookTime = properties.main.cookTime;
        this._maxOrders = properties.main.maxOrders;
        this._maxPerItem = properties.main.maxPerItem;
        this._maxItemPerOrder = properties.main.maxItemPerOrder;
        this._discardTime = properties.main.discardTime;
    }

    get maxItemPerOrder() {
        return this._maxItemPerOrder;
    }

    set maxItemPerOrder(value) {
        this._maxItemPerOrder = properties.main.maxItemPerOrder = value;
    }

    get comboDiscount() {
        return this._comboDiscount;
    }

    set comboDiscount(value) {
        this._comboDiscount = properties.main.comboDiscount = value;
    }

    get cookTime() {
        return this._cookTime;
    }

    set cookTime(value) {
        this._cookTime = properties.main.cookTime = value;
    }

    get maxOrders() {
        return this._maxOrders;
    }

    set maxOrders(value) {
        this._maxOrders = properties.main.maxOrders = value;
    }

    get maxPerItem() {
        return this._maxPerItem;
    }

    set maxPerItem(value) {
        this._maxPerItem = properties.main.maxPerItem = value;
    }

    get discardTime() {
        return this._discardTime;
    }

    set discardTime(value) {
        this._discardTime = properties.main.discardTime = value;
    }

    writeToFile() {
        fs.writeFileSync(file, ini.stringify(properties))
    }
}

module.exports = SysConstraints;