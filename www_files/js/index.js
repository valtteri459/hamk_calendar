function loading(target){
	target.html(`<div class="center-align">
		<div class="preloader-wrapper big active">
      <div class="spinner-layer spinner-blue">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>

      <div class="spinner-layer spinner-red">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>

      <div class="spinner-layer spinner-yellow">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>

      <div class="spinner-layer spinner-green">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>
    </div>
	</div>`);
}
function loadItem(itemId){
	$("#search").val(itemId);
	$("#fullcal").fullCalendar("destroy");
	loading($("#fullcal"));
	$.getJSON("/api/groupSchedule/"+itemId, function(calConts){
		console.log(calConts);
		console.log(itemId);
		var events = [];
		for(var i = 0;i<calConts.length;i++){
			var crow = calConts[i];
			events.push({
			    title: crow.subject,
			    start: crow.start,
			    end: crow.end,
			    color: '#C2185B',
					description: crow.description,
					data:crow
			});
		}
		$("#fullcal").html("");
		$("#fullcal").fullCalendar({
			editable: false, // Don't allow editing of events
			handleWindowResize: true,
			weekends: false, // Hide weekends
			defaultView: 'agendaWeek', // Only show week view
			header:{
				left: "prev,next today",
				center: "title",
				right: false
			},
			minTime: '07:30:00', // Start time for the calendar
			maxTime: '22:00:00', // End time for the calendar
			timeFormat: "H:mm",
			columnFormat: 'ddd D MMM', // Only show day of the week names
			axisFormat: "H",
			slotLabelFormat: "HH:mm",
			displayEventTime: true, // Display event time
			events: events,
			eventRender: function (event, element) {
	        	element.attr('href', 'javascript:void(0);');
	        	element.click(function() {
	            	$("#startTime").html(moment(event.start).format('ddd, MMM Do H:mm'));
	            	$("#endTime").html(moment(event.end).format('ddd, MMM Do H:mm'));
	            	$("#eventInfo").html(event.description);
	            	$("#eventLink").attr('href', event.url);
								$("#eventContent").modal("open");
								console.log(event);
	        	});
	    	}
		});
	});
}

$(document).ready(function(){
	$("#eventContent").modal();
	$.ajaxSetup({ cache: false });
	var baseurl = window.location.href.split("#")[0];
	$("#cancelSearch").click(function(){
		$("#search").val("");
	});
	$("#searchForm").submit(function(e){
		e.preventDefault();
	});
	
	$.getJSON("/api/groups", function(data){
		var searchableList = {};
		for(var x=0;x<data.length;x++){
			searchableList[data[x]] = null;
		}
		$(window).on("hashchange", function(){
			if(window.location.hash.length > 1){
				var potentialItemId = window.location.hash.substring(1);
				if(data.indexOf(potentialItemId) > -1){
					loadItem(potentialItemId);
				}
			}
		});
		$('#search').autocomplete({
		    data: searchableList,
		    limit: 10, // The max amount of results that can be shown at once. Default: Infinity.
		    onAutocomplete: function(val) {
		      	window.location = baseurl + "#"+val;
		    },
		    minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
		});

		if(window.location.hash.length > 1){
			var potentialItemId = window.location.hash.substring(1);
			if(data.indexOf(potentialItemId) > -1){
				loadItem(potentialItemId);
			}
		}




		
	});
});