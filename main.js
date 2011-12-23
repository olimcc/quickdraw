var rappad = {};

rappad.Drawer = function(divId, width, height, opts) {
    this.paper = Raphael(divId, width, height);
    this.mouseIsDown = false;
    this.currentPath = null;    
    this.rect = this.paper.rect(0, 0, this.paper.width, this.paper.height);
    this.rect.attr({
        'fill': 'white',
        'stroke': 'white',
        'fill-opacity': 0,
        'stroke-opacity': 0});
    this.pathSet = this.paper.set();
    var pad = this;

    // after the mouseup happens
    this.tearDown = function() {
        this.mouseIsDown = false;
        this.pathSet.push(this.currentPath);
        this.currentPath = null;
        return;
    }

    // after the mousedown happens
    this.setUp = function(e) {
        this.currentPath = this.paper.path([["M", e.offsetX, e.offsetY]]);
        this.currentPath.mouseup(function () {
            pad.tearDown();
        });
    }

    this.updatePath = function(x, y) {
          var arr = this.currentPath.attrs.path;
          arr.push(["L", x, y]);
          this.currentPath.attr({path: arr});
          return;
    }

    // attach handlers for rect
    // when a mouse down happens
    this.rect.mousedown(function () {
        pad.mouseIsDown = true;
    });

    // when a mousemove happens
    this.rect.mousemove(function (e) {
        if (pad.mouseIsDown) {
          if (!pad.currentPath) {
            pad.setUp(e);
          } else {
            pad.updatePath(e.offsetX, e.offsetY);
          }
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