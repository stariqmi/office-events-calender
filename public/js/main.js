var map
var allEvents
var events
var geocoder
var markers = []
var eventContainer = document.getElementById('event')
var eventSubject = document.getElementById('event-subject')
var eventDetails = document.getElementById('event-details')
var eventDateTime = document.getElementById('event-date-time')
var eventAddress = document.getElementById('event-address')
var startDate = document.getElementById('start-date')
var endDate = document.getElementById('end-date')
var startDateTimeStamp = null
var endDateTimeStamp = null

document.getElementById('close-event').onclick = function() {
	eventContainer.style.display = 'none';
}

// Init datepickers
$(startDate).pickadate({
	selectMonths: true, // Creates a dropdown to control month
	selectYears: 15, // Creates a dropdown of 15 years to control year,
	today: 'Today',
	clear: 'Clear',
	close: 'Ok',
	closeOnSelect: false, // Close upon selecting a date,
	onSet: function(unixTimestamp) {
		clearMarkers()
		startDateTimeStamp = unixTimestamp.select
		filterEvents(unixTimestamp.select)
		createEventMarkers(events, geocoder, map)
	}
});

$(endDate).pickadate({
	selectMonths: true, // Creates a dropdown to control month
	selectYears: 15, // Creates a dropdown of 15 years to control year,
	today: 'Today',
	clear: 'Clear',
	close: 'Ok',
	closeOnSelect: false, // Close upon selecting a date,
	onSet: function(unixTimestamp) {
		clearMarkers()
		endDateTimeStamp = unixTimestamp.select
		filterEvents(unixTimestamp.select)
		createEventMarkers(events, geocoder, map)
	}
});

function filterEvents() {
	var startDateMoment = moment(startDateTimeStamp)
	var endDateMoment = moment(endDateTimeStamp)
	events = []


	for (var i = 0; i < allEvents.length; i++) {
		var eventMoment = moment(allEvents[i].start.dateTime)
		var isAfterStart = eventMoment.isSameOrAfter(startDateMoment)
		var isBeforeEnd = eventMoment.isSameOrBefore(endDateMoment)
		if (isAfterStart && isBeforeEnd) events.push(allEvents[i])
	}

	return events
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: -34.397, lng: 150.644},
	  zoom: 8
	});

	geocoder = new google.maps.Geocoder();

	superagent.get('/events')
		.end(function(err, res) {
			allEvents = res.body.events || []
			events = allEvents
			createEventMarkers(events, geocoder, map)
		})
}

function createEventMarkers(events, geocoder, map) {
	for (var i = 0; i < events.length; i++) {
		(function mapEvent(evt) {
			var location = evt.location.address;
			if (Object.keys(location).length > 0) {
				var address = location.street + ', ' + location.city + ', ' + location.state + ', ' + location.postalCode + ', ' + location.countryOrRegion
				geocoder.geocode({'address': address}, function(results, status) {
		          	if (status === 'OK') {
		            	map.setCenter(results[0].geometry.location);
		            	var marker = new google.maps.Marker({
		              		map: map,
		              		position: results[0].geometry.location
		            	});

		            	markers.push(marker)
		            	initMarkerClick(marker, evt, results[0].formatted_address)

		          	} else {
		            	console.log('Geocode was not successful for the following reason: ' + status);
		          	}
		        });
		        
			}
		})(events[i])
	}
}

function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null)
	}

	markers = []
}

function initMarkerClick(marker, event, googleAddress) {
	marker.addListener('click', function() {
      	map.setZoom(8);
      	map.setCenter(marker.getPosition());

      	eventSubject.innerHTML = event.subject;
      	eventAddress.innerHTML = '<p>' + googleAddress + '</p>';
      	eventDetails.innerHTML = event.body.content;
      	eventDateTime.innerHTML = event.start.dateTime;
      	eventContainer.style.display = 'block';
    });
}