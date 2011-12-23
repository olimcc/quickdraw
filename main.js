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
        return this.paper.path([["M", e.offsetX, e.offsetY]]);
    }

    // attach handlers for rect
    // when a mouse down happens
    this.rect.mousedown(function () {
        pad.mouseIsDown = true;
        return false;
    });

    // when a mousemove happens
    this.rect.mousemove(function (e) {
        if (pad.mouseIsDown) {
          if (!pad.currentPath) {
            // create the current path if it doesn't exist
                pad.currentPath = pad.setUp(e);
              // attach a click handler to the path
              pad.currentPath.mouseup(function () {
                pad.tearDown();
              });
          }
          var arr = pad.currentPath.attrs.path;
          arr.push(["L", e.offsetX, e.offsetY]);
          // this appears to return p to the handler
          pad.currentPath.attr({path: arr});
        }
        return false;
    });

    // attach mouseup handlers to end line draw
    this.rect.mouseup(function () {
        if (pad.mouseIsDown) {
            pad.tearDown();
        }
        return false;
    });

}

$(document).ready(function () {
    p = new rappad.Drawer('canvas', 800, 800);
});