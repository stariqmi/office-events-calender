var map;
var eventContainer = document.getElementById('event')
var eventDetails = document.getElementById('event-details')
var eventAddress = document.getElementById('event-address')
document.getElementById('close-event').onclick = function() {
	eventContainer.style.display = 'none';
}

function initMarkerClick(marker, event, googleAddress) {
	marker.addListener('click', function() {
      	map.setZoom(8);
      	map.setCenter(marker.getPosition());

      	eventAddress.innerHTML = '<p>' + googleAddress + '</p>'
      	eventDetails.innerHTML = event.body.content;
      	eventContainer.style.display = 'block';
    });
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: -34.397, lng: 150.644},
	  zoom: 8
	});

	var geocoder = new google.maps.Geocoder();

	superagent.get('/events')
		.end(function(err, res) {
			var events = res.body.events || []
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

				            	initMarkerClick(marker, evt, results[0].formatted_address)

				          	} else {
				            	console.log('Geocode was not successful for the following reason: ' + status);
				          	}
				        });
				        
					}
				})(events[i])
			}
		})
}