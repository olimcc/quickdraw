/*sample
*/

var util = require("util");
var express = require("express");
var io = require("socket.io");
var app = express.createServer();

// Configuration
var config = require("./config.js").configure();

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/static'));
app.set("view engine", "ejs");
app.set("view options", {layout: false});
app.use(express.bodyParser());

var Pad = function(id) {
  this.id = id;
  this.clients = {};
}

var pads = {}, clients = {};

app.get("/p/:id?", function(req, res) {
  var pid = req.params.id;
  if (!pid) return res.redirect('/p/' + generateId());

  if (!pads[pid]) pads[String(pid)] = new Pad(req.params.id);
  return res.render('index.ejs', {pid: pid});
});

app.post("/p/:id?", function(req, res) {
  var method = req.param('method', null),
      path = req.param('path', null),
      pid = req.params.id;

  if (pid && method && path) {
    var pad = pads[pid];
    console.log('*******')
    console.log(pid);
    for (var id in pad.clients) {
      console.log('--> ' + id);
    }
    console.log('applying: ' + method + ' -> ' + path)
  }

  return res.send(JSON.stringify({'success': true}));
});

// Starting HTTP server
app.listen(config.port, "localhost");
util.log("Starting app on port "+config.port);


var generateId = function() {
  var chars = 'abcdefghijklmnopqrstuvwxyz'+
              'ABCDEFGHIJKLMNOPQRSTUVWXYZ'+
              '0123456789-_';
  for (var id='', i=0; i<10; i++) {
      var index = Math.floor(Math.random() * chars.length)
      id += chars[index];
  }
  return id;
};

// Setting up Socket.IO
var io = io.listen(app);
io.sockets.on('connection', function (client) {
  clients[client.id] = client;

  client.on('registerPad', function (data) {
    var data = JSON.parse(data);
    pads[data.pid].clients[client.id] = client;
  });

  client.on('message', function (data) {
    var data = JSON.parse(data);
    console.log(data);
  });

});