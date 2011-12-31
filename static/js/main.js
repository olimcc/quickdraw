var quickdraw = {};
quickdraw.utils = quickdraw.utils || {};

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

/**
 * Handle incoming and outgoing messages to a pad
 * @param {quickpad.Drawer} drawer instance
 * @param {String} pid Pad Id
 */
quickdraw.Messenger = function(drawer, pid) {
    this._drawer = drawer;
    this._pid = pid;
}

/**
 * Handle an incoming message. Right now, only writes paths.
 * @param {String} msg Path string
 */
quickdraw.Messenger.prototype.handleMessageIn = function(msg) {
    var p = new quickdraw.Line(this._drawer, {});
    p.setPath(msg.path);
    this._drawer.setLineToNamespace(p, 'foreign');
    return;
}

/**
 * Handle an outgoing message. Triggers AJAX request.
 * @param {String} client id
 * @param {String} method ('update', 'delete')
 * @param {String} path to send
 */
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

/**
 * Wrapper around standard raphael path, proving extra functionality.
 *
 * If opts.x and opts.y exists, inits a path at that point, else, creates empty
 * path.
 * Attaches a mouseup event to the path drawing.
 *
 * @param {quickdraw.Drawer} drawer instance
 * @param {Object} opts dict
 */
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

/**
 * Append values to the path.
 * @param {Number} x coord
 * @param {Number} y coord
 */
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

/**
 * Completely update the path
 * @param {String} Complete path string
 */
quickdraw.Line.prototype.setPath = function(pathStr) {
    this.path.attr({path: pathStr});
    return;
}

/**
 * Get a String representation of the path.
 */
quickdraw.Line.prototype.getPath = function() {
    return this.path.attrs.path;
}

/**
 * Our main drawing pad.
 *
 * Handles rendering Raphael paper object for drawing, captures click/move events
 * on the area, triggers creation of quickdraw.Line objects on the pad.
 *
 * In order to capture mousedown events on the paper area, an invisible rectangle
 * is created matching the same dimensions as the paper (see this.rect).
 * Mouse/Touch events are captured here.
 *
 * @param {String} divId to place pad
 * @param {String} width
 * @param {String} height
 * @param {Object} opts dict
 */
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

    /**
     * Called when a mouseup event happens.
     * saves line, disables this.mouseIsDown.
     */
    this.tearDown = function() {
        this.mouseIsDown = false;
        this.setLineToNamespace(this.activeLine);
        if (this.drawCallback) {
            this.drawCallback(this.activeLine);
        }
        return;
    }

    /**
     * Sets the active line
     * @param {Number} x coord to start at
     * @param {Number} y coord to start at
     */
    this.newLine = function(x, y) {
        this.activeLine = new quickdraw.Line(this, {x: x, y: y});
    }

    /**
     * Stores a quickdraw.Line object to a given pad namespace.
     * A namespace may represent the originating location of a line
     * (for example, the id of the person that created it.)
     *
     * @param {quickdraw.Line} line object
     * @param {String} ns namespace name
     */
    this.setLineToNamespace = function(line, ns) {
        var ns = ns || 'local';
        if (!this.lines[ns]) this.lines[ns] = [];
        this.lines[ns].push(line);
    }

    // attach mouse handlers for rect
    this.rect.mousedown(function (e) {
        pad.mouseIsDown = true;
        co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
        pad.newLine(co[0], co[1]);
    });

    this.rect.mousemove(function (e) {
        if (pad.mouseIsDown) {
            co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
            pad.activeLine.updatePath(co[0], co[1]);
          }
    });

    this.rect.mouseup(function () {
        if (pad.mouseIsDown) {
            pad.tearDown();
        }
    });

    // attach touch handlers for rect
    this.rect.touchstart(function (e) {
        pad.mouseIsDown = true;
        e = e.changedTouches[0];
        co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
        pad.newLine(co[0], co[1]);
    });

    this.rect.touchmove(function (e) {
        if (pad.mouseIsDown) {
            e = e.changedTouches[0];
            co = quickdraw.utils.getCoordsFromMouseEvent(e, pad.divId);
            pad.activeLine.updatePath(co[0], co[1]);
          }
    });

    this.rect.touchend(function () {
        e = e.changedTouches[0];
        if (pad.mouseIsDown) {
            pad.tearDown();
        }
    });

}