
var path = require('path');
var startpoint = require('startpoint');
var interpreted = require('interpreted');
var article = require('../lib/article.js');

interpreted({
    source: path.resolve(__dirname, 'sources'),
    expected: path.resolve(__dirname, 'expected'),
  
    update: true,

    test: function(name, content, callback) {
        startpoint(content)
          .pipe(article('http://runner.test/', callback));
    }
});
