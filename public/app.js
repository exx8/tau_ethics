//credit to SA
hashCode = function(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}
editMode=false;
function markerPicker(str)
{
  let dict={
    "מדרכה צרה":"image1.png",
    "עמוד":"image2.png",
    "עץ":"Tree-256x256.png",
    "בור":"image4.png",
    "מדרכה שבורה":"image6.png",
    "תחנת אוטובוס":"bus.webp",
    "ירידה לא בטוחה למעבר חצייה":"image8.png",
    "שירותי נכים": "image10.png",
    "חניית נכים":"image11.png",
  "חוף ים נגיש":"beach.svg",
    "ספסל נגיש":"image12.png"


  }
  let url="/img/"+dict[str.trim()];
  return new L.Icon({
    iconUrl: url,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });


}
const map = L.map('map').fitWorld();

if (true) {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '<a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  map.setZoom(19);
  map.panTo(new L.LatLng(32.070953, 34.763514));
} else {
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYaycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map);
}

// When set to true, the next map click will trigger dialog open for pin placement:
let pinInPlacement = false;
// Current pin coordinates, set by pressing the map
let currentPinCoords = null;
const ZOOM_TO_LOCATION = true;

// Example code to show how to get GPS location and place pin on map in that location
if (ZOOM_TO_LOCATION) {
  function onLocationFound(e) {
    let radius = e.accuracy  / 2 ;

    L.marker(e.latlng)
        .addTo(map)
        .on('dblclick')
        .bindPopup("You are within " + radius + " meters from this point")
        .openPopup();

    L.circle(e.latlng, radius).addTo(map);
  }

  function onLocationError(e) {
    console.log(e.message);
  }

  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
  map.locate({setView: true, maxZoom: 19});
}

// Map press event
map.on('mousedown touchstart', function onMouseDown(event) {
  if (pinInPlacement) {
    currentPinCoords = event.latlng;
    pinInPlacement = false;

    dialog.showModal();
  }
});

// Bottom-right button press event
function addPin() {
  pinInPlacement = true;

  const pinButton = document.getElementById('add-pin-button');
  pinButton.classList.add('add-pin-button--active');
}

// Register dialog
const dialog = document.querySelector('dialog');
if (!dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}

function addPointToMap(id, event, severity, coords) {

  const marker = L.marker(coords, {icon: markerPicker(event),id});
  function click_handler()
  {
    map.currentPinCoords=coords;
    dialog.showModal();


    const userEvent = document.getElementById("event");
    userEvent.value = event;
    const userSeverity = document.getElementById("severity");
    userSeverity.value=severity;
    map.removeLayer(marker);
    fetch(`/delete?id=${id}`, {
      method: 'GET'
    })
    currentPinCoords=coords;
    editMode=true;
  }
  marker.bindTooltip("<b>אירוע</b>:" + event + "<br/> <b>חומרה:</b>" + severity).on('click',click_handler).addTo(map);
}

// Dialog save
dialog.querySelector('#dialog-rate_save').addEventListener('click', function() {
  dialog.close();

  if (currentPinCoords) {

    const event = document.querySelector('#event').value;
    const severity = document.querySelector('#severity').value;
    const id = getRandomId();
    const data = {event, severity, coords: currentPinCoords};
    addPointToMap(id, event, severity, currentPinCoords);

    fetch(`/add_point?id=${id}&data=${JSON.stringify(data)}`, {
      method: 'GET'
    })
  }
  else
  {
    editMode=false;
    const event = document.querySelector('#event').value;
    const severity = document.querySelector('#severity').value;
    addPointToMap(id, event, severity, currentPinCoords);


  };


  deactivateAddPinButton();
});

// Dialog close (without saving)
dialog.querySelector('.close').addEventListener('click', function() {
  dialog.close();
  deactivateAddPinButton();
});

// Dialog helper method (i.e change button color)
function deactivateAddPinButton() {
  const pinButton = document.getElementById('add-pin-button');
  pinButton.classList.remove('a-pin-button--active');
}

// Load map:
fetch('/all_points', { method: 'GET' })
    .then(result => result.json())
    .then(data => {
          Object.keys(data).forEach(
              id => {
                const pointData = JSON.parse(data[id]);
                addPointToMap(id, pointData.event, pointData.severity, pointData.coords);
              }
          );
        }
    );

// Utils
function getRandomId() {
  return Math.random().toString().substr(2, 9);
};