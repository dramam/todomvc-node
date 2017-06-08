var feathers = require('feathers');
var rest = require('feathers-rest');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var service = require('feathers-sequelize');
var hooks = require('feathers-hooks');
var errors = require('feathers-errors');
var config = require('config');
var AWS = require('aws-sdk');

var serverReady = false;

// Todo Model
var Todo = {};
var app = {};
var dbconfig = {};

var getConfig = function() {
  console.log('getConfig');
  var s3 = new AWS.S3();
  return new Promise(function(resolve,reject) {
    console.log('s3.getobject');
    console.log(config);
    s3.getObject({Bucket: config.bucket , Key: config.key},
      function(err, data) {
        if (err) {
          console.log(err);
          reject(err);
        }
        dbconfig = JSON.parse(data.Body).db;
        console.log(dbconfig);
        resolve(dbconfig);
      }
    );
  });
}

var init = function() {
  console.log('init');
  // Create a feathers instance.
  app = feathers()
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
  try {
    var sequelize = new Sequelize(
      dbconfig.dbname, dbconfig.username, dbconfig.password, {
      host: dbconfig.host,
      port: dbconfig.port,
      dialect: dbconfig.dialect
    });
    console.log('Todo');
    Todo = sequelize.define('todo', {
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
    console.log('done init');
  } catch (err) {
    console.log(err);
  }
}

exports.handler = function _f(event, context) {
  var reqopts = {
    method: event.method,
    uri: 'http://127.0.0.1:3000' + event.resource,
    body: event.body,
    json: true
  };
  reqopts.uri = reqopts.uri.replace('{id}', event.id);
  console.log(reqopts);
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
    console.log('serverReady');
    try {
      getConfig().then(function(data) {
        console.log('after getConfig');
        init();
        console.log('after init');
        Todo.sync()
        .then(function _then() {
          console.log('hooks');
          // Create an sqlite backed Feathers service
          app.use('/todos', service({
            Model: Todo
          }));
          // Add error hook
          var todos = app.service('/todos');
          // Log error on all methods
          todos.hooks({
            error(hook) {
              console.error('Todo service error', hook.error);
            }
          });
          console.log('listen');
          app.listen(3000, function() {
            console.log(`Feathers server listening on port 3000`);
            serverReady = true;
            if (event.resource) {
              sendReq();
            }
          });
        });
      })
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log('true');
    if (event.resource) {
      sendReq();
    } else {
      context.succeed('Done with init');
    }
  }
};
