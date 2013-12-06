/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiBorder", $.hmi.hmiWidget, {

	options: {
		bkImgSize: {width:150, height:150},
		shape: 'rect'
	},
	pad: {},
	wgtClass: "hmi-bdr",
	_create: function() {
		var options = this.options;
			
		this.defClasses = this._calcClass(options);						
		this.element
			.addClass( this.defClasses )
			.attr( "role", "border" );

		this._setLayout(options, this.defClasses);
				
			// add glass element if set as an option
		if (options.glass) {

			var glassClass = "hmi-glass-"+options.shape+"-"+options.glass,
				jq = this.element,
				w = jq.width(),		// need to read width and height again after padding set above
				h = jq.height(),
				padL = parseInt(jq.css('padding-left')),
				padT = parseInt(jq.css('padding-left'));		
			jq.append("<div class='"+glassClass+"' style='position:absolute; left:"+parseInt(padL)+"px; top:"+parseInt(padT)+"px; width:"+parseInt(w)+"px; height:"+parseInt(h)+"px' ></div>");

		}	
			// set background color
	    if (options.fill) 
	        this.element.css('background-color', options.fill);
	     			
		this.defaultOptions(options, this.element);
		
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiBorder(wgtId, options));	
	},
	_calcClass: function( options , lastClass) { 
		var strLastClass;
		if (options.style)	{
			strLastClass = this.wgtClass+"-"+options.shape+"-"+options.style;
		} else {	
			strLastClass = this.wgtClass+"-"+options.shape;
		}
		var strClass = lastClass ? strLastClass : this.wgtClass+" "+strLastClass;
		return strClass;
	}, 	    
	_resetLayout: function(  ) {      
		var jq = $(this.element);
		
		jq.css('padding','');
		jq.css('background-size','');
	},
	_setLayout: function( options, strClass ) {      
		var jq = $(this.element),
			pad = {},
			newPad = {},
			w = parseInt(jq.width()),
			h = parseInt(jq.height());
			
			// check if we have the padding saved in cache
		if (strClass && window.$hmicss && window.$hmicss[strClass]) {
			pad = $hmicss[strClass].padding;
		} 
			// if no pad string read it from jq
		if (!pad.str) {
			pad.top =  jq.css('padding-top');
			pad.right =  jq.css('padding-right');
			pad.bottom =  jq.css('padding-bottom');
			pad.left = jq.css('padding-left');
			pad.str = pad.top+" "+pad.right+" "+pad.bottom+" "+pad.left;
			pad.top =  parseInt(pad.top);
			pad.right =  parseInt(pad.right);
			pad.bottom =  parseInt(pad.bottom);
			pad.left = parseInt(pad.left);
				// cache the padding for next time
			if (strClass)
				$hmi.cacheCSS(strClass, { padding:pad });
		}
					
		// need to adjust padding so image scales correctly.  % values do not work correctly since it is based on the parent size and parent size can change
		if (pad.str ) {
			var bkgdSize = options.bkImgSize,
				strBkgdSize = this.element.css('background-size'),
				hasBkgdSizeCSS = (this.options.shape!=='round') ? 1 : 0,
				constrain = strBkgdSize.indexOf(',')>0 ? 1 : 0;
		
			if (hasBkgdSizeCSS)
				bkgdSize = this._readBkgdSizeCSS(strBkgdSize, options.bkImgSize);

				// adjust the pad based on the div size
			newPad = this._adjustPad(pad, bkgdSize, {width:w, height:h}, constrain);	
				// update the element
			this.element.css('padding', newPad.str);
			
			if (hasBkgdSizeCSS) {
				var scaleX = pad.left ? newPad.left/pad.left : 1;
				this._adjustBkgdSize(this.element, strBkgdSize, newPad, scaleX);	
			}
		}
	
			// allow the user to change the radius to get the best effect
		if (options.radius)	{
			this.element.css("border-radius", options.radius);	
		} else if (options.shape==='rrect') {
				// need to assume border is 30px by default since browsers do not return border radius reliably
//			var strCurRad = this.element.css('border-radius');
			var strRad = this._calcBorderRadCSS( "30px", options.bkImgSize );
			if (strRad)
				this.element.css('border-radius', strRad);
		}
	},
	
	_adjustPad: function(pad, imgSize, divSize, constrain) {
		var newPad={top:pad.top, right:pad.right, bottom:pad.bottom, left:pad.left};
			
		var pads = pad.str.split(" ");
		if (pads.length>=4) {
			var padPx,
				boxH = imgSize.height-pad.top-pad.bottom,
				boxW = imgSize.width-pad.left-pad.right;
			
			newPad.str = "";
			padPx = pad.top*divSize.height/boxH || 0; 
			newPad.top = padPx;
			newPad.str += newPad.top.toFixed(1) + "px ";
			padPx = pad.right*divSize.width/boxW || 0; 
			newPad.right = (constrain) ? Math.min(padPx, newPad.top) : padPx;
			newPad.str += newPad.right.toFixed(1) + "px ";
			padPx = pad.bottom*divSize.height/boxH || 0; 
			newPad.bottom = padPx;
			newPad.str += newPad.bottom.toFixed(1) + "px ";
			padPx = pad.left*divSize.width/boxW || 0; 
			newPad.left = (constrain) ? Math.min(padPx, newPad.top) : padPx;
			newPad.str += newPad.left.toFixed(1) + "px";

		}
		return newPad;					
	},

	_readBkgdSizeCSS: function(strSize, defSize) {			
		var size = defSize,
			sizes = strSize.split(',');
			
		var strTempSize = sizes[sizes.length-1].trim();
		var parts = strTempSize.split(" ");
		if (parts.length>0) 
			size.width =  parseInt(parts[0]);
			// only use width if there is 1 bkgd image
		if (parts.length>1) 	
			size.height=(sizes.length===1) ? parseInt(parts[1]) : size.width;
						
		return size;		
	},
	_adjustBkgdSize: function(elem, strSize, pad, scaleX) {			
		var strNewSize="";
			
		var sizes = strSize.split(',');	
		if (sizes.length==1) {
			strNewSize = "100% 100%";
			$(elem).css('background-size', strNewSize);
		} else if (sizes.length==3) {
			var outerW = $(elem).outerWidth(),
				valL = pad.left,
				valR = pad.right;
				// the left side is less then the image width so that we don't need to update the
				// image position
			if (sizes[0].indexOf('px')>0) {
				var parts = sizes[0].trim().split(' ');
				valL = parseInt(parts[0])*scaleX;
				strNewSize += parseInt(valL)+"px 100%,";
			} else {
				strNewSize += sizes[0]+",";
			}		
			if (sizes[1].indexOf('px')>0) {
				var parts = sizes[1].trim().split(' ');
				valR = parseInt(parts[0])*scaleX;
				strNewSize += parseInt(valR)+"px 100%,";
			} else {
				strNewSize += sizes[1]+",";
			}
			var valM = outerW-valL-valR+2;
			strNewSize += parseInt(valM)+"px 100%";
			$(elem).css('background-size', strNewSize);
				// adjust the background start postion
				// not good to use fixed values, but IE does not return pos correctly so we need to force fixed values
			var strNewPos = "left top,right top,"+parseInt(valL)+"px top";
			$(elem).css('background-position', strNewPos);
		}
	},
	_setOption: function( key, value ) {      
		if ((key==='shape')||(key==='style')) {
				// handle style or shape changes
			this.options.shape = (key==='shape') ? value : this.options.shape;
			this.options.style = (key==='style') ? value : this.options.style;
				
			this._resetLayout();
			this.element.removeClass(this.defClasses);
			this.defClasses = this._calcClass(this.options);
			this.element.addClass(this.defClasses);
			this._setLayout(this.options);
			return this;
		} 

		$.hmi.widget.prototype._setOption.apply( this, key, value );
	},	
});

}( jQuery ) );
