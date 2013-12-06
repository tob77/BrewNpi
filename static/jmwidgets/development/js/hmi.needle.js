/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiNeedle(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

	this.type='round';
    this.direction = 1; // 1 = clockwise
    this.min = 0.0;
    this.max = 100.0;
    this.startAngle = 0.0;
    this.stopAngle = 90.0;
    this.initAngle = 180.0;
    this.imgCx = 0.0;
    this.imgCy = 0.0
    this.initial = true;
    this.reverse = 0;
    this.value = 0;
    hmiWidget.call(this, wgtId, options, parentPage);

	if (this.type==='round') {
	    this.startAngleRad = this.startAngle * Math.PI / 180;
	    this.stopAngleRad = this.stopAngle * Math.PI / 180;
	    this.initAngleRad = this.initAngle * Math.PI / 180;    
	} else {
	    this.needleElem = this.elem.children[0];    	
	    if (this.length===undefined) {
	    	if (this.type=="vert")
	    		this.length = this.elem.clientHeight-15;
	    	else
	     		this.length = this.elem.clientWidth-15;
	    }
	    this.range = this.max - this.min;
	    	// make sure the range is not 0
	    if (!this.range)
	    	this.range = 100;
	    	
	    if (this.align && this.needleElem) {
	    	if ((this.type=="vert")&&(this.align=="right")) {
	    		var w = $(this.needleElem).width();
    			var px = this.elem.clientWidth - w;
    			this.needleElem.style['left'] = px + 'px';
	    	} else if ((this.type=="horiz")&&(this.align=="bottom")) {
	    		var h = $(this.needleElem).height();
     			var px = this.elem.clientHeight - h;
   				this.needleElem.style['top'] = px + 'px';
	    	}
	    }	
	}	
    
    if (this.value !== null)
    	this.updateNeedle(this.value);
}
/**
 * Inheriting the base class Widget
 */
hmiNeedle.prototype = new hmiWidget();

hmiNeedle.prototype.render = function () {
	this.updateNeedle(value);
}
/**
 * function updates the needle value
 * @param {Number} value The value of gauge used to update the needle.
 */
hmiNeedle.prototype.updateNeedle = function (value) {
	
	if (this.type==='vert') {
			// vert starts from the bottom
    	var px = this.length - (this.length * (value - this.min) / this.range );
    	if (this.needleElem)
    		this.needleElem.style['top'] = px + 'px';
		
	} else if (this.type==='horiz') {
    	var px = this.length * (value - this.min) / this.range;
     	if (this.needleElem)
   			this.needleElem.style['left'] = px + 'px';
		
	} else {
		var canvas = this.elem.children[0];
	    var me = this;
	    if (canvas) {
	        var ctx = canvas.getContext('2d');
	        if (ctx) {
	            var img = canvas.children[0];
	            //For the first time make sure that the needle image is loaded completely in the browser.
	            if (this.initial) {
		            	// make sure we have a center point set
					if (this.cx==undefined) this.cx = canvas.width/2;
					if (this.cy==undefined) this.cy = canvas.height/2;
	
	                this.initial = false;
	                var imgTmp = new Image();
	                imgTmp.onload = function () {
	                    me.drawRoundNeedle(canvas, ctx, value, imgTmp);
	                    delete imgTmp;
	                };
	                imgTmp.src = img.src;
	            } else {
	                me.drawRoundNeedle(canvas, ctx, value, img);
	            }
	        }
	    }
	}
};
/**
 * function that calculates the angle of the needle and rotate it to that angle based on the new value provided
 * @param {Object} canvas The canvas element
 * @param {Object} ctx Canvas element's context
 * @param {Number} value The value of gauge used to update the needle.
 * @param {Object} img The needle image element
 */
hmiNeedle.prototype.drawRoundNeedle = function (canvas, ctx, value, img) {
    var imgTmp
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.translate(this.cx, this.cy);	
	if (this.scale)
		ctx.scale(this.scale.x, this.scale.y);	

    var angle = this.calcTheta(value);
    ctx.rotate(angle);
    ctx.drawImage(img, -this.imgCx, -this.imgCy);	
    
    ctx.restore();
};
/**
 * function calculat theta of a value
 * @param {Number} value The value of gauge used to compute the angle Theta of rotation
 * @return {Number} theta of the provided number
 */
hmiNeedle.prototype.calcTheta = function (value) {
    var angle = (value - this.min) * (this.stopAngleRad - this.startAngleRad) / (this.max - this.min) + this.initAngleRad + this.startAngleRad;
    if (this.reverse == 1) angle = -angle;
    return angle;
};
/**
 * Setting the value of the Needle widget
 * @param {String} tag The tag name
 * @param {Number} newValue The new widget value
 */
hmiNeedle.prototype.setValue = function (tag, newValue) {

    if (tag == 'value') {
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
        newValue = parseFloat(newValue)
        if (isNaN(newValue)) {
            return false
        }
        if (newValue > this.max) newValue = this.max; else if (newValue < this.min) newValue = this.min;
        this.value = newValue;
        this.updateNeedle(newValue);
        this.sendUpdate( tag, this.value );
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
};

hmiNeedle.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.value;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};

$hmi.fn.hmiNeedle = function (options, parentPage) {
    return new hmiNeedle(this.wgtId, options, parentPage);
};