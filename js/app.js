// Each country COVID-19 cases
const urlCovidCases = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv";
const defaultLocation = "World";

let cachedData;
const selectElement = document.getElementById('location');
selectElement.onchange = function () {
    processData(cachedData)
};

const linearPlotDiv = document.getElementById("linearPlot");
const logPlotDiv = document.getElementById("logPlot");
const newPlotDiv = document.getElementById("newPlot");

const toggleSwitch = document.getElementById("checkbox");
toggleSwitch.addEventListener('change', switchTheme, false);

window.onload = loadData();


/**
 * Carga inicial de los datos.
 */
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
            alert("Information could be old, because we couldn't reach the server.")
            parseAndProcess(getData());
        });

}

/**
 * Parsea los datos y luego llama a que se muestren en pantalla
 * @param text el texto en formato CSV
 */
function parseAndProcess(text) {
    const data = Papa.parse(text, {
        header: true,
        complete: function (results) {
            cachedData = results.data;
            processData(results.data);
            populateSelect(results.data);
        }
    });
}

/**
 * Rellena el select con los diferentes paises para ver sus datos
 * @param la información ya parseada en un arreglo de objetos
 */
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

/**
 * Cambia el tema del sitio
 * @param e el switch que se presionó
 */
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

/**
 * Procesa la información para mostrarla en pantalla.
 * @param data la información en un arreglo de objetos
 */
function processData(data) {

    const currentLocation = getCurrentLocation();

    /* Filter data by country */
    const dataFiltered = data.filter(findByName, currentLocation);
    createPlots(dataFiltered);
    createTable(dataFiltered);
}

/**
 * Crea los gráficos a partir de la información que se le pasa
 * @param dataFiltered la información de un país dado
 */
function createPlots(dataFiltered) {
    let i;
    const dates = [];
    const totalCases = [];
    const newCases = [];
    const totalDeaths = [];
    const newDeaths = [];

    /* Me quedo unicamente con la informacíon que me interesa */
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

    /* Lleno los arreglos con la informacion para los plots del total*/
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

    /* Lleno los arreglos con la información para los plots de cada día*/
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
}

/**
 * Crea la tabla con la información que se le da
 * @param dataFiltered la información de un pais dado
 */
function createTable(dataFiltered) {
    let t = "";
    let tr;
    for (i = 0; i < dataFiltered.length; i++) {
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

    const dataTableBody = document.getElementById("dataTableBody");
    dataTableBody.innerText = "";
    dataTableBody.innerHTML += t;
}

/**
 * Obtiene el color de fuente y la ubicación actual
 * Se utiliza para actualizar el color de los graficos al cambiar de tema
 * @returns {{fontColor: string, currentLocation: *}}
 */
function layoutConstants() {
    const fontColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-color');
    const currentLocation = getCurrentLocation();
    return {fontColor, currentLocation};
}

/**
 * Devuelve el layout que para el gráfico, segun el layoutType que se pasa como parametro
 * @param layoutType el tipo de layout del gráfico (linear o logaritmico)
 * @param title el titulo del gráfico
 * @returns el objeto layout correspondiente
 */
function getLayout(layoutType, title) {
    const {fontColor, currentLocation} = layoutConstants();
    return {
        title: currentLocation + ": " + title,
        yaxis: {
            type: layoutType,
            autorange: true,
            showgrid: false,
            zeroline: false
        },
        xaxis: {
            showgrid: false,
            zeroline: false
        },
        'plot_bgcolor': 'rgba(0,0,0,0)',
        'paper_bgcolor': 'rgba(0,0,0,0)',
        'font': {
            'color': fontColor
        },
        legend: {
            x: 0,
            y: 1
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

/**
 * Devuelve la ubicación actual en de la que se quiere visualizar información
 * @returns el nombre de la ubicación
 */
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

/**
 * Devuelve todos los paises que se contienen en data
 * @param data la información parseada en un arreglo de objetos
 * @returns {Set<any>}
 */
function getCountries(data) {
    const resultSet = new Set();

    data.forEach((item) => {
        resultSet.add(item["location"]);
    });

    return resultSet;
}