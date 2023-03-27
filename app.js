//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const _ = require("lodash");

mongoose.set('strictQuery', false);


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// Start DataBase
 
main().catch((err) => console.log(err));
 
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  

// Setting up MongoDB item schema
const itemsSchema = new Schema({
  name:  String
});

const Item = mongoose.model("Item", itemsSchema);

// Creating default items for the DB
const item1 = new Item({
  name: "Welcome to your todo list!"
});
const item2 = new Item({
  name: "Hit the + button to add a new items"
});
const item3 = new Item({
  name: "<--- Hit this to delete an item"
});

const listSchema = new Schema({
  name:  String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

 // Adding items into an array
const defaultItems = [item1, item2, item3];

  // Render the home page
  app.get("/", function (req, res) {
 
    Item.find({})
      .then(foundItem => {
        if (foundItem.length === 0) {
          return Item.insertMany(defaultItems);
        } else {
          return foundItem;
        }
      })
      .then(savedItem => {
        res.render("list", {
          listTitle: "Today",
          newListItems: savedItem
        });
      })
      .catch(err => console.log(err));
  });

  app.get('/favicon.ico', function(req, res) {
    res.status(204);
    res.end();
});

//   app.get("/:customListName", async function(req, res) {
//     const customListName = _.capitalize(req.params.customListName);
 
//     await List.findOne({ name: customListName })
//       .then(async function (foundList) {
//         if (!foundList) {
//           //create new list
//           const list = new List({
//             name: customListName,
//             items: defaultItems,
//           });
   
//           await list.save();
//           res.redirect("/" + customListName);
//         } else {
//           //show an existing list
//           res.render("list", {
//             listTitle: foundList.name,
//             newListItems: foundList.items,
//           });
//         }
//       })
//       .catch(function (err) {
//         console.log(err);
//       });
// });
    

app.post("/", function(req, res){
 
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName ==="Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(foundList => {
        foundList.items.push(item);
        foundList.save();
      }
    )
    .then(
      res.redirect("/" + listName)
    )};
});

// Define a route for handling POST requests to the "/delete" URL.
// The request body contains the ID of the item to be deleted from a list.
app.post("/delete", function(req,res){
 
  // Extract the ID of the item to be deleted from the request body.
  const checkedItemId= req.body.checkbox;
 
  // Extract the name of the list where the item to be deleted belongs from the request body.
  const listName = req.body.list;
 
  // Print the name of the list to the console for debugging purposes.
  console.log("the list name is: " + listName);
 
  // If the list name is "Today", remove the item from the database and redirect to the home page.
  // Otherwise, find the corresponding list in the database and remove the item from it.
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(() =>{
      console.log("We have removed the item with id: " + checkedItemId);
      res.redirect("/");
    })
    .catch(err => {
      console.log(err);
    });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          foundList.items.pull({ _id: checkedItemId });
          return foundList.save();
        }
      })
      .then(() => {
        console.log("We have removed the item with id: " + checkedItemId + " from " + listName + " list");
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// Route for handling requests to a custom list page
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
 
  // Check if a list with the given name exists in the database
  List.findOne({name: customListName})
    .then(foundList => {
      if (!foundList) {
        // If the list doesn't exist, create a new one with default items and save it to the database
        console.log(customListName + " not found, creating new list...");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save()
          .then(() => {
            console.log("New list created and saved to the database.");
            res.redirect("/" + customListName); // Redirect the user to the new list's page
          })
          .catch(err => {
            console.log("Error saving new list to the database:", err);
          });
      } else {
        // If the list exists, render its items to the list view
        console.log("List already exists.");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch(err => {
      console.log("Error finding list:", err);
    });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

}