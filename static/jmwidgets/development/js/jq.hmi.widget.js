/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {

$.widget( "hmi.hmiWidget", {
	
	options: {

	},
	defClasses: "",
	wgtClass: '',
	hmiObj: null,
	hmiElem: null,
	
	_create: function() {

	},
	_createWidget: function( options, element ) {
		this.hmiElem = element;
		$.Widget.prototype._createWidget.call( this, options, element );
	},	
	defaultOptions: function( options, element ) {
		if (options.fx) {
			var fxOpts = options.fx;
			if (typeof fxOpts === "object") {
				if ($.isArray(fxOpts)) { 
					
				} else {
					
				}
			} else if (typeof fxOpts === "string") {
				this._addFx(fxOpts, options, element);
			} 
		}
			// allow the user to change the radius to get the best effect
		if (options.radius)	
			this.element.css("border-radius", options.radius);	

	},

	initWidget: function( wgt ) {
		this.hmiObj = wgt;
		$(this.element).data('hmiWgt', wgt);
	},
	widget: function() {
		return this.element;
	},
	hmiObject: function() {
		return this.hmiObj;
	},
	destroy: function() {
		this.element
			.removeClass( this.defClasses )
			.removeAttr( "role" );

		$.Widget.prototype.destroy.call( this );
	},

	_setOption: function( key, value ) {      

		if (this.hmiObj) {
			this.hmiObj.setOption(key, value);
			return this;
		}
	
		$.Widget.prototype._setOption.apply( this, key, value );
	},
	_getOption: function( key ) {   
		var value = undefined;   
			// first try the object
		if (this.hmiObj) {
			value = this.hmiObj.getOption(key);
		}	
			// next try the jq wrapper
		if (value===undefined) {
			value = this.options[key];
		}
		return value;
	},	
	option: function( key, value ) {
		var options = key;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.extend( {}, this.options );
		}

		if  (typeof key === "string" ) {
			if ( value === undefined ) {
				return this._getOption( key );
			}
			options = {};
			options[ key ] = value;
		}

		this._setOptions( options );

		return this;
	},
	value: function( newValue ) {
		if (this.hmiObj) {
			if ( newValue === undefined ) {
				return this.hmiObj.getOption('value');
			} else {
				this.hmiObj.setOption('value', newValue);
			}
		}
		return this;
	},	
	_addFx: function(strFx, options, element) {
		var fxOb = $hmi.getFx(strFx);
		if (fxOb && fxOb.effect) {
			fxOb.effect(options, element);
		} else {
			element.addClass('hmi-fx-'+strFx);
		}
	},
	_eventInfo: function(elem, e) {
	    var evt;
	    var evtTgt;
	    if (e && typeof e.originalEvent.touches === "object") {
	        if (e.originalEvent.touches.length <= 0) return;
	        evt = e.originalEvent.touches[0];
	        evtTgt = evt.target;
	    } else {
	        evt = e || event;
	        evtTgt = evt.srcElement || evt.target;
	    }
	    var inThumb = false;
	    var posx = 0;
	    var posy = 0;
	    	// todo: need to set or delete these values for jmWidgets
	    var wgtClickCx = 0;
	    var wgtClickCy = 0;
	    var isMouseDown = true;
	    if (evt.pageX || evt.pageY) {
	        posx = evt.pageX+this.scrollLeft;
	        posy = evt.pageY+this.scrollTop;
	    } else if (evt.clientX || evt.clientY) {
	        posx = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	        posy = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	    }
	    if (elem != evtTgt) {
	        evtTgt = evtTgt.parentNode;
	        if (elem == evtTgt) 
				inThumb = true;
	    }
	    var localX = 0;
	    var localY = 0;
	    if (elem) {
	        if (elem.pageX) 
				localX = posx - elem.pageX;
	        if (elem.pageY) 
				localY = posy - elem.pageY;
	    }
	    return {
	        wgt: elem,
	        isInThumb: inThumb,
	        isMouseDown: isMouseDown,
	        pageX: posx,
	        pageY: posy,
	        x: localX,
	        y: localY,
	        cx: wgtClickCx,
	        cy: wgtClickCy
	    };
	},	
	setValue: function (tag, newValue) {
			// pass on to the widget
		if (this.hmiObj!=undefined)
			this.hmiObj.setValue(tag, newValue);
	},	
	getValue: function (tag) {
			// pass on to the widget
		if (this.hmiObj!=undefined)
			return this.hmiObj.getValue(tag);
		else
			return null;
	},	
		// widget construction and layout classes (overridden by each widget)
	_calcClass: function( options , lastClass) { 
		return this.wgtClass;
	}, 	
	_resetLayout: function(  ) {      

	},	
	_setLayout: function( options, strClass ) {      
	
	},
		// utility functions
	_cssUrlToFile: function( text ) {
		return text.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
	},	
	_textToPt: function( text ) {
		var vals = text.trim().split(' ');
		return {
			x: (vals.length>0) ? parseFloat(vals[0]) : 0,
			y: (vals.length>1) ? parseFloat(vals[1]) : 0
		};
	},	
	_calcBorderRadCSS: function(strBdr, defBkImgSize) {
		var strNewBdr = strBdr;
			// only update pixel based borders (don't change % borders)
		if (strBdr.indexOf('px')>0) {
			var w = this.element.outerWidth(),
				h = this.element.outerHeight(),
				min = Math.min(w, h);	// radius should always be round so use min value
				bdr = parseInt(strBdr),
				radX = bdr/defBkImgSize.width * min,
				radY = bdr/defBkImgSize.height * min;
			
			strNewBdr = parseInt(radX)+"px "+parseInt(radY)+"px";
		}			
			
		return strNewBdr;		
	},	
	_calcBkSizeCSS: function(strBkSize, len, isVert) {			
		var sizes = strBkSize.split(',');			
			// assume always have 3 parts to image
		if (sizes.length===3) {
			var partA = this._textToPt(sizes[0]);
			var partB = this._textToPt(sizes[1]);
			
			if (isVert) {
				var newH = len-partA.y-partB.y;	
				strBkSize = "100% "+partA.y+"px, 100% "+partB.y+"px, 100% "+newH+"px";	
			} else {
				var newW = len-partA.x-partB.x;	
				strBkSize = partA.x+"px 100%,"+partB.x+"px 100%,"+newW+"px 100%";	
			}
		}
						
		return strBkSize;		
	},				
});

}( jQuery ) );
