//credit to SA
hashCode = function (s) {
    return s.split("").reduce(function (a, b) {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a
    }, 0);
}
editMode = false;

function markerPicker(str) {
    let dict = {
        "מדרכה צרה": "image1.png",
        "עמוד": "image2.png",
        "עץ": "Tree-256x256.png",
        "בור": "image4.png",
        "מדרכה שבורה": "image6.png",
        "תחנת אוטובוס": "bus.webp",
        "ירידה לא בטוחה למעבר חצייה": "image8.png",
        "שירותי נכים": "image10.png",
        "חניית נכים": "image11.png",
        "חוף ים נגיש": "beach.png",
        "ספסל נגיש": "image12.png",
        "מכשול כללי": "danger.webp"


    }
    let url = "/img/" + dict[str.trim()];
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


let locationMarker;
let locationRadius;

if (ZOOM_TO_LOCATION) {
    function onLocationFound(e) {
        let radius = e.accuracy / 2;
        if (locationMarker) {
            map.removeLayer(locationMarker);
        }
        if (locationRadius) {
            map.removeLayer(locationRadius);
        }
        locationMarker = L.marker(e.latlng).addTo(map);
        locationRadius = L.circle(e.latlng, radius).addTo(map);
    }

    function onLocationError(e) {
        console.log(e.message);
    }

    function onLocationUpdateFound(e) {
        const latlng = L.latLng(e.coords.latitude, e.coords.longitude);
        locationMarker.setLatLng(latlng);
        locationRadius.setLatLng(latlng);
    }

    function onLocationUpdateError(e) {
        console.log(e.message);
    }

    var G_options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000
    };

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    map.locate({setView: true, maxZoom: 19});
    navigator.geolocation.watchPosition(onLocationUpdateFound, onLocationUpdateError, G_options);
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

    const marker = L.marker(coords, {icon: markerPicker(event), id});

    function click_handler() {
        map.currentPinCoords = coords;
        dialog.showModal();


        const userEvent = document.getElementById("event");
        userEvent.value = event;
        const userSeverity = document.getElementById("severity");
        userSeverity.value = severity;
        map.removeLayer(marker);
        fetch(`/delete?id=${id}`, {
            method: 'GET'
        })
        currentPinCoords = coords;
        editMode = true;
    }

    let severityOutput = severity ? "<b>חומרה:</b>" + severity : "";
    marker.bindTooltip("<b>אירוע</b>:" + event + "<br/> " + severityOutput).on('click', click_handler).addTo(map);
}

// Dialog save
dialog.querySelector('#dialog-rate_save').addEventListener('click', function () {
    dialog.close();

    const severityDom = document.querySelector('#severity');
    if (currentPinCoords) {

        const event = document.querySelector('#event').value;
        const id = getRandomId();
        let data;

        if (severityDom.disabled) {
            data = {event, coords: currentPinCoords};
            severityOutput = null;
        } else {
            severityOutput = severityDom.value;
            data = {event, severity: severityOutput, coords: currentPinCoords};

        }
        addPointToMap(id, event, severityOutput, currentPinCoords);

        fetch(`/add_point?id=${id}&data=${JSON.stringify(data)}`, {
            method: 'GET'
        })
    } else {
        editMode = false;
        const event = document.querySelector('#event').value;
        const severity = severityDom.value;
        addPointToMap(id, event, severity, currentPinCoords);


    }
    ;


    deactivateAddPinButton();
});

// Dialog close (without saving)
dialog.querySelector('.Delete').addEventListener('click', function () {
    dialog.close();
    deactivateAddPinButton();
});

// Dialog helper method (i.e change button color)
function deactivateAddPinButton() {
    const pinButton = document.getElementById('add-pin-button');
    pinButton.classList.remove('a-pin-button--active');
}

// Load map:
fetch('/all_points', {method: 'GET'})
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

function eventSelected() {
    var severity = document.getElementById("severity");
    var e = document.getElementById("event");
    var strUser = e.options[e.selectedIndex].text;

    if (["שירותי נכים", "חוף ים נגיש", "ספסל נגיש", "חניית נכים"].includes(strUser))
        severity.setAttribute("disabled", "disabled");
    else
        severity.removeAttribute("disabled");
}

// Utils
function getRandomId() {
    return Math.random().toString().substr(2, 9);
};

function showAboutUs() {
    document.getElementById("about-us").showModal();
}

function hideAboutUs() {
    document.getElementById("about-us").close();

}
