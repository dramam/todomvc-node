var feathers = require('feathers');
var rest = require('feathers-rest');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var service = require('feathers-sequelize');
const hooks = require('feathers-hooks');
const errors = require('feathers-errors');

var serverReady = false;

const dbconfig = {
  dbname: '',
  username: '',
  password: '',
  host: '',
  port: '3306',
  dialect: 'mysql' 
};
const sequelize = new Sequelize(
  dbconfig.dbname, dbconfig.username, dbconfig.password, {
  host: dbconfig.host,
  port: dbconfig.port,
  dialect: dbconfig.dialect
});

// Todo Model
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

function init() {
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
}

exports.handler = function _f(event, context) {
  var reqopts = {
    method: event.method,
    uri: 'http://127.0.0.1:3000' + event.resource,
    body: event.body,
    json: true
  };
  reqopts.uri = reqopts.uri.replace('{id}', event.id);
  var sendReq = function _sendReq() {
    rp(reqopts)
    .then(function _then(body) {
      context.succeed({body: body, Auth: event.Auth});
    })
    .catch(function _catch(err) {
      context.fail(err);
    });
  };
  if (!serverReady) {
    init();
    Todo.sync()
    .then(function _then() {
      // Create an sqlite backed Feathers service
      app.use('/todos', service({
        Model: Todo
      }));
      // Add error hook
      const todos = app.service('/todos');
      // Log error on all methods
      todos.hooks({
        error(hook) {
          console.error('Todo service error', hook.error);
        }
      });
      app.listen(3000, function() {
        console.log(`Feathers server listening on port 3000`);
        serverReady = true;
        if (event.resource) {
          sendReq();
        }
      });
    });
  } else {
    if (event.resource) {
      sendReq();
    } else {
      context.succeed('Done with init');
    }
  }
};
