var quickdraw = {};
quickdraw.utils = quickdraw.utils || {};


/**
 * Get the x,y offsets of a div.
 *
 * @param {String} divId
 */
quickdraw.utils.getDivPosition = function(divId) {
    var d = document.getElementById(divId);
    return {x: d.offsetLeft, y: d.offsetTop};
}

/**
 * Get x,y coordinates for a mouse event, relative to the container div id
 * Makes allowances for Chrome/FF differences.
 *
 * @param {MouseEvent} event
 * @param {String} divId container div
 */
quickdraw.utils.getCoordsFromMouseEvent = function(event, divId) {
    var pos = quickdraw.utils.getDivPosition(divId);
    var x = event.offsetX ? event.offsetX : event.clientX - pos.x;
    var y = event.offsetY ? event.offsetY : event.clientY - pos.y;
    return [x, y];
}

/**
 * Handle incoming and outgoing messages to a pad
 * @param {quickdraw.Drawer} drawer instance
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
    p.setBasePath(msg.path);
    this._drawer.activeLine = p;
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
    this.basePath = []; // the rawest representation of our path co-ords
    this.transformedPath = []; // path with changes applied, ex: this.curvify()
    if (opts.x && opts.y) {
        this.basePath = [["M", opts.x, opts.y]];
        this.path = drawer.paper.path(this.basePath);
    } else {
        this.path = drawer.paper.path();
    }
    this.path.mouseup(function () {
        drawer.tearDown();
    });
}

/**
 * Append co-ordinates to the path.
 *
 * @param {Number} x coord
 * @param {Number} y coord
 */
quickdraw.Line.prototype.updatePath = function(x, y) {
    if (typeof(this.basePath) == 'string') {
        this.basePath = Raphael.parsePathString(this.basePath);
        if (this.basePath == null) this.basePath = [];
    }
    this.basePath.push(["L", x, y]);
    this.setPath(this.basePath);
}

/**
 * Visually set the path (but do not change the underlying path).
 * For example, curvify() will call setPath, but will not update basePath.
 *
 * @param {String} Complete path string
 */
quickdraw.Line.prototype.setPath = function(path) {
    this.path.attr({path: path});
}

/**
 * Hard set the underlying path.
 *
 * @param {String} Complete path string
 */
quickdraw.Line.prototype.setBasePath = function(path) {
    this.basePath = path;
    this.setPath(this.basePath);
}

/**
 * Get a String representation of the path.
 */
quickdraw.Line.prototype.getPath = function(transformed) {
    var p = (transformed) ? this.transformedPath : this.basePath;
    return Raphael.parsePathString(p);
}

/**
 * Reduce the jaggedness of a line/smooth a line.
 *
 * Uses catmullrom2bezier.js to achieve smoothing.
 * Since paths rendered with drawer capture a lage number of points
 *   (i.e.: many x,y co-ordinates build a path), this method takes
 *   points from the path at a specified interval (ex: every 5th path)
 *   and uses these as the basis for the smooth function as defined in
 *   catmullrom2bezier.js.
 *   It also ensures that the first and last points of the original path
 *   are maintained.
 *
 * This method reads from this.basePath and writes to this.transformedPath,
 * the original path (this.basePath) is never overwritten.
 *
 * @param {Float} coverage value between 0-1, indicating what percentage
 *                of the path entries should be considered.
 *                0 -> A straight line between the first and last point
 *                1 -> Every point on the path included.
 */
quickdraw.Line.prototype.curvify = function(coverage) {
    var out = [], p = this.getPath();
    var interval = Math.floor(p.length/(p.length*coverage));
    for (var i=0, l=p.length;i<l-1;i+=interval) {
        out.push(p[i].slice(1, 3));
    }
    out.push(p[p.length-1].slice(1, 3));
    if (out.length > 2) {
        var curvyPath = 'M' + out[0] + ' R' + out.slice(1, out.length).join(' ');
        this.transformedPath = parsePathString(curvyPath);
    } else {
        this.transformedPath = 'M' + out[0] + 'L' + out[1];
    }
    this.setPath(this.transformedPath);
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