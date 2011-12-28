var rappad = {};
rappad.utils = rappad.utils || {};






rappad.Messenger = function(drawer) {
    this._drawer = drawer;
}
rappad.Messenger.prototype.handleMessageIn = function(msg) {
    var p = new rappad.Line(this._drawer, {});
    p.setPath(msg);
    this._drawer.setLineToNamespace(p, 'foreign');
    return;
}

rappad.Messenger.prototype.handleMessageOut = function() {
    return;
}

rappad.utils.getCoordsFromMouseEvent = function(event) {
    var x = event.offsetX ? event.offsetX : event.clientX;
    var y = event.offsetY ? event.offsetY : event.clientY;
    return [x, y];
}

rappad.Line = function(drawer, opts) {
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

rappad.Line.prototype.updatePath = function(x, y) {
    var arr = this.path.attrs.path;
    if (typeof(arr) == 'string') {
        arr = Raphael.parsePathString(arr);
        if (arr == null) arr = [];
    }
    arr.push(["L", x, y]);
    this.path.attr({path: arr});
    return;
}

rappad.Line.prototype.setPath = function(pathStr) {
    this.path.attr({path: pathStr});
    return;
}

rappad.Line.prototype.getPath = function() {
    return this.path.attrs.path;
}

rappad.Drawer = function(divId, width, height, opts) {
    this.paper = Raphael(divId, width, height);
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
        return;
    }

    // after the mousedown happens
    this.newLine = function(x, y) {
        this.activeLine = new rappad.Line(this, {x: x, y: y});
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
        co = rappad.utils.getCoordsFromMouseEvent(e);
        pad.newLine(co[0], co[1]);
    });

    // when a mousemove happens
    this.rect.mousemove(function (e) {
        if (pad.mouseIsDown) {
            co = rappad.utils.getCoordsFromMouseEvent(e);
            pad.activeLine.updatePath(co[0], co[1]);
          }
    });

    // attach mouseup handlers to end line draw
    this.rect.mouseup(function () {
        if (pad.mouseIsDown) {
            pad.tearDown();
        }
    });

}

$(document).ready(function () {
    drawer = new rappad.Drawer('canvas', 800, 800);
    messagehandler = new rappad.Messenger(drawer);
    //messagehandler.handleMessageIn("M399,49L401,49L405,55L410,70L416,96L419,124L419,138L419,148L415,153L408,153L404,152")
});