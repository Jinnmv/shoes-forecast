/**
 * Plugin: jquery.zWeatherFeed
 * 
 * Version: 1.0.2
 * (c) Copyright 2010, Zazar Ltd
 * 
 * Description: jQuery plugin for display of Yahoo! Weather feeds
 * 
 * History:
 * 1.0.2 - Correction to options / link
 * 1.0.1 - Added hourly caching to YQL to avoid rate limits
 *         Uses Weather Channel location ID and not Yahoo WOEID
 *         Displays day or night background images
 *
 **/
$(document).ready(function () {
	var options = {
		unit: 'c',
		image: false,
		highlow: false,
		wind: false,
		link: false,
		showerror: true
	};

	//default city
	var default_city = "Dnipropetrovs'k";
	var default_woeid = 918981;

	//browser is accepting cookies
	if( $.cookies.test() ) {
		if ($.cookies.get('city')) default_city = $.cookies.get('city');
		if ($.cookies.get('woeid')) default_woeid = $.cookies.get('woeid');
	}

	//set default sity/woeid
	$('#city').val(default_city);
	$('#temp').weatherfeed([default_woeid], options);
	
	// Select All city text on focus
	$("#city").focus(function(){
		 $this = $(this);
		 $this.select();

		 // Work around Chrome's little problem
		 $this.mouseup(function() {
			 // Prevent further mouseup intervention
			 $this.unbind("mouseup");
			 return false;
		 });
	});

	$("#city").autocomplete({
		source: function(request, response) {
			now = new Date();
			var query = "select * from geo.places where text='" + request.term + "*' and placeTypeName='Town'";
			var api = 'http://query.yahooapis.com/v1/public/yql?q='+ encodeURIComponent(query) +'&rnd='+ now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() +'&format=json&callback=?';

			// Send request
			$.getJSON(api, function(data) {
				if (data.query.results) {
					var place = data.query.results.place;
					response( $.map( $.isArray(place) ? place : [place], function( item ) {
						return {
									label: item.name + " (" + item.admin1.content + "), " + item.country.content,
									value: item.name,
									id: item.woeid
						}
					}));
				}
			});
		},
		minLength: 3,
		select: function( event, ui ) {
			$('#temp').weatherfeed(ui.item.id, options);
			//browser is accepting cookies
			if( $.cookies.test() ) {
				var expDate = new Date();
				expDate.setMonth(expDate.getMonth()+3);
				$.cookies.set('woeid', ui.item.id, {expiresAt: expDate})
				$.cookies.set('city', ui.item.value, {expiresAt: expDate});
			}
			$(this).removeClass("ui-autocomplete-loading");
		},
		open: function() {
			$(this).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
		},
		close: function() {
			$(this).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
		}
	});

});  
  
function highlight_shoes(temp_val){
	// TODO refactor to JSON
	var temp_constr = [['thongs',30,55],
		['flip-flops',25,55],
		['sandals',20,30],
		['closed-sandals',18,25],
		['sabots',17,25],
		['court-shoes',12,20],
		['botilony',10,15],
		['ankle-boots',3,12],
		['demi-boots',-3,3],
		['winter-boots',-10,-3],
		['high-felt-boots',-20,-10]];

	/*var temp_constr_json = {[
	  {'Name': 'flip-flops', 'MinTemp': 25, 'MaxTemp': 35},
	  {'Name': 'sandals', 'MinTemp': 20, 'MaxTemp': 35},
	  {'Name': 'closed-sandals', 'MinTemp': 18, 'MaxTemp': 25},
	  {'Name': 'sabots', 'MinTemp': 17, 'MaxTemp': 25},
	  {'Name': 'court-shoes', 'MinTemp': 12, 'MaxTemp': 20},
	  {'Name': 'botilony', 'MinTemp': 10, 'MaxTemp': 15},
	  {'Name': 'ankle-boots', 'MinTemp': 3, 'MaxTemp': 12},
	  {'Name': 'demi-boots', 'MinTemp': -3, 'MaxTemp': 3},
	  {'Name': 'winter-boots', 'MinTemp': -10, 'MaxTemp': -3},
	  {'Name': 'high-felt-boots', 'MinTemp': -20, 'MaxTemp': -10}
	  ]}*/
	
	$("#shoes-list dt").removeClass("optimal-shoes");
	
	for (var i=temp_constr.length-1; i>=0; i--) {
		if (temp_val >= temp_constr[i][1] && temp_val < temp_constr[i][2]) {
			if (!$("#"+temp_constr[i][0]).hasClass("optimal-shoes")) $("#"+temp_constr[i][0]).addClass("optimal-shoes");
			$("#bar").height((temp_constr.length-i)*38);
		}
	}
}

(function($){

	$.fn.weatherfeed = function(woeid, options) {
	
		// Set pluign defaults
		var defaults = {
			unit: 'c',
			image: true,
			highlow: true,
			wind: true,
			link: true,
			showerror: true
		};  
		var options = $.extend(defaults, options); 
		
		// Functions
		return this.each(function(i, e) {
			var $e = $(e);
			
			// Add feed class to user div
			if (!$e.hasClass('weatherFeed')) $e.addClass('weatherFeed');

			// Cache results for an hour to prevent overuse
			now = new Date();
					
			// Create Yahoo Weather feed API address
			//var query = "select * from weather.forecast where location in ("+ locationid +") and u='"+ options.unit +"'";
			var query = "select * from weather.forecast where woeid ="+ woeid +" and u='"+ options.unit +"'";
			var api = 'http://query.yahooapis.com/v1/public/yql?q='+ encodeURIComponent(query) +'&rnd='+ now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() +'&format=json&callback=?';

			// Send request
			$.getJSON(api, function(data) {
				if (data.query.results) {
					_callback(e, data.query.results.channel, options);

						/*if (data.query.results.length > 0 ) {
							// Multiple locations
							var result = data.query.results.channel.length;
							for (var i=0; i<result; i++) {
								// Create weather feed item
								_callback(e, data.query.results.channel[i], options);
							}
						} else {
							// Single location only
							_callback(e, data.query.results.channel, options);
						}*/
					} else {
						if (options.showerror) $e.html('<p>Weather information unavailable</p>');
					}


				/*if (data.query) {
						if (data.query.results.length > 0 ) {
							// Multiple locations
							var result = data.query.results.channel.length;
							for (var i=0; i<result; i++) {
								// Create weather feed item
								_callback(e, data.query.results.channel[i], options);
							}
						} else {
							// Single location only
							_callback(e, data.query.results.channel, options);
						}
					} else {
						if (options.showerror) $e.html('<p>Weather information unavailable</p>');
					}*/
					/*window.setTimeout(function(){ $e.weatherfeed(woeid, options) }, 300000);*/
			});

		});
	};
	
	// Function to each feed item
	var _callback = function(e, feed, options) {
		var $e = $(e);
		if( $.isArray(feed) ){
			feed = feed[0];
		}

		$e.find(".temp-value").html(feed.item.condition.temp +"&deg;"+options.unit.toUpperCase());
		//$e.find(".temp-text").text(feed.item.condition.text);
		//$e.find(".temp-text").text(feed.item.forecast[0].high + " " + feed.item.forecast[0].low);
		highlight_shoes(feed.item.condition.temp);
		
		// Tinycon https://github.com/tommoor/tinycon
		Tinycon.setOptions({
			width: 5,
			height: 10,
			font: '9px Arial',
			colour: '#ffffff',
			background: '#1790C4',
			fallback: true
		});
		Tinycon.setBubble(feed.item.condition.temp);

	}

	// Get time string as date
	var _getTimeAsDate = function(t) {
		d = new Date();
		r = new Date(d.toDateString() +' '+ t);
		return r;
	};
})(jQuery);


