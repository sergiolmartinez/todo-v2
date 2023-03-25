//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;

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

  app.get("/:customListName", function(req, res) {
    const customListName = req.params.customListName;

    List.findOne({name: customListName})
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        return list.save();
      } else {
        return foundList;
      }
    })
    .then(foundList => {
      // show an existing list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    })
    .catch(err => console.log(err));
});
    

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

app.post("/delete", function (req,res) {
  const checkedItemId = req.body.checkbox;
  Item.findByIdAndRemove(checkedItemId).then(function(err) {
    if(!err) {
      console.log("Successfully deleted checked item.")
    }
  }).then(function(err) {
    if(!err) {
      res.redirect("/");
    }
  })
    .catch(err => console.log(err))
})



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

}