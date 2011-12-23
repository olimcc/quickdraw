var rappad = {};

rappad.Line = function(drawer, x, y, opt_id) {
    this.id = opt_id || null;
    this.path = drawer.paper.path([["M", x, y]]);
    this.path.mouseup(function () {
        drawer.tearDown();
    });
    bla = this;
}

rappad.Line.prototype.updatePath = function(x, y) {
    var arr = this.path.attrs.path;
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
    this.localLines = [];
    var pad = this;

    // after the mouseup happens
    this.tearDown = function() {
        this.mouseIsDown = false;
        this.localLines.push(this.activeLine);
        return;
    }

    // after the mousedown happens
    this.setUp = function(x, y) {
        this.activeLine = new rappad.Line(this, x, y);
    }

    // attach handlers for rect
    // when a mouse down happens
    this.rect.mousedown(function (e) {
        pad.mouseIsDown = true;
        pad.setUp(e.offsetX, e.offsetY);
    });

    // when a mousemove happens
    this.rect.mousemove(function (e) {
        if (pad.mouseIsDown) {
            pad.activeLine.updatePath(e.offsetX, e.offsetY);
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
    p = new rappad.Drawer('canvas', 800, 800);
});