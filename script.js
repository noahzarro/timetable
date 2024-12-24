// Helper function to get URL parameters
function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Populate the timetable based on the API response
async function fetchTimetable() {
    const from = getURLParameter('from');
    const to = getURLParameter('to');
    const time = getURLParameter('time') || '04:00';

    // return the date in 12/31/2021 format
    const date = getURLParameter('date') || new Date().toLocaleDateString('de-CH').replaceAll('.', '/');


    if (!from || !to) {
        alert('Please provide both "from" and "to" URL parameters.');
        return;
    }

    const apiUrl = `https://search.ch/timetable/api/route.json?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&time=${encodeURIComponent(time)}&date=${encodeURIComponent(date)}&num=30&transportation_types=train`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch timetable: ${response.statusText}`);
        }

        const data = await response.json();
        populateTable(data);
    } catch (error) {
        console.error(error);
        alert('An error occurred while fetching the timetable.');
    }
}

// Populate the HTML table with timetable data
function populateTable(data) {
    const tableHeader = document.getElementById('header-row');
    const tableBody = document.getElementById('table-body');

    let csv = 'Haltestelle';

    // Add connection headers
    for (let i = 0; i < data.count; i++) {
        const th = document.createElement('th');
        th.textContent = `Verbindung`;
        tableHeader.appendChild(th);
        csv += `,Verbindung`;
    }

    csv += '\n';

    const rows = {};
    // Populate table rows based on connections and stops
    data.connections.forEach((connection, connectionIndex) => {
        connection.legs.forEach((leg, legIndex) => {
               
            const stopKey = leg.name || leg.exit.name;

            if (!rows[stopKey]) {
                rows[stopKey] = Array(data.count).fill('');
            }

            const relevantTime = legIndex === 0 ? leg.departure : leg.arrival;
            const time = new Date(relevantTime).toLocaleTimeString(["de-CH"], { hour: '2-digit', minute: '2-digit' });
            rows[stopKey][connectionIndex] = time;

            if(leg.stops != null) {
                leg.stops.forEach((stop, stopIndex) => {
                    if (!rows[stop.name]) {
                        rows[stop.name] = Array(data.count).fill('');
                    }
                    
                    const arrivalTime = new Date(stop.arrival).toLocaleTimeString(["de-CH"], { hour: '2-digit', minute: '2-digit' });
                    rows[stop.name][connectionIndex] = arrivalTime;
                });
            }
        });
    });

    // Add rows to the table and the csv
    for (const [station, times] of Object.entries(rows)) {
        const row = document.createElement('tr');
        const stationCell = document.createElement('td');
        stationCell.textContent = station;
        row.appendChild(stationCell);

        times.forEach(time => {
            const timeCell = document.createElement('td');
            timeCell.textContent = time;
            row.appendChild(timeCell);
        });

        tableBody.appendChild(row);
        csv += `${station},${times.join(',')}\n`;
    }

    // Add CSV download link
    const downloadButton = document.getElementById('download-csv');
    downloadButton.addEventListener('click', () => {
        downloadCSV(csv, 'timetable.csv');
    });
}

// Trigger CSV download
function downloadCSV(data, filename) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
fetchTimetable();
