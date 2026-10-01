// Initialize Map centered at Chaubiskothi, Bharatpur, Chitwan
const map = L.map('map').setView([27.6814, 84.4304], 13);

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Custom Bus Marker
const busIcon = L.divIcon({
    html: '<div class="bus-marker">🚌</div>',
    className: 'bus-icon-container',
    iconSize: [30, 30]
});

let busMarker = L.marker([27.6814, 84.4304], { icon: busIcon }).addTo(map);

// Poll Python FastAPI Backend for Live Coordinates along Narayangarh-Tandi Route
async function fetchBusTelemetry() {
    try {
        const res = await fetch('http://localhost:8000/api/bus-location');
        const data = await res.json();

        // Animate marker to new GPS location
        busMarker.setLatLng([data.latitude, data.longitude]);
        map.panTo([data.latitude, data.longitude]);

        // Update UI Panel
        document.getElementById('next-stop').innerText = data.next_stop;
        document.getElementById('crowd-level').innerText = data.telemetry.crowd_level;
        document.getElementById('passenger-count').innerText = data.telemetry.estimated_passengers;
        document.getElementById('seats-status').innerText = data.telemetry.available_seats;
        document.getElementById('access-flag').innerText = data.telemetry.accessibility_flag ? "⚠️ Assistance Required" : "Normal";
        document.getElementById('ai-summary').innerText = data.telemetry.status_summary;
    } catch (err) {
        console.error("Backend connection error:", err);
    }
}

// Upload Bus Door/Stop Photo to Gemini 2.5 Flash
async function uploadImage() {
    const fileInput = document.getElementById('imageInput');
    if (fileInput.files.length === 0) {
        alert('Please select a photo first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    document.getElementById('ai-summary').innerText = "Analyzing frame with Gemini...";

    try {
        await fetch('http://localhost:8000/api/analyze-crowd', {
            method: 'POST',
            body: formData
        });
        fetchBusTelemetry();
    } catch (err) {
        alert('Image analysis failed. Make sure Python backend is running.');
    }
}

// Attach click listener and set polling timer to 3 seconds
document.getElementById('uploadBtn').addEventListener('click', uploadImage);
setInterval(fetchBusTelemetry, 3000);
fetchBusTelemetry();