var path  = require('path');
var fs    = require('fs');
var sem   = require('semver');
var utils = require('./utils');
var attrs = require('./attrs');
require('colors');

module.exports = function(basePath, callback) {

  if(!basePath)
    basePath = path.join(__dirname, '..', 'data');
  if(!callback)
    callback = function(){};

  var gametypes = {"storyhop": "storyhop"};

  fs.readdir(basePath, function(err, files) {

    // if(err) {
    //    return callback( '!! Unable to load game definitions\n'.red +
    //           '   Install gameplay definitions in data/ subdirectory\n'.red +
    //           ('   Was: ' + err).red, null);
    // }

    // var ok = false;

    // files.forEach(function(filePath) {
    //   if(fs.statSync(path.join(basePath, filePath)).isDirectory()) {
    // 
    //     var modulePath = path.join(basePath, filePath, 'definition.js');
    //     if(!fs.existsSync(modulePath))
    //       return;
    // 
    //     var plugin;
    //     if((plugin = checkFile(modulePath))) {
    //       ok = true;
    //       gametypes[filePath] = plugin;
    // 
    //       // Has public files ?
    //       var publicPath = path.join(basePath, filePath, 'public');
    //       if(fs.existsSync(publicPath)) {
    //         __app.use('/' + filePath, __app.express.static(publicPath));
    //       }
    //     }
    //   }
    // });

    // if(!ok) {
    //   return callback('!! No gameplay definition was correct. Aborting.'.red, null);
    // }

    callback(null, gametypes);

  });
};
//
//checking the file for errors 
//the path is returned if succesfull, null if it is not
//
var checkFile = function(path) {

  var errorLog = [];

  try {
    var plugin = require(path);
    var instance = new plugin();

    checkMissingAttributes(instance, errorLog);
    checkWrongAttributes(instance, errorLog);

    if(errorLog.length === 1) {
      throw new Error('One semantic failure');
    } else if(errorLog.length > 1) {
      throw new Error(errorLog.length + ' semantic failures');
    }

    // Everything is ok!
    return plugin;
  } catch(e) {
    console.error(('~~ Cannot load "' + path + '"\n   ' + e).yellow);
    errorLog.forEach(function(a) {
      console.error(('   - ' + a).gray.italic);
    });
    return null;
  }
};
//
//Making sure all of the attributes are present
//
var checkMissingAttributes = function(instance, errorLog) {

  for(var attr in attrs) {
    if(!attrs[attr].m) {
      continue;
    }

    if(!instance[attr]) {
      errorLog.push('Missing "' + attr + '" mandatory attribute (' + attrs[attr].t + ')');
    }
  }

};
//
//fucntion to see what type fn is and rerurning that
//
var checkType = function(e, t) {

  var fn;
  switch(t) {
    case 'String':   fn = utils.isString; break;
    case 'Function': fn = utils.isFunction; break;
    case 'Integer':  fn = utils.isInteger; break;
    case 'Array':    fn = utils.isArray; break;
    case 'Object':   fn = utils.isObject; break;
  }
  return fn(e);

};

//
//if there is an invlaid type in attrs an error is pushed to the 
//error logue
//

var checkWrongAttributes = function(instance, errorLog) {

  for(var attr in attrs) {
    if(instance[attr] && !checkType(instance[attr], attrs[attr].t)) {
      errorLog.push('"' + attr + '" must be of type (' + attrs[attr].t + ')');
    }
  }


  if(instance.opVersion && !sem.satisfies(__version, instance.opVersion)) {
    errorLog.push('This module is not ready for this version of StoryHop (' + __version + ' does not satisfy ' + instance.opVersion + ')');
  }
};

