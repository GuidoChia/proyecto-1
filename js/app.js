// Each country covid cases
const urlCovidCases = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv";
const defaultLocation = "Argentina";

var cachedData;
var selectElement = document.getElementById('location');

var linearPlotDiv = document.getElementById("linearPlot");
var logPlotDiv = document.getElementById("logPlot");
var newPlotDiv = document.getElementById("newPlot");

selectElement.onchange = function () { processData(cachedData) };

window.onload = loadData();

function loadData(){
    var data =Papa.parse(urlCovidCases, {
        download: true,
        header: true,
        complete: function (results) {
            console.log(results);
            processData(results.data);
            
            var countries = getCountries(results.data);

            /* Populate select with countries */
            countries.forEach((element) => {
                if (element != undefined) {
                    var opt = document.createElement("option");
                    opt.value = element;
                    opt.innerHTML = element;
                    selectElement.appendChild(opt);
                    if (element == defaultLocation) {
                        opt.selected = true;
                    }
                }
            })
            cachedData = results.data;
        }
    })
    
}

function processData(data) {
    var opt = selectElement.options[selectElement.selectedIndex];
    if (opt == undefined) {
        currentLocation = defaultLocation;
    } else {
        currentLocation = opt.value;
    }
    console.log(currentLocation);
       
    /* Filter data by country */
    var dataFiltered = data.filter(findByName, currentLocation);

    var dates = [];
    var totalCases = [];
    var newCases = [];
    var totalDeaths = [];
    var newDeaths = [];

    dataFiltered.forEach((element) => {
        if (element["total_cases"] != "0") {
            dates.push(element["date"]);
            totalCases.push(element["total_cases"]);
            newCases.push(element["new_cases"]);
            totalDeaths.push(element["total_deaths"]);
            newDeaths.push(element["new_deaths"]);
        }
    })

    var totalDataNames = ["Total cases", "Total deaths"];
    var totalData = [totalCases, totalDeaths];

    var totalPlots = [];

    for (i = 0; i < totalData.length; i++) {
        var casePlot = {
            x: dates,
            y: totalData[i],
            type: 'scatter',
            name: totalDataNames[i]
        };
        totalPlots.push(casePlot);
    }

    var layoutLinear = { title: currentLocation + ": linear scale"}

    var layoutLog = {
        title: currentLocation+": logarithmic scale",
        yaxis: {
            type: 'log',
            autorange: true
        }
    }

    var newDataNames = ["New cases", "New deaths"];
    var newData = [newCases, newDeaths];

    var newPlots = [];
    for (i = 0; i < newData.length; i++) {
        var casePlot = {
            x: dates,
            y: newData[i],
            type: 'bar',
            name: newDataNames[i]
        };
        newPlots.push(casePlot);
    }

    var layoutLinear = { title: currentLocation + ": linear scale" };

    var layoutNew = { title: currentLocation + ": daily data" };

    Plotly.newPlot(linearPlotDiv, totalPlots, layoutLinear, { displayModeBar: false });
    Plotly.newPlot(logPlotDiv, totalPlots, layoutLog, { displayModeBar: false });
    Plotly.newPlot(newPlotDiv, newPlots, layoutNew, { displayModeBar: false });

    console.log(dataFiltered);
    var dataTable = document.getElementById("dataTable");
    dataTable.innerHTML = "";

    var t = "";
    var tr = "<tr>";
    tr += "<th> Date </th>";
    tr += "<th> Total cases </th>";
    tr += "<th> New cases </th>";
    tr += "<th> Total deaths </th > ";
    tr += "<th> New deaths </th > ";
    tr += "</tr>";
    t += tr;
    for (var i = 0; i < dataFiltered.length; i++) {
        if (dataFiltered[i].total_cases != "0") {
            var tr = "<tr>";
            tr += "<td>" + dataFiltered[i].date + "</td>";
            tr += "<td>" + dataFiltered[i].total_cases + "</td>";
            tr += "<td>" + dataFiltered[i].new_cases + "</td>";
            tr += "<td>" + dataFiltered[i].total_deaths + "</td>";
            tr += "<td>" + dataFiltered[i].new_deaths + "</td>";
            tr += "</tr>";
            t += tr;
        }
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