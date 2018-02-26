var Table = require('cli-table');
var mysql = require("mysql");
var inquirer = require("inquirer");

var table = new Table({
    head: ['item_id', 'product_name', 'department_name', 'price', 'stock_quantity'],
    colWidths: [10, 20, 20, 8, 20]
});

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "julong56",
  database: "bamazon"
});

// connect to the mysql server and sql database
connection.connect(function(err) {
  if (err) throw err;
  start();
});

function start() {
  // query the database for all items being auctioned
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    for (var i = 0; i < results.length; i++) {
      table.push(
        [results[i].item_id, results[i].product_name, results[i].department_name, 
        results[i].price, results[i].stock_quantity]
      );
    }
    console.log(table.toString());
    inquirer
      .prompt([
        {
          name: "itemId",
          type: "rawlist",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].item_id.toString());
            }
            return choiceArray;
          },
          message: "Type the item ID of the product you would like to buy\n"
        },
        {
          name: "units",
          type: "input",
          message: "How many units of the product would you like to buy?\n"
        }
      ])
      .then(function(answer) {
        var chosenItem = [];
        // console.log('answer.itemId : ', answer.itemId);
        // console.log('answer.units : ', answer.units);
        for (var i = 0; i < results.length; i++) {
          if (results[i].item_id == answer.itemId) {
            chosenItem = results[i];
          }
        }
        // console.log(chosenItem);

        // determine if we have enough product in stock
        if (chosenItem.stock_quantity >= parseInt(answer.units)) {
          // have enough items, so update db, let the user know and start over
          var newAmount = 0;
          newAmount = chosenItem.stock_quantity - answer.units;
          var totalCost = answer.units*chosenItem.price;
          // console.log(newAmount);
          connection.query(
            "UPDATE products SET ? WHERE ?",
            [
              {
                stock_quantity: newAmount
              },
              {
                item_id: chosenItem.item_id
              }
            ],
            function(error, res) {
              if (error) throw err;
              console.log("Order was placed successfully!");
              console.log("Total amount of $" + totalCost + " will be billed to your credit card.")
              // start();
            }
          );
        }
        else {
          // not enough items in stock, so apologize and start over
          console.log("Sorry, we don't have enough items to fullfill your order...");
          // start();
        }
      });

  });
  
}
// connection.end();