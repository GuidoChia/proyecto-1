// Each country COVID-19 cases
const urlCovidCases = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv";
const defaultLocation = "World";

let cachedData;
const selectElement = document.getElementById('location');

const linearPlotDiv = document.getElementById("linearPlot");
const logPlotDiv = document.getElementById("logPlot");
const newPlotDiv = document.getElementById("newPlot");

const toggleSwitch = document.getElementById("checkbox");
toggleSwitch.addEventListener('change', switchTheme, false);

selectElement.onchange = function () {
    processData(cachedData)
};

window.onload = loadData();

function loadData() {
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    }

    fetch(urlCovidCases)
        .then((response) => response.text()).then(text => parseAndProcess(text))
        .catch((error) => {
            console.error(error);
            alert("Information could be old, beacause we couldn't reach the server.")
            parseAndProcess(getData());
        });

}

function parseAndProcess(text, download) {
    const data = Papa.parse(text, {
        header: true,
        complete: function (results) {
            cachedData = results.data;
            processData(results.data);
            populateSelect(results.data);
        }
    });
}




function populateSelect(data) {
    const countries = getCountries(data);

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
}

function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }

    Plotly.relayout(linearPlotDiv, getLinearLayout());
    Plotly.relayout(logPlotDiv, getLogLayout());
    Plotly.relayout(newPlotDiv, getNewLayout());
}

function processData(data) {
    const currentLocation = getCurrentLocation();

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

    const layoutLog = getLogLayout();

    const layoutLinear = getLinearLayout();

    const layoutNew = getNewLayout();

    Plotly.newPlot(linearPlotDiv, totalPlots, layoutLinear, {displayModeBar: false, responsive: true});
    Plotly.newPlot(logPlotDiv, totalPlots, layoutLog, {displayModeBar: false, responsive: true});
    Plotly.newPlot(newPlotDiv, newPlots, layoutNew, {displayModeBar: false, responsive: true});

    let t = "<tbody>"
    let tr;
    for (var i = 0; i < dataFiltered.length; i++) {
        if (dataFiltered[i].total_cases != "0") {
            tr = "<tr>";
            tr += "<td> " + dataFiltered[i].date + "</td>";
            tr += "<td>" + dataFiltered[i].total_cases + "</td>";
            tr += "<td>" + dataFiltered[i].new_cases + "</td>";
            tr += "<td>" + dataFiltered[i].total_deaths + "</td>";
            tr += "<td>" + dataFiltered[i].new_deaths + "</td>";
            tr += "</tr>";
            t += tr;
        }
    }
    t += "</tbody>";
    const dataTable = document.getElementById("dataTable");
    dataTable.innerHTML += t;
}

function layoutConstants() {
    const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-color');
    const fontColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-color');
    const currentLocation = getCurrentLocation();
    return {bgColor, fontColor, currentLocation};
}

function getLayout(layoutType, title){
    const {bgColor, fontColor, currentLocation} = layoutConstants();
    return {
        title: currentLocation +": "+title,
        yaxis: {
            type: layoutType,
            autorange: true
        },
        'plot_bgcolor': bgColor,
        'paper_bgcolor': bgColor,
        'font': {
            'color': fontColor
        },
        legend:{
            x:0,
            y:1
        }
    }
}


function getLogLayout() {
    return getLayout("log", "logarithmic scale")
}

function getLinearLayout() {
    return getLayout("linear", "linear scale")
}

function getNewLayout() {
    return getLayout("linear", "daily data")
}

function getCurrentLocation() {
    const opt = selectElement.options[selectElement.selectedIndex];
    let currentLocation;
    if (opt == undefined) {
        currentLocation = defaultLocation;
    } else {
        currentLocation = opt.value;
    }
    return currentLocation;
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