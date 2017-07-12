var Sequelize = require('sequelize');
var Umzug = require('umzug');

module.exports = function migrations(app, context) {  
  var sequelize = app.get('sequelize');
  var umzug = new Umzug({storage: 'sequelize', 
    storageOptions: {sequelize: sequelize},
    migrations: {params: [sequelize.getQueryInterface(), Sequelize]}});
  return umzug.execute({
    migrations: ['20170712173958-create_todo_table'],
    method: 'up'
  }).then(function (migrations) {
    // "migrations" will be an Array of all executed/reverted migrations.
    console.log(migrations);
    app.get('sequelize').sync()
    .then(function _then() {
      console.log('synced');
      const Todo = app.get('models')['Todo'];
      Todo.all().then(function(todos) {
        console.log('todos');
        console.log(JSON.stringify(todos))
        context.succeed('Done with migrations');
      });
    })
    .catch(function _catch(err) {
      console.log(err);
      context.fail(err);
    });
  });
}