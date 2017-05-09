var path = require('path');
var feathers = require('feathers');
var rest = require('feathers-rest');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var service = require('feathers-sequelize');
const hooks = require('feathers-hooks');
const errors = require('feathers-errors');

const sequelize = new Sequelize('sequelize', '', '', {
  dialect: 'sqlite',
  storage: path.join(__dirname, 'db.sqlite'),
  logging: console.log
});
const Todo = sequelize.define('todo', {
  text: {
    type: Sequelize.STRING,
    allowNull: false
  },
  completed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  freezeTableName: true
});

// Create a feathers instance.
const app = feathers()
  // Enable REST services
  .configure(rest())
  .configure(hooks())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({ extended: true }))
  .use(function _f(req, res, next) {
           res.header('Access-Control-Allow-Origin', '*');
           res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
           res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
           next();
         });

// Removes all database content
Todo.sync({ force: true });

// Create an sqlite backed Feathers service with a default page size of 2 items
// and a maximum size of 4
app.use('/todos', service({
  Model: Todo
}));

const todos = app.service('/todos');
// Log error on all methods
todos.hooks({
  error(hook) {
    console.error('Todo service error', hook.error);
  }
});

// Start the server
app.listen(3030);

console.log('Feathers Todo Sequelize service running on 127.0.0.1:3030');