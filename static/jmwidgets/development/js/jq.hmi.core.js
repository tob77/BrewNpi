/**
 * JMwidgets 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
(function( $ ) {
  $.fn.hmiVal = function(value) {

 	return this.each(function() {
	  	var $this = $(this);
	  	hmiWgt = $this.data('hmiWgt');		  	
	  	if (hmiWgt) {
	  			// writing a value
	  		if (value !== undefined) {
	  			return hmiWgt.setValue(tag, value);
	  		}

	  		return hmiWgt.getValue(tag);
	  	} else {
	  		return $this.val(value);
	  	}	
	});

  };	
  $.fn.hmiProp = function(tag, value) {
		// writing a  value
	if (value !== undefined) {
		return this.each(function() {
	  		var $this = $(this);			
		  	hmiWgt = $this.data('hmiWgt');		  	
		  	if (hmiWgt) {
				hmiWgt.setValue(tag, value);
			}else {
		  		if (tag==="value") {
		  			$this.val(value);
		  		} else {
		  			$this.prop(tag, value);
		  		}				
			}
		});
	}else if (typeof tag==="object") {
		return this.each(function() {
	  		var $this = $(this);				
		  	hmiWgt = $this.data('hmiWgt');		  			  	
		  	if (hmiWgt) {
				for ( var i in tag ) {
					hmiWgt.setValue(i, tag[i]);
				}
			} else {
	  			$this.prop(tag);				
			}
		});
	} else {
	  	var $this = $(this);		
		hmiWgt = $this.data('hmiWgt');		  			  	
	  	if (hmiWgt) {
	  		return hmiWgt.getValue(tag);
	  	} else {
	  		if (tag==="value") {
	  			return $this.val();
	  		} else {
	  			return $this.prop(tag, value);
	  		}
	  	}	  				
	}
  };
  $.fn.hmiAttach = function(dataWgtId, tag) {

 	return this.each(function() {
	  	var $this = $(this),
	  		strBind;	
    	// use jquery to bind to the widget
    	strBind = 'change.'+tag.tag;
    	$(dataWgtId).bind(strBind, tag, function(event, newTag) {
    		var attr = event.data.attr || 'value',
    			srcVal;
    		if (newTag !== undefined) {
   				srcVal = newTag.value;
    		} else {
				srcVal = $(dataWgtId).hmiProp(event.data.tag);
			}
			if (srcVal!==undefined)
    			$this.hmiProp(attr, srcVal);
    	});
    		// if widgets writes, then bind the datasource to the widget
		if ((tag.rw==='rw')||(tag.rw==='w')) {
			var attr = tag.attr || 'value';
    		strBind = 'change.'+attr;
	    	$this.bind(strBind, tag, function(event, newTag) {
	    		var srcVal;
	    			// if binding internal newTag will be set, if binding to 3rd party newTag is null
	    		if (newTag) {
	    			srcVal = newTag.value;
	    		} else {
	    			var attr = event.data.attr || 'value';
					srcVal = $(dataWgtId).hmiProp(attr);
				}
				if (srcVal!==undefined)
					$(dataWgtId).hmiProp(event.data.tag, srcVal);
	    	});
    	}			
	});
  };  
})( jQuery );


