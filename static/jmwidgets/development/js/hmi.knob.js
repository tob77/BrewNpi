/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiKnob(wgtId, options, parentPage) {
    	// do nothing for default constructor
    if (!wgtId) return;

	this.type='round';
    this.snap = 1;
    this.min = 0;
    this.max = 2;
    this.startAngle = 0;
    this.stopAngle = 180;
    this.initAngle = 180;
    this.imgCx = 0.0;
    this.imgCy = 0.0
    this.initial = true;
    this.reverse = 0;	// 0 = clockwise
    this.value = 0;
    this.viewScale = {x:1, y:1};
        
    this._clickOffset = null;
    this.dragging = 0;
    hmiWidget.call(this, wgtId, options, parentPage);
    
	this.range = this.max - this.min;
	if (this.range==0) this.range = 1;
    this.startAngleRad = this.startAngle * Math.PI / 180;
    this.stopAngleRad = this.stopAngle * Math.PI / 180;
    this.initAngleRad = this.initAngle * Math.PI / 180;    
    
	this.render();	
            // event handler assignments	
	var self = this;	
	if (this.parentPage) {
		// if parent page, handle mouse clicks globally
		$(self.elem).bind( "mousedown.button", function (evt) {
			if (!options.disabled)
				$hmi.handleMouse(self);
		});
		$(self.elem).bind("touchstart", function (evt) {
			evt.preventDefault();
			if (!options.disabled)
				$hmi.handleMouse(self);
		});
	} else {
		// if no parent page, need to handle the mouse clicks in the widget
		$(self.elem).bind( "mousedown.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self) {
           		if (event && event.preventDefault) event.preventDefault(); // need to disable dragging in Firefox
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseDown(evtInfo, event);
			}
		});
		$(self.elem).bind( "mouseup.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self) {
            	if (event && event.preventDefault) event.preventDefault(); 
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseUp(evtInfo, event);
			}
		});
		$(self.elem).bind( "mousemove.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self && self.dragging) {
            	if (event && event.preventDefault) event.preventDefault(); 
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseMove(evtInfo, event);
			}
		});	
		$(self.elem).bind("touchstart", function (event) {
            if (event && event.preventDefault) event.preventDefault(); 
			var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
			if (!options.disabled)
				self.doMouseDown(evtInfo, event);
		});			
		$(self.elem).bind("touchmove", function (event) {
            if (event && event.preventDefault) event.preventDefault(); // need to disable dragging in Firefox
			var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
			if (!options.disabled)
				self.doMouseMove(evtInfo, event);
		});	
	}    
}
/**
 * Inheriting the base class Widget
 */
hmiKnob.prototype = new hmiWidget();


hmiKnob.prototype.render = function () {

	var canvas = this.elem.children[0];
    var me = this;
    if (canvas) {
        var ctx = canvas.getContext('2d');
        if (ctx) {
        	var value = this.value;
            var img = canvas.children[0];
            //For the first time make sure that the needle image is loaded completely in the browser.
            if (this.initial) {
	            	// make sure we have a center point set
				if (this.cx==undefined) this.cx = canvas.width/2;
				if (this.cy==undefined) this.cy = canvas.height/2;

                this.initial = false;
                var imgTmp = new Image();
                imgTmp.onload = function () {
                    me.drawRoundThumb(canvas, ctx, value, imgTmp);
                    delete imgTmp;
                };
                imgTmp.src = img.src;
            } else {
                me.drawRoundThumb(canvas, ctx, value, img);
            }
        }
    }
  
}
hmiKnob.prototype.drawRoundThumb = function (canvas, ctx, value, img) {

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.translate(this.cx, this.cy);	
	if (this.scale)
		ctx.scale(this.scale.x*this.viewScale.x, this.scale.y*this.viewScale.y);	
	else if (this.viewScale)
		ctx.scale(this.viewScale.x, this.viewScale.y);
		
    var angle = this._calcTheta(value);
    ctx.rotate(angle);
    ctx.drawImage(img, -this.imgCx, -this.imgCy);	
    
    ctx.restore();
};
/**
 * function calculat theta of a value
 * @param {Number} value The value of gauge used to compute the angle Theta of rotation
 * @return {Number} theta of the provided number
 */
hmiKnob.prototype._calcTheta = function (value) {
	if (value<this.min) value=this.min;
	if (value>this.max) value=this.max;
    var angle = (value - this.min) * (this.stopAngleRad - this.startAngleRad) / (this.max - this.min) + this.initAngleRad + this.startAngleRad;
    if (this.reverse == 1) angle = -angle;
    return angle;
};

/**
 * Setting the value of the Needle widget
 * @param {String} tag The tag name
 * @param {Number} newValue The new widget value
 */
hmiKnob.prototype.setValue = function (tag, newValue) {

    if (tag == "value") {
    	if (this.disabled)
    		return;
    		
        newValue = parseFloat(newValue)
        if (isNaN(newValue)) {
            return false
        }
        if (newValue > this.max) newValue = this.max; else if (newValue < this.min) newValue = this.min;
        this.value = newValue;
        this.render();
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue)
    }
};
/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiKnob.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.value;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};

/**
 * function that handles the onmousedown event on a hmiSlider's thumb element.
 * @param {Object} evtInfo The event object, custom made one
 * @param {Object} e The original event object
 */
hmiKnob.prototype.doMouseDown = function (evtInfo, e) {

    this.dragging = 1;
    var pos = {
	        x: evtInfo.x,
	        y: evtInfo.y
	    };		
    var normValue = this._normValueFromMouse(pos);

	// need to set value if clicked outside the thumb
    this.setValue("value", normValue);
    this.doWriteValue("value", this.value);

};
/**
 * function that handles the onmouseUp event on a hmiSlider's thumb element.
 * @param {Object} evtInfo The event object, custom made one
 * @param {Object} e The original event object
 */
hmiKnob.prototype.doMouseUp = function (evtInfo, e) {
    this.dragging = 0;
    this._clickOffset = null;
};
/**
 * function that handles the onmouseMove event on a hmiSlider's thumb element.
 * @param {Object} evtInfo The event object, custom made one
 * @param {Object} e The original event object
 */
hmiKnob.prototype.doMouseMove = function (evtInfo, e) {

    this.dragging = 1;
    var position = {
       x: evtInfo.x,
       y: evtInfo.y	
    };
	var normValue = this._normValueFromMouse(position);
    this.setValue("value", normValue);
    this.doWriteValue("value", this.value);
};

/**
 * Function that computes the value based on the clicked position
 * @param {Object} position Contains left and top values of the clicked position
 * @return {Number} The value computed
 */
hmiKnob.prototype._normValueFromMouse = function (pos) {
	var dx = pos.x - this.cx,
		dy = this.cy - pos.y,
		angle = Math.atan2(dy, dx)*180/Math.PI;
	
	var delta = (this.initAngle-angle-this.startAngle)*this.range/(this.stopAngle-this.startAngle);
	var value = this.reverse ? (this.max-delta) : (delta+this.min);

   if(this.snap)
      value = Math.round(value);
      
  return value;

};

$hmi.fn.hmiKnob = function (options, parentPage) {
    return new hmiKnob(this.wgtId, options, parentPage);
};