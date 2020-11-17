//credit to SA
hashCode = function(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}
function markerPicker(str)
{
  let hash=hashCode(str)%9;
  let colorArr=["blue","gold","red","green","orange","yellow","violet","grey","black"];
  let url="/img/marker-icon-"+colorArr[hash]+".png";
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
  map.setZoom(12);
  map.panTo(new L.LatLng(32.070953, 34.763514));
} else {
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
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
const ZOOM_TO_LOCATION = false;

// Example code to show how to get GPS location and place pin on map in that location
if (ZOOM_TO_LOCATION) {
  function onLocationFound(e) {
    let radius = e.accuracy  / 2 ;

    L.marker(e.latlng)
        .addTo(map)
        .on('dblclick', onDoubleClick)
        .bindPopup("You are within " + radius + " meters from this point")
        .openPopup();

    L.circle(e.latlng, radius).addTo(map);
  }

  function onLocationError(e) {
    console.log(e.message);
  }

  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
  map.locate({setView: true, maxZoom: 16});
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

// Dialog save
dialog.querySelector('#dialog-rate_save').addEventListener('click', function() {
  dialog.close();

  if (currentPinCoords) {

    const type = document.querySelector('#type').value;
    const description = document.querySelector('#description').value;
    const id = getRandomId();
    const data = { type, description, coords: currentPinCoords };
    L.marker(currentPinCoords,{icon:markerPicker(type)}).addTo(map);

    fetch(`/add_point?id=${id}&data=${JSON.stringify(data)}`, {
      method: 'GET'
    });
  }

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
        L.marker(pointData.coords).addTo(map);
      }
    );
  }
);

// Utils
function getRandomId() {
  return Math.random().toString().substr(2, 9);
};
