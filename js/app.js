// Each country COVID-19 cases
const urlCovidCases = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv";
const defaultLocation = "Argentina";

let cachedData;
const selectElement = document.getElementById('location');

const linearPlotDiv = document.getElementById("linearPlot");
const logPlotDiv = document.getElementById("logPlot");
const newPlotDiv = document.getElementById("newPlot");

selectElement.onchange = function () {
    processData(cachedData)
};

window.onload = loadData();

function loadData() {
    const data = Papa.parse(urlCovidCases, {
        download: true,
        header: true,
        complete: function (results) {
            console.log(results);
            processData(results.data);

            const countries = getCountries(results.data);

            /* Populate select with countries */
            countries.forEach((element) => {
                if (element !== undefined) {
                    const opt = document.createElement("option");
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
    });

}

function processData(data) {
    const opt = selectElement.options[selectElement.selectedIndex];
    let currentLocation;
    if (opt == undefined) {
        currentLocation = defaultLocation;
    } else {
        currentLocation = opt.value;
    }
    console.log(currentLocation);

    /* Filter data by country */
    const dataFiltered = data.filter(findByName, currentLocation);

    const dates = [];
    const totalCases = [];
    const newCases = [];
    const totalDeaths = [];
    const newDeaths = [];

    dataFiltered.forEach((element) => {
        if (element["total_cases"] != "0") {
            dates.push(element["date"]);
            totalCases.push(element["total_cases"]);
            newCases.push(element["new_cases"]);
            totalDeaths.push(element["total_deaths"]);
            newDeaths.push(element["new_deaths"]);
        }
    })

    const totalDataNames = ["Total cases", "Total deaths"];
    const totalData = [totalCases, totalDeaths];

    const totalPlots = [];

    for (i = 0; i < totalData.length; i++) {
        casePlot = {
            x: dates,
            y: totalData[i],
            type: 'scatter',
            name: totalDataNames[i]
        };
        totalPlots.push(casePlot);
    }

    const layoutLog = {
        title: currentLocation + ": logarithmic scale",
        yxis: {
            type: 'log',
            autorange: true
        }
    };

    const newDataNames = ["New cases", "New deaths"];
    const newData = [newCases, newDeaths];

    const newPlots = [];
    var casePlot;
    for (i = 0; i < newData.length; i++) {
        casePlot = {
            x: dates,
            y: newData[i],
            type: 'bar',
            name: newDataNames[i]
        };
        newPlots.push(casePlot);
    }

    const layoutLinear = {title: currentLocation + ": linear scale"};

    const layoutNew = {title: currentLocation + ": daily data"};

    Plotly.newPlot(linearPlotDiv, totalPlots, layoutLinear, {displayModeBar: false});
    Plotly.newPlot(logPlotDiv, totalPlots, layoutLog, {displayModeBar: false});
    Plotly.newPlot(newPlotDiv, newPlots, layoutNew, {displayModeBar: false});

    console.log(dataFiltered);
    const dataTable = document.getElementById("dataTable");

    dataTable.innerHTML = "";

    let t = "";
    let tr = "<tr>";
    tr += "<th> Date </th>";
    tr += "<th> Total cases </th>";
    tr += "<th> New cases </th>";
    tr += "<th> Total deaths </th > ";
    tr += "<th> New deaths </th > ";
    tr += "</tr>";
    t += "<thead>" + tr + "</thead>";
    t += "<tbody>"
    for (var i = 0; i < dataFiltered.length; i++) {
        if (dataFiltered[i].total_cases != "0") {
            tr = "<tr>";
            tr += "<td>" + dataFiltered[i].date + "</td>";
            tr += "<td>" + dataFiltered[i].total_cases + "</td>";
            tr += "<td>" + dataFiltered[i].new_cases + "</td>";
            tr += "<td>" + dataFiltered[i].total_deaths + "</td>";
            tr += "<td>" + dataFiltered[i].new_deaths + "</td>";
            tr += "</tr>";
            t += tr;
        }
    }
    t += "</tbody>";
    dataTable.innerHTML += t;
}


function findByName(dataRow) {
    return dataRow["location"] == this;
}

function getCountries(data) {
    const resultSet = new Set();

    data.forEach((item) => {
        resultSet.add(item["location"]);
    });

    return resultSet;
}