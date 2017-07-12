'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.createTable('Todo', 
      { 
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
      );
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.dropTable('Todo');
  }
};
