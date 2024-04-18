//favourites page

//functions to set up and display saved routes from local storage
var items;

function make_list() {
    for (var i in items) {
        var value = items[i];
        console.log(value);
    }
};

function save_to_local_json() {
    var items_json = JSON.stringify(items);
    localStorage.setItem('items', items_json);
};


function read_from_local_json() {
    var items_json = localStorage.getItem('items');
    items = JSON.parse(items_json);

    // if the file is empty
    if (!items) {
        items = [];
    }
};

//run functions to load previously saved routes on startup
read_from_local_json();
make_list();

//function for saving a route
function saveRoute() {
    console.log(waypoints);
    console.log(waypoints[0]);
    console.log(waypoints[0].latLng);

    //convert waypoint string into array to gather waypoint coordinates
    let startName = waypoints[0].name;
    let arrayStart = startName.split(',');
    let endName = waypoints[1].name;
    let arrayEnd = endName.split(',');

    //assign variables of saved objects
    var start = {
        latitude: waypoints[0].latLng.lat,
        longitude: waypoints[0].latLng.lng,
    };
    var end = {
        latitude: waypoints[1].latLng.lat,
        longitude: waypoints[1].latLng.lng,
    };
    var name = arrayStart[0] + " to " + arrayEnd[0];
    var carbon = routeEmissions.textContent;
    console.log(carbon);
    var timeEst = routeTime.textContent;
    console.log(timeEst);
    var distance = routeDistance.textContent;
    console.log(distance);

    //add saved object to localstorage
    items.push({name, start, end, carbon, timeEst, distance});
    make_list();
    save_to_local_json();

    //update list on favourites page
    savedRoutes();
};

//get element to add list to
const saveOutput = document.getElementById('save-output');
let saveParse = null;
console.log(localStorage.items);

//if there are items in local storage, parse contents of storage and update list
if (localStorage.items != null){
    saveParse = JSON.parse(localStorage.items);
    savedRoutes();
}

//function to update saved route list
function savedRoutes(){
    //delete all list items
    while (saveOutput.hasChildNodes()) {
        saveOutput.removeChild(saveOutput.firstChild);
    }

    //update saveParse variable by parsing current localstorage
    saveParse = JSON.parse(localStorage.items);
    console.log(saveParse.length);
    let savedItems = saveParse.length;

    let deleted = null;

    //restore all list items with the exception of deleted route
    for (savedItems in saveParse){
        if (saveParse[savedItems] != null){
            const newItem = document.createElement('ion-item');
            newItem.setAttribute("button", "");
            newItem.setAttribute("detail", "false");
       
            console.log(saveParse[savedItems].name);
            console.log(savedItems);
            newItem.textContent = saveParse[savedItems].name + " | " + saveParse[savedItems].distance + " | " + saveParse[savedItems].carbon;
            newItem.id = savedItems;
            console.log(newItem + " " + newItem.id);
            newItem.setAttribute("onclick", "mapWaypoints(this.id)");
            saveOutput.appendChild(newItem);
        } /*else {
            break;
        }*/
    }
}

//initialise delete function, if user clicks delete button the next route they click on will be deleted
function deleteActivate(){
    let savedItems = saveParse.length;
    //replace onclick attributes of all list items to run deleteRoute() instead
    for (savedItems in saveParse){
        if (saveParse[savedItems] != null){
            console.log(saveParse[savedItems]);
            let route = document.getElementById(savedItems);

            console.log(route.id);
            let routeId = route.id;
            //remove existing onclick attribute to prevent accidental route search
            route.removeAttribute("onclick");
            //replace previous attribute so route is deleted on click
            route.setAttribute("onclick", "deleteRoute(" + routeId + ")");
            console.log(routeId);
        }
    }
}

//function to delete routes
function deleteRoute(id){
    console.log(id);

    let savedItems = saveParse.length + 1;
    
    //restore onclick attribute to default
    for (savedItems in saveParse){
        if (saveParse[savedItems] != null){
            console.log(savedItems);
            //remove existing onclick attribute to prevent accidental delete
            document.getElementById(savedItems).removeAttribute("onclick");
            //restore previous onclick attribute
            document.getElementById(savedItems).setAttribute("onclick", "mapWaypoints(" + saveOutput[savedItems] + ".id)");
        }
    }

    console.log(document.getElementById(id));
    console.log(saveParse);
    //delete chosen route data from local jsons
    delete saveParse[id];
    delete items[id];
    console.log(localStorage.items);
    console.log(saveParse);
    //convert json to string to update route list
    items_json = JSON.stringify(saveParse);

    console.log(saveParse[id]);

    //refresh localstorage
    for (savedItems in saveParse){
        //since deleted route is actually set to null, loop must skip deleted route's id
        if (savedItems != null && savedItems != undefined){
            console.log(saveParse[savedItems]);
            localStorage.setItem("items", items_json);
        }
    }

    console.log(saveParse);
    console.log(items);

    //update route list
    savedRoutes();
}

let waypoints = [];

///////////////////////////////////////////////////////////////////////////////////////

//map page

//integer variable to enable one-time function and a seperate reusable function
let list = 0;

//assign variables for different elements of map page
const mapNav = document.getElementById('map-nav');
const mapPage = document.getElementById('map-page');
const routeDistance = document.getElementById('route-distance');
const routeTime = document.getElementById('route-time');
const routeEmissions = document.getElementById('route-emissions');
const saveButton = document.getElementById('save-button');
mapNav.root = mapPage;

//resize map to counter ionic-leaflet issue
const resize = new ResizeObserver(() => {
    map.invalidateSize();
}, 12);
resize.observe(mapPage);

//create array to store car makes and add an event listener to run accessModels() if the value is changed
let makeArray = [];
let makeName = "";
let makeSelect = document.querySelector("#make-select");
makeSelect.addEventListener("ionChange", accessModels);

//create array to store car models from chosen make
let modelArray = [];
let modelName = "";
let modelSelect = document.querySelector("#model-select");
let modelOption = modelSelect.getElementsByTagName("ion-select-option");

//initialise leaflet map
var map = L.map('map').setView([57.119, -2.138], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//add geocoder to map to allow for address searching and path routing
L.Control.geocoder().addTo(map);

//add leaflet routing machine to leaflet map with null waypoints to allow automatic assignment of waypoints
var routeControl = L.Routing.control({
    waypoints: [null],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(map);

//gather route distance and estimated time to display
routeControl.on('routesfound', function(e) {
   var routes = e.routes;
   var summary = routes[0].summary;
   waypoints = e.waypoints || [];
   console.log(waypoints);
   emissionCalc(summary.totalDistance, summary.totalTime);
});

//function setting waypoints for map, runs upon click of any item in route list
function mapWaypoints(id){
    console.log(id);
    console.log(saveParse[id].start);
    console.log(saveParse[id].end);
    console.log(routeControl.waypoints);
    routeControl.setWaypoints([
        L.latLng(saveParse[id].start.latitude, saveParse[id].start.longitude),
        L.latLng(saveParse[id].end.latitude, saveParse[id].end.longitude)
    ]);
    console.log(routeControl);
}

//function to calculate carbon emissions using api
function emissionCalc(distance, time){
    //find id number of chosen vehicle
    let carModelId = modelArray.findIndex(modelId);
    console.log(modelArray);
    console.log(modelArray[carModelId].data.id + " | " + modelArray[carModelId].data.attributes.name + " | " + carModelId);
    //run api call to calculate carbon emission estimate using chosen vehicle and route distance
    const response = fetch("https://www.carboninterface.com/api/v1/estimates", {
        body: `{"type": "vehicle","distance_unit": "km","distance_value": ` + distance/1000 + `,"vehicle_model_id": "` + modelArray[carModelId].data.id + `"}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      })
    .then(getJson)
    .then(routeValues)
    .catch(reportError)
    
    //hide search boxes once call is complete
    routeControl.hide();

    console.log(response);
    console.log(response.data);

    console.log(time);

    //convert total seconds to hours and minutes
    let hours = Math.floor(time/60/60);
    console.log(hours);
    let minutes = Math.round(time/60-60*hours);
    console.log(minutes);

    routeTime.textContent = "Time: " + hours + "h " + minutes + "m";
    
}

//function to display route distance and carbon estimates below map
function routeValues(response){
    console.log(response.data.id);
    routeDistance.textContent = "Distance: " + response.data.attributes.distance_value + "km";
    routeEmissions.textContent = "Emissions: " + response.data.attributes.carbon_kg + "kg";
}

///////////////////////////////////////////////////////////////////////////////////////

//car select page

//function to clear ion-select element
function reset(){
    let loop = 0;
    while (loop < modelOption.length) {
        console.log(loop);
        console.log(modelOption[loop]);
        modelOption[loop].remove();
    }
}

//function to make api call to gather a list of car manufacturers
async function accessMakes(){
    console.log(makeSelect.value);
    console.log("makes");
    //if list = 0 then this is the first time this function has been run, if it is more than 0 that means this has been run before and should not run again
    if (list == 0){
        //make api call to gather a list of car manufacturers
        const response = await fetch("https://www.carboninterface.com/api/v1/vehicle_makes", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        })
        .then(getJson)
        .then(carMakeSelect)
        .catch(reportError)
        console.log(list);
    }
    console.log(list);
    //increment list variable by 1 to prevent running this function more than necessary
    list += 1;
    console.log("list = " + list);
};

//function to convert api call response into json format
async function getJson(aResponse){
    return aResponse.json();
};

//function to pair car makes with associated id numbers before adding them to ion-select
function carMakeSelect(jsonObj){

    makeArray = jsonObj;

    //create arrays for names and ids
    let makeNamesArray = [];
    let makeIdArray = [];

    //add names to name array and ids to id array
    for (let makeObject of makeArray){
        makeNamesArray.push(makeObject.data.attributes.name);
        makeIdArray.push(makeObject.data.id);
    }

    //run seperate function to properly pair names and ids
    buildSelectOptions(makeNamesArray, makeIdArray);
};

//function to determine whether to build make list or model list and iterate through array to run option build function
function buildSelectOptions(carArray, idArray){
    //clear ion-select element to prevent duplicate options
    reset();
    let arrayInt = 0;
    console.log("build " + list);
    if (list < 1){
        //only run if list variable is below 1
        console.log("if function");
        for (let makeName of carArray){;
            createSelectOption(makeName, idArray[arrayInt])
            arrayInt += 1;
        }
    } else if (list >= 2){
        //only run if list variable is greater than or equal to 2 (for some reason an earlier function was running twice so this was my work around)
        console.log("else function");
        for (let modelName of carArray){
            createSelectOption(modelName, idArray[arrayInt])
            arrayInt += 1;
        }
    }
    console.log(list);
};

//function to finally build the actual options
function createSelectOption(aName, anId){
    //set variable to create ion-select-option from
    const newItem = document.createElement('ion-select-option');
    //assign make/model name to value and textContent, assign make/model id to id
    newItem.value = aName;
    newItem.textContent = aName;
    newItem.id = anId;
    console.log(newItem);
  
    if (list < 1){
        //if list is less than 1, add the element to the car make select
        makeSelect.appendChild(newItem);
    } else if (list > 1){
        //if list is more than 1, add the element to the car model select
        modelSelect.appendChild(newItem);
    }
};

//function to run api call to gather list of models produced by chosen manufacturer
function accessModels(){
    console.log("models");
    //find index of chosen manufacturer in makeArray using associated id
    let chosenMake = makeArray.findIndex(makeId);

        //make api call to gather list of vehicle models produced by chosen manufacturer
        const response = fetch(`https://www.carboninterface.com/api/v1/vehicle_makes/${makeArray[chosenMake].data.id}/vehicle_models`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        })
        .then(getJson)
        .then(carModelSelect)
        .catch(reportError)

    console.log(response);
    console.log("test " + list);
    //reset counter for makeId()/modelId()
    counter = 0;
    list += 1;
    console.log("list = " + list);
};

//initialise counter for makeId()/modelId()
let counter = 0;

//function to find index of chosen manufacturer in makeArray
function makeId(){
    counter += 1;
    return makeArray[counter-1].data.attributes.name == makeSelect.value;
}

//function to find index of chosen model in modelArray
function modelId(counter){
    console.log(counter);
    console.log(counter.data.attributes.name);
    //i honestly don't know why counter is a json instead of an integer here but i don't have time to fix it
    idName = counter.data.attributes.name;
    console.log(idName);
    counter += 1;
    console.log(idName);
    return idName == modelSelect.value;
    
}

//function to pair car models with associated id numbers before adding them to ion-select
function carModelSelect(jsonObj){

    modelArray = jsonObj;
    console.log(modelArray);

    //create arrays for names and ids
    let modelNamesArray = [];
    let modelIdArray = [];

    console.log(modelNamesArray);
  
    //add names to name array and ids to id array
    for (let modelObject of modelArray){
        if (!modelNamesArray.find((element) => element == modelObject.data.attributes.name)){
            modelNamesArray.push(modelObject.data.attributes.name);
            modelIdArray.push(modelObject.data.id);
        }
    }

    console.log(modelNamesArray);
    console.log(modelIdArray);

    //run seperate function to properly pair names and ids
    buildSelectOptions(modelNamesArray, modelIdArray);
};

//function to report any errors that come up
function reportError(anError){
    console.log(anError);
}
