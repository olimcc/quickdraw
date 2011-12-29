/*Pad drawer*/

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
app.use(express.cookieParser());

/* Generate a random id */
var generateId = function() {
  var chars = 'abcdefghijklmnopqrstuvwxyz'+
              'ABCDEFGHIJKLMNOPQRSTUVWXYZ'+
              '0123456789';
  for (var id='', i=0; i<10; i++) {
      var index = Math.floor(Math.random() * chars.length)
      id += chars[index];
  }
  return id;
};

/* A pad object */
var Pad = function(id) {
  this.id = id;
  this.clients = {};
  this.lastActive = new Date().getTime();
  this.paths = [];
}

Pad.prototype.sendToOthers = function(cid, method, path) {
  for (var id in this.clients) {
    if (id != cid) {
      this.clients[id].send(JSON.stringify({'method':method, 'path':path}));
    }
  }
}

Pad.prototype.isActive = function(timeout) {
   var now = new Date().getTime();
   if ((now-this.lastActive) > timeout) {
     return false;
   }
   return true;
};

/* All current pads */
var pads = {};

// Handlers

app.get("/:id?", function(req, res) {
  var pid = req.params.id;
  if (!pid) return res.redirect('/p/' + generateId());
  return res.redirect('/p/' + pid);
});

app.get("/p/:id?", function(req, res) {
  var pid = req.params.id;
  if (!pid) return res.redirect('/p/' + generateId());

  if (!pads[pid]) pads[String(pid)] = new Pad(req.params.id);
  return res.render('index.ejs', {pid: pid});
});

app.post("/p/:id?", function(req, res) {
  var method = req.param('method', null),
      path = req.param('path', null),
      pid = req.params.id,
      cid = req.param('client', null);

  if (pid && method && path && cid) {
    var pad = pads[pid];
    pad.sendToOthers(cid, method, path);
    pad.paths.push(path);
    pad.lastActive = new Date().getTime();
    return res.send(JSON.stringify({'success': true}));
  }
});

// Kick things off
app.listen(config.port);
util.log("Starting app on port "+config.port);

// Setting up socket
var io = io.listen(app);

io.sockets.on('connection', function (client) {
  var cid = generateId();
  var pid = null;

  client.on('registerPad', function (data) {
    var data = JSON.parse(data);
    pid = data.pid;
    pads[pid].clients[cid] = client;
    client.emit('generateCid', JSON.stringify({'cid': cid}));
    for (var i=0;i<pads[pid].paths.length; i ++) {
      client.send(JSON.stringify({'method':'update', 'path':pads[pid].paths[i]}));
    }
  });

  client.on('mobLog', function(data) {
    util.log('mobile -- ' + data);
  });

  client.on('disconnect', function() {
    if (pads[pid]) {
      delete pads[pid].clients[cid];
    }
  });

});

var testPadActivityInterval = setInterval(function() {
  util.log('testing pad activity');
  for (var pid in pads) {
    if (!pads[pid].isActive(config.padTimeoutTolerance)) {
      util.log(pid + ' is not active, removing.');
      delete pads[pid];
    }
  }
}, config.testPadActivityInterval);
