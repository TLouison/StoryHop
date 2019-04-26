var utils  = require('./utils');
//var rooms  = require('./rooms');
var crypto = require('./crypto');
var git    = require('git-repo-info');
var swearjar = require('swearjar');
swearjar.loadBadWords('./custom_profanity.json');
// Enabling 'kid mode' aka no profanity
var kidmode = __km;
/*  List of usernames to assign if given
    username is profane and kidmode is on */
var vegetables = ['Artichoke', 'Asparagus', 'Broccoli', 'Beet', 'Cabbage', 'Carrot', 'Cauliflower', 'Celery', 'Kale', 'Leek', 'Lettuce', 'Okra', 'Onion', 'Pepper', 'Potato', 'Pumpkin', 'Radish', 'Shallot', 'Squash', 'Spinach', 'Tomato', 'Turnip', 'Zucchini'];

// we want to define this only one time
var repo = git('.git');
if(repo.branch) {
  repo.url = require('../package.json').repository.url.replace(/\.git$/, '') + '/commit/' + repo.sha;
}

module.exports = function(app) {

  /**
   * ROOT
   */
  app.get('/', function(req, res) {
    req.session.locale = req.getLocale();
    res.render('index', {passwordRequired: __conf.password !== null });
  });

  /***
   * ABOUT
   */
  app.get('/about', function(req, res) {
    res.render('about', {repo: repo, version: __version, locales: __conf.locales, gamemodes:  __staticGametypes });
  });

  /**
   * IO : Connect
   */
  app.io.on('connection', function(socket) {
    socket.challenge = crypto.generateChallenge();
    socket.emit('challenge', socket.challenge);

    // Check for reconnection
    if(socket.session.identifier && socket.session.username) {
      socket.emit('reconnectInvitation', socket.session.username);
    } else if(!socket.session.identifier) {
      socket.session.identifier = utils.randomString(20);
      socket.session.save();
    }
  });

  /**
   * IO : Ping
   */
  app.io.route('o-ping', function(socket) {
    socket.emit('o-pong');
  });



  /**
   * IO : Login
   */
  app.io.route('login', function(socket, data) {
    var locale = socket.session.locale || __conf.defaultLocale;
    var nbLogged = 0;
    for(var s in app.io.sockets.sockets) {
      if(app.io.sockets.sockets[s].username) nbLogged++;
    }

    if(__conf.maxPlayers && nbLogged >= __conf.maxPlayers) {
      return socket.emit('loginResult', {err: __i18n({phrase: 'This server is full, sorry. Please try again later!', locale: locale})});
    }

    if(data.password !== __conf.password && __conf.password !== null || !data.username) {
      return socket.emit('loginResult', {err: __i18n({phrase: 'Bad Credentials', locale: locale})});
    }

    // Check username
    var username;
    try {
      username = utils.checkUsername(data.username);
    } catch(e) {
      return socket.emit('loginResult', {err: __i18n({phrase: e.message, locale: locale})});
    }

    // Filtering profane usernames on kidmode
    if (kidmode){
      if(swearjar.profane(username)){
        var rand_ind = Math.floor(Math.random() * vegetables.length);
        username = vegetables[rand_ind];
      }
    }

    socket.join('lobby');
    socket.username = username;
    socket.emit('loginResult', {err: null, username: username, gametypes: __staticGametypes});

    // Check session
    socket.session.username = username;
    socket.session.save();

  });

  /**
   * IO : Logout (ask for session reset)
   */
  app.io.route('logout', function(socket) {
    socket.session.identifier = undefined;
    socket.session.username = undefined;
    socket.session.save();
    socket.emit('reconnect');
  });



  /**
   * IO : Chat Management
   */
  app.io.route('sendMessage', function(socket, data) {
    //var room = utils.isInGame(socket);
    var message = utils.sanitizeHtml(data.message);
    if(!message)
      return;

    if(socket.username) {
      socket.emit('messageSent');
      var actual_message = message;
      // Blocking profane messages on kidmode
      if (kidmode){
        actual_message = swearjar.censor(message);
      }
      app.io.to('lobby').emit('chatMessage', {message: actual_message, sender: socket.username, lobby: true});
    }
  });


  app.io.route('sendMessageWord', function(socket, data) {
    //var room = utils.isInGame(socket);
    var message = utils.sanitizeHtml(data.message);
    if(!message)
      return;

    if(socket.username) {
      socket.emit('messageSentWord');
      var actual_message = message;
      // Blocking profane messages on kidmode
      if (kidmode){
        actual_message = swearjar.censor(message);
      }
      app.io.to('lobby').emit('chatMessageWord', {message: actual_message, sender: socket.username, lobby: true});
    }
  });


};
