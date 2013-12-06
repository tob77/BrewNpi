/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 

function hmiAnalogClock(wgtId, options, parentPage) {
	
    // do nothing for default constructor
    if (!wgtId) return;

	this.hrs = 0;
	this.mins = 0;
	this.secs = 0;
	this.timeMs = 0;
	this.showSecs = true;
	this.hrsImg = null;
	this.minsImg = null;
	this.secsImg = null;
    this.tickTimer = null;	

    hmiWidget.call(this, wgtId, options, parentPage);

		// set initial time values (do before creating the needles)
	var dt = new Date();
	this.timeMs = dt.getTime();
	this.secs = dt.getSeconds();
	this.mins = dt.getMinutes();
	this.hrs = dt.getHours();
		// create the needles
	this.initNeedles();
    // tell the page we need to be started and stopped
    if (parentPage) {
	    parentPage.bind('pagestart', this);
	    parentPage.bind('pagestop', this);
	} else {
		this.start();
	}	
};

hmiAnalogClock.prototype = new hmiWidget();

hmiAnalogClock.prototype.setValue = function (tag, newValue) {
    if (this.isBadValue(newValue)) {
        return false;
    }
    if (tag === 'showSecs') {
		this.showSecs = newValue ? true : false
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
}

hmiAnalogClock.prototype.getValue = function (tag) {
    if (tag == "showSec") {
        return this.showSecs;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};

hmiAnalogClock.prototype.render = function () {
    var elems = this.elem.getElementsByTagName('canvas');
    if (elems && elems.length>0) {
    	var canvas = this.elems[0];
	    ctx.save();
	    ctx.clearRect(0, 0, canvas.width, canvas.height);
	    if (this.hrsImg)
			this.drawNeedle(ctx, this.hrsImg, this.hrsCtr, this.hrs);
		if (this.minsImg)
			this.drawNeedle(ctx, this.minsImg, this.minsCtr, this.mins);
		if (this.showSecs && this.secsImg) {
			this.drawNeedle(ctx, this.secsImg, this.secsCtr, this.secs);
		}
		ctx.restore();
	}
}
hmiAnalogClock.prototype.initNeedles = function () {
	var urlToFile = function( text ) {
		var strFile;
		var idx1 = text.indexOf('(');
		if (idx1>=0) {
			var idx2 = text.indexOf(')', idx1);
			if (idx2>idx1) {
				strFile=text.substring(idx1+1, idx2);
					// remove quote characters (not sure why they are there but they are)
				strFile = strFile.replace(/\"/g,'');
				strFile = strFile.replace(/\'/g,'');
			}
		}
		return strFile;
	};	
	var textToPt = function( text ) {
		var pt = { x:0, y:0 };
		var vals = text.split('px');
		if (vals.length>0)
			pt.x = parseInt(vals[0]);
		if (vals.length>1)
			pt.y = parseInt(vals[1]);
		return pt;	
	};	
 
    var elems = this.elem.getElementsByTagName('canvas');
    if (elems && elems.length>0) {
    	var canvas = elems[0];
		if (canvas) {
	    		// needle images are stored as CSS bkgd images of a canvas element
		    	//  using CSS allows us to provide different themes for the needles in the future
		    	// (note: need to use jquery css to get true css during load time) 
		    var bkgdImgs = $(canvas).css('background-image').split(",");   	 
		    var bkgdPos = $(canvas).css('background-position').split(",");
		    if (bkgdPos.length>0)
		    	this.hrsCtr = textToPt(bkgdPos[0]);
		    if (bkgdPos.length>1)
		    	this.minsCtr = textToPt(bkgdPos[1]);
		    if (bkgdPos.length>2)
		    	this.secsCtr = textToPt(bkgdPos[2]); 	  
		    	
		   $(canvas).css('background-image', "none");  	
		   $(canvas).css('background-position', "none");  	
		   $(canvas).css('background-repeat', "none");  		

				// make sure we have a center point set
			if (this.cx==undefined) this.cx = canvas.width/2;
			if (this.cy==undefined) this.cy = canvas.height/2;

				// create and draw the needle
			var ctx = canvas.getContext('2d');
		    if (ctx) {
			    ctx.save();
			    ctx.clearRect(0, 0, canvas.width, canvas.height);
			    var hrs = this.hrs>12 ? this.hrs-12 : this.hrs;
			    hrs = (hrs+this.mins/60)*5;
		        if (bkgdImgs.length>0)
			    	this.hrsImg = this.createNeedle(ctx, urlToFile(bkgdImgs[0]), this.hrsCtr, hrs);
			    if (bkgdImgs.length>1)
			    	this.minsImg = this.createNeedle(ctx, urlToFile(bkgdImgs[1]), this.minsCtr, this.mins);
			    if (bkgdImgs.length>2)
			    	this.secsImg = this.createNeedle(ctx, urlToFile(bkgdImgs[2]), this.secsCtr, this.secs);
			   	ctx.restore();		
			}

		}
	}	
}

hmiAnalogClock.prototype.createNeedle = function (ctx, imgFile, imgCtr, value) {
    var me = this;
 	var img = new Image();
		// need to draw the first time
	img.onload = function () {
        me.drawNeedle(ctx, img, imgCtr, value);
    };
	img.src = imgFile;
	return img;
}

hmiAnalogClock.prototype.updateClock = function () {

    var elems = this.elem.getElementsByTagName('canvas');
    if (elems && elems.length>0) {
    	var canvas = elems[0];
		if (canvas) {
				// make sure we have a center point set
			if (this.cx==undefined) this.cx = canvas.width/2;
			if (this.cy==undefined) this.cy = canvas.height/2;
				// create and draw the needle
			var ctx = canvas.getContext('2d');
		    if (ctx) {
			    ctx.clearRect(0, 0, canvas.width, canvas.height);
			    var hrs = this.hrs>12 ? this.hrs-12 : this.hrs;
			    hrs = ((hrs+this.mins/60)*5);
			    if (this.hrsImg) 
			    	this.drawNeedle(ctx, this.hrsImg, this.hrsCtr, hrs);
			    if (this.minsImg)
			    	this.drawNeedle(ctx, this.minsImg, this.minsCtr, this.mins);		
			    if (this.secsImg)
			    	this.drawNeedle(ctx, this.secsImg, this.secsCtr, this.secs);		
			}

		}
	}	
};
hmiAnalogClock.prototype.doTick = function () {
	var dt = new Date();
	this.timeMs = dt.getTime();
	this.secs = dt.getSeconds();
	this.mins = dt.getMinutes();
	this.hrs = dt.getHours();
	this.updateClock();
}

hmiAnalogClock.prototype.drawNeedle = function (ctx, img, imgCtr, value) {
	ctx.save();
    ctx.translate(this.cx , this.cy);
    	// value is in secs.  360deg = 60 ticks.  init angle=90
    var angle =  (value * 360 / 60 - 90)*Math.PI/180;
    ctx.rotate(angle);
    if (this.scale) {
    	var x = imgCtr.x*this.scale.x,
    		y =  imgCtr.y*this.scale.y,
    		w = img.width * this.scale.x,
    		h = img.height * this.scale.y;
    	ctx.drawImage(img, -x, -y, w, h);
    } else {
    	ctx.drawImage(img, -imgCtr.x, -imgCtr.y);
    }
    ctx.restore();
};
hmiAnalogClock.prototype.start = function () {
    var strTickFunc = "$hmi('" + this.wgtId + "').widget().doTick();";
    this.tickTimer = setInterval(strTickFunc, 1000);
};

hmiAnalogClock.prototype.stop = function () {
	if (this.tickTimer)
		clearInterval(this.tickTimer);
    this.tickTimer = null;
};

$hmi.fn.hmiAnalogClock = function (options, parentPage) {
    return new hmiAnalogClock(this.wgtId, options, parentPage);
};