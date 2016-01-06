'use strict';

var colors = require('ansi-colors');
var async = require('async');
var Bot = require('../');

// make a barista plugin to teach bots how to make coffee
function barista(options) {
  return function(bot) {
    // let the bot know it knows how to handle `coffee-order` events
    bot.handler('coffee-order');

    // list of recipes the bot knows how to make
    bot.recipes = {
      latte: {
        ingredients: ['coffee', 'milk'],
        time: 500
      },
      mocha: {
        ingredients: ['chocolate', 'coffee', 'milk'],
        time: 1000
      }
    };

    // `makeCoffee` is async so customers don't have to wait on joe
    bot.define('makeCoffee', function(order, cb) {
      var recipe = this.recipes[order.type];
      var coffee = Object.create(recipe.ingredients);
      coffee.type = order.type;
      coffee.size = order.size;

      var time = recipe.time;
      if (coffee.size === 'grande') time *= 1.5;
      if (coffee.size === 'venti') time *= 2;

      setTimeout(function() {
        cb(null, coffee);
      }, time);
    });
  };
}

// make a coffee shop
var shop = {
  employees: {},
  clockIn: function(employee) {
    if (this.employees.hasOwnProperty(employee.name)) return;

    var handleCoffeeOrder = function(order, cb) {
      var name = this.name;
      console.log(colors.cyan('[' + name + ']'), 'starting coffee for', order.name);
      this.makeCoffee(order, function(err, coffee) {
        if (err) return cb(err);
        console.log(colors.cyan('[' + name + ']'), coffee.size, coffee.type, 'for', order.name, 'ready.');
        cb(null, coffee);
      });
    };

    this.employees[employee.name] = {employee: employee, handler: handleCoffeeOrder};

    // when employee clocks into work, they needs to be ready to handle coffee orders
    employee.onCoffeeOrder(handleCoffeeOrder);
  },

  clockOut: function(employee) {
    if (!this.employees.hasOwnProperty(employee.name)) return;
    employee.off('coffee-order', this.employees[employee.name].handler);
  },

  order: function(request, cb) {
    var self = this;
    // find a free employee
    var keys = Object.keys(this.employees);
    var name = keys.filter(function(key) {
      return self.employees[key].employee.working !== true;
    })[0];

    // if no free employees, try again after a delay
    if (!name) {
      setTimeout(function() {
        self.order(request, cb);
      }, 100);
      return;
    }
    var employee = this.employees[name].employee;

    // put the employee to work making coffee
    employee.working = true;
    employee.handleCoffeeOrder(request, function(err, coffee) {
      employee.working = false;
      if (err) return cb(err);
      cb(null, coffee);
    });
  }
}

function createEmployee(name) {
  var employee = new Bot();
  employee.name = name;

  // "train" employee on how to be a barista
  employee.use(barista());
  return employee;
}

// make some new barista bots and employ them at the shop
var joe = createEmployee('joe');
var bob = createEmployee('bob');

shop.clockIn(joe);
shop.clockIn(bob);

// order some coffees
async.parallel([
  async.apply(shop.order.bind(shop), {size: 'venti', type: 'mocha', name: 'brian'}),
  async.apply(shop.order.bind(shop), {size: 'grande', type: 'mocha', name: 'jon'}),
  async.apply(shop.order.bind(shop), {size: 'tall', type: 'mocha', name: 'emily'}),
  async.apply(shop.order.bind(shop), {size: 'venti', type: 'latte', name: 'mark'}),
  async.apply(shop.order.bind(shop), {size: 'grande', type: 'latte', name: 'rob'}),
  async.apply(shop.order.bind(shop), {size: 'tall', type: 'latte', name: 'chris'}),
], function(err) {
  if (err) console.error(err);
  console.log('finished');
  shop.clockOut(joe);
  shop.clockOut(bob);
  process.exit();
});
