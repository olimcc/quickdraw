var quickdraw = {};
quickdraw.utils = quickdraw.utils || {};

quickdraw.Messenger = function(drawer, pid) {
    this._drawer = drawer;
    this._pid = pid;
}
quickdraw.Messenger.prototype.handleMessageIn = function(msg) {
    var p = new quickdraw.Line(this._drawer, {});
    p.setPath(msg.path);
    this._drawer.setLineToNamespace(p, 'foreign');
    return;
}

quickdraw.Messenger.prototype.handleMessageOut = function(client, method, path) {
    $.ajax({
        dataType: 'text',
        type: "POST",
        data: {'method': method, 'path': path, 'client': client},
        url: "/p/" + this._pid,
        error: function (e) {
          console.log(e);
        },
        success: function (r) {
          console.log(r);
        }
    });
}

quickdraw.utils.getDivPosition = function(divId) {
    var d = document.getElementById(divId);
    return {x: d.offsetLeft, y: d.offsetTop};
}

quickdraw.utils.getCoordsFromMouseEvent = function(event, divId) {
    var pos = quickdraw.utils.getDivPosition(divId);
    var x = event.offsetX ? event.offsetX : event.clientX - pos.x;
    var y = event.offsetY ? event.offsetY : event.clientY - pos.y;
    return [x, y];
}

quickdraw.Line = function(drawer, opts) {
    this.id = opts.id || null;
    if (opts.x && opts.y) {
        this.path = drawer.paper.path([["M", opts.x, opts.y]]);
    } else {
        this.path = drawer.paper.path();
    }
    this.path.mouseup(function () {
        drawer.tearDown();
    });
}

quickdraw.Line.prototype.updatePath = function(x, y) {
    var arr = this.path.attrs.path;
    if (typeof(arr) == 'string') {
        arr = Raphael.parsePathString(arr);
        if (arr == null) arr = [];
    }
    arr.push(["L", x, y]);
    this.path.attr({path: arr});
    return;
}

quickdraw.Line.prototype.setPath = function(pathStr) {
    this.path.attr({path: pathStr});
    return;
}

quickdraw.Line.prototype.getPath = function() {
    return this.path.attrs.path;
}

quickdraw.Drawer = function(divId, width, height, opts) {
    this.divId = divId;
    this.paper = Raphael(divId, width, height);
    this.opts = opts || {};
    this.drawCallback = this.opts.drawCallback;
    this.mouseIsDown = false;
    this.activeLine = null;
    this.rect = this.paper.rect(0, 0, this.paper.width, this.paper.height);
    this.rect.attr({
        'fill': 'white',
        'stroke': 'white',
        'fill-opacity': 0,
        'stroke-opacity': 0});
    this.lines = {};
    var pad = this;

    // after the mouseup happens

    this.tearDown = function() {
        this.mouseIsDown = false;
        this.setLineToNamespace(this.activeLine);
        if (this.drawCallback) {
            this.drawCallback(this.activeLine);
        }
        return;
    }

    // after the mousedown happens
    this.newLine = function(x, y) {
        this.activeLine = new quickdraw.Line(this, {x: x, y: y});
    }

    this.setLineToNamespace = function(line, ns) {
        var ns = ns || 'local';
        if (!this.lines[ns]) this.lines[ns] = [];
        this.lines[ns].push(line);
    }

    // attach handlers for rect
    // when a mouse down happens
    this.rect.mousedown(function (e) {
        pad.mouseIsDown = true;
        co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
        pad.newLine(co[0], co[1]);
    });

    // when a mousemove happens
    this.rect.mousemove(function (e) {
        if (pad.mouseIsDown) {
            co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
            pad.activeLine.updatePath(co[0], co[1]);
          }
    });

    // attach mouseup handlers to end line draw
    this.rect.mouseup(function () {
        if (pad.mouseIsDown) {
            pad.tearDown();
        }
    });

    // attach handlers for rect
    // when a mouse down happens
    this.rect.touchstart(function (e) {
        pad.mouseIsDown = true;
        e = e.changedTouches[0];
        co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
        pad.newLine(co[0], co[1]);
    });

    // when a mousemove happens
    this.rect.touchmove(function (e) {
        if (pad.mouseIsDown) {
            e = e.changedTouches[0];
            co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
            pad.activeLine.updatePath(co[0], co[1]);
          }
    });

    // attach mouseup handlers to end line draw
    this.rect.touchend(function () {
        e = e.changedTouches[0];
        if (pad.mouseIsDown) {
            pad.tearDown();
        }
    });

}