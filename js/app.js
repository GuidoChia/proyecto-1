// Each country covid cases
const urlCovidCases = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv";
var cachedData;
var selectElement = document.getElementById('location');

selectElement.onchange = function () { processData(cachedData) };

window.onload = loadData();

function loadData(){
    var data =Papa.parse(urlCovidCases, {
        download: true,
        header: true,
        complete: function (results) {
            console.log(results);
            processData(results.data);
            cachedData = results.data;
        }
    })
    
}

function processData(data) {
    var opt = selectElement.options[selectElement.selectedIndex];
    if (opt == undefined) {
        currentLocation = "Argentina"
    } else {
        currentLocation = opt.value;
    }
    console.log(currentLocation);

    

    var countries = getCountries(data);

    /* Populate select with countries */
    countries.forEach((element) => {
        if (element != undefined) {
            var opt = document.createElement("option");
            opt.value = element;
            opt.innerHTML = element;
            selectElement.appendChild(opt);
        }
    })
       

    var plotDiv = document.getElementById("plot");

    /* Filter data by country */
    var dataFiltered = data.filter(findByName, currentLocation);

    var dates = [];
    var cases = [];

    dataFiltered.forEach((element) => {
        dates.push(element["date"]);
        cases.push(element["total_cases"]);
    })

    var countryPlot = {
        x: dates,
        y: cases,
        type: 'scatter',
        name: currentLocation
    };

    Plotly.newPlot(plotDiv, [countryPlot], undefined, { displayModeBar: false });

    console.log(dataFiltered);
    var dataTable = document.getElementById("dataTable");
    dataTable.innerHTML = "";

    var t = "";
    var tr = "<tr>";
    tr += "<td> Date </td>";
    tr += "<td> Total cases </td>";
    tr += "<td> New cases </td>";
    tr += "<td> Total deaths </td>";
    tr += "</tr>";
    t += tr;
    for (var i = 0; i < dataFiltered.length; i++) {
        var tr = "<tr>";
        tr += "<td>" + dataFiltered[i].date + "</td>";
        tr += "<td>" + dataFiltered[i].total_cases + "</td>";
        tr += "<td>" + dataFiltered[i].new_cases + "</td>";
        tr += "<td>" + dataFiltered[i].total_deaths + "</td>";
        tr += "</tr>";
        t += tr;
    }
    dataTable.innerHTML += t;
} 


function findByName(dataRow) {
    return dataRow["location"] == this;
}

function getCountries(data) {
    var resultSet = new Set();

    data.forEach((item)=>{ resultSet.add(item["location"]); });

    return resultSet;
}