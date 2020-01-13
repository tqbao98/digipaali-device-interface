'use strict';
module.exports = function(app) {
    var controller = require('./index');

  // todoList Routes
  app.routes('/tasks')
    .get(controller.current_context);
};