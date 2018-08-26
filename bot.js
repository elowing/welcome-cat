if (process.env.NODE_ENV !== 'production') {
  var env = require('node-env-file');
  env(__dirname + '/.env');
}

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  usage_tip();
  // process.exit(1);
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

var bot_options = {
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  // debug: true,
  scopes: ['bot'],
  apiRoot: process.env.apiRoot
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
  var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.MONGO_URI});
  bot_options.storage = mongoStorage;
} else {
  bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);
controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);

if (!process.env.clientId || !process.env.clientSecret) {
  webserver.get('/', function(req, res){
    res.render('installation', {
      studio_enabled: false,
      domain: req.get('host'),
      protocol: req.protocol,
      layout: 'layouts/default'
    });
  })
} else {
  webserver.get('/', function(req, res){
    res.render('index', {
      domain: req.get('host'),
      protocol: req.protocol,
      layout: 'layouts/default'
    });
  })
  // Set up a simple storage backend for keeping a record of customers
  // who sign up for the app via the oauth
  require(__dirname + '/components/user_registration.js')(controller);

  // Send an onboarding message when a new team joins
  require(__dirname + '/components/onboarding.js')(controller);

  var normalizedPath = require("path").join(__dirname, "skills");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./skills/" + file)(controller);
  });
}

controller.on('direct_message', function(bot, event) { // sub 'team_join' for 'direct_message' when ready
  var user = event.event.user;

  bot.startPrivateConversation({user: user}, function(err, convo) {
    var topics=[]; //['team_duties', 'quip', 'gcal', 'ggroups', 'social_media', 'kit', 'racing', 'sponsors'];
    topics.forEach(function(topic) {
      controller.trigger(topic, [bot, event]);
    });
  });
});

controller.on('team_duties', function(bot, event) {
  convo.say();
});

controller.on('quip', function(bot, event) {
  convo.say();
});

function defineTrigger(topic) {
};

function getTopics() {
  ['team_duties', 'quip', 'gcal', 'ggroups', 'social_media', 'kit', 'racing', 'sponsors'];
};
//{ event:
//    { type: 'message',
//      user: 'UC46Q5XSQ',
//      text: 'sup cat',
//      client_msg_id: 'd12dc837-462b-4112-9d32-fe223c440457',
//      ts: '1533921769.000091',
//      channel: 'DC5U0G28M',
//      event_ts: '1533921769.000091',
//      channel_type: 'im' },
//  type: 'direct_message',
//  raw_message:
//    { token: 'vsdMsg9R3ervlKQrb5DIUj0r',
//      team_id: 'T7JT9055Y',
//      api_app_id: 'AC5G0D2MS',
//      event:
//        { type: 'message',
//          user: 'UC46Q5XSQ',
//          text: 'sup cat',
//          client_msg_id: 'd12dc837-462b-4112-9d32-fe223c440457',
//          ts: '1533921769.000091',
//          channel: 'DC5U0G28M',
//          event_ts: '1533921769.000091',
//          channel_type: 'im' },
//      type: 'event_callback',
//      event_id: 'EvC7KNQZHD',
//      event_time: 1533921769,
//      authed_users: [ 'UC57KTFQ9' ] },
//  text: 'sup cat',
//  channel: 'DC5U0G28M',
//  channel_type: 'im' }
