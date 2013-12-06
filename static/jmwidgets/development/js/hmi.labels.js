/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiLabels(wgtId, options, parentPage) {

    this.reverse = 1; // 1 = clockwise
    this.min = 0.0;
    this.max = 500.0;
    this.labels = 10;
    this.startAngle = 0.0 * Math.PI / 180;
    this.stopAngle = 90.0 * Math.PI / 180;
    this.cx = 0.0;
    this.cy = 0.0;
    this.range = 500.0;
    this.font = '22px Arial';
    this.fontColor = 'rgb(0,0,0)';
	hmiWidget.call(this, wgtId, options, parentPage); 

		// we need a center point for round widgets
	if (this.width===undefined)
		this.width = $(this.elem).width();
	if (this.height===undefined)
		this.height = $(this.elem).height();
	if (this.cx===undefined) 
		this.cx = this.width/2;	
	if (this.cy===undefined) 
		this.cy = this.height/2;	
		// not sure why, but need to reduce radius by 3 to match jm
	if (this.radiusX===undefined) 
		this.radiusX = this.cx-13;	
	if (this.radiusY===undefined) 
		this.radiusY = this.cy-13;	

		// init the canvas element
	this.render();  
	   
}

/**
 * Inheriting the base class Widget
 */
hmiLabels.prototype = new hmiWidget();

hmiLabels.prototype.getCanvasElem = function()
{
	var canvas = null;
		// search for canvas as a child first
	var canvasElems = this.elem.getElementsByTagName('canvas');
	if (canvasElems.length>0)
		canvas = canvasElems[0];
		
		// next check if canvas is a sibling
	if (!canvas) {
	    if (this.elem.parentElement) {
			var canvasElems = this.elem.parentElement.getElementsByTagName('canvas');
			if (canvasElems.length>0)
				canvas = canvasElems[0];
		}
	}
	return canvas;
}
/**
 * Labels canvas rendering starts the drawing of labels
 */
hmiLabels.prototype.render = function () {
    //Render only if the element is present	
    if (this.elem) {
    	var canvas = this.getCanvasElem();
        if (canvas && canvas.getContext) {
            var ctx = canvas.getContext('2d');
            //ctx.translate(this.cx, this.cy);
            ctx.save();
            if (this.rotated) 
            	this.drawRadial(ctx);
            else 
            	this.drawLinear(ctx);
            ctx.restore();
        }
    }
};

hmiLabels.prototype.drawRadial = function (ctx) {

	// subtract one to account for start tick
	var labels = this.labels-1;
	if (labels < 1)
		labels = 1;
	var stepAngle = (this.stopAngle - this.startAngle) / labels;
	
	var cx = this.cx,
		cy = this.cy,
		rx = this.radiusX,
		ry = this.radiusY,
		angle = this.startAngle;	  
	var x1,x2,y1,y2,c,s,step, lbl;

		// set position inside the canvas
	ctx.translate(this.x, this.y);
    // overall widget scaling
	if (this.scale) 
		ctx.scale(this.scale.x, this.scale.y);
		
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.fillStyle = this.fontColor;
		
    var step = (this.max - this.min) / labels;
	for (var i = 0; i <= labels; i++) {

		c = Math.cos(Math.PI*angle/180);
		s = Math.sin(Math.PI*angle/180);
		x1 = cx - rx*c;
		y1 = cy - ry*s;
		ctx.beginPath();
		
        if (this.reverse == 1) {
			lbl = Math.round(i * step + this.min);
        } else {
 			lbl = Math.round(this.max - i * step) + this.min;
        }
        ctx.fillText(lbl, x1, y1)

		angle += stepAngle;
	}

};
/**
 * Draws the linear labels 
 * @param {Object} ctx Canvas element
 */
hmiLabels.prototype.drawLinear = function (ctx) {
	
	};

$hmi.fn.hmiLabels = function(options, parentPage) {
	return new hmiLabels(this.wgtId, options, parentPage);
};