$(window).on('load', function () {
	if ($('#preloader').length) {
	$('#preloader').delay(1000).fadeOut('slow', function () {
	$(this).remove();
	});
	}
	});
// ---------------------------------------------------------
// GLOBAL DECLARATIONS
// ---------------------------------------------------------

var map;
var countryCode;
var countryBorder;
var currencyIso = null;

// tile layers

var streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
}
);

var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
}
);

var basemaps = {
  "Streets": streets,
  "Satellite": satellite
};

var cityMap = L.markerClusterGroup();
var airportsMap = L.markerClusterGroup();
var earthquakeMap = L.markerClusterGroup();

var overlayMaps = {
  "Cities": cityMap,
  "Airports": airportsMap,
  "Earthquakes": earthquakeMap
};
var airportIcon = L.icon({
  iconUrl: 'icons/airport.png',
  iconSize: [50, 50],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

var earthquakesIcon = L.icon({
  iconUrl: 'icons/earthquake.png',
  iconSize: [50, 50],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

var cityIcon = L.divIcon({
  html: '<span class="fa-stack fa-2x"><i class="fa-solid fa-location-pin fa-stack-2x"></i><i class="fa-solid fa-building fa-stack-1x fa-inverse"></i></span>',
  className: 'myDivIcon'
});

// ---------------------------------------------------------
// EVENT HANDLERS
// ---------------------------------------------------------


function populateList() {

  $.ajax({
    url: "php/getCountryList.php",
    type: 'POST',
    dataType: 'json',

    success: function (result) {
      console.log(JSON.stringify(result));
      if (result.status.name == "ok") {
        $.each(result.data, function (index) {
          $('#countrySelect').append($("<option>", {
            value: result.data[index].iso_a2,
            text: result.data[index].name
          }));
        });
      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Populate List Error', textStatus, errorThrown);

    }
  });

}

async function getCountry() {
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });


      let latitude = position.coords.latitude;
      let longitude = position.coords.longitude;


      countryCode = await new Promise((resolve, reject) => {
        $.ajax({
          url: "php/getCountryCode.php",
          type: 'POST',
          dataType: 'json',
          data: {
            lat: latitude,
            lng: longitude
          },
          success: function (result) {

            console.log(JSON.stringify(result));

            if (result.status.name == "ok") {

              resolve(result.data.country);

            }

          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.log('Country Code error', textStatus, errorThrown);

          }
        })

      });

      //Location
      $('#countrySelect').val(countryCode);
      countryName = $('#countrySelect').find(':selected').text();

      getBorders(countryCode);
      getInfo(countryCode);
      getNews(countryCode);
      getWeather(latitude, longitude);
      getWikipedia(latitude, longitude);
      countryFlag(countryCode);
      getCities(countryCode);
      getCurrencyInfo(countryName);
      getAirports(countryCode);




      //Change country
      $('#countrySelect').change(function () {
        countryCode = $('#countrySelect').val();
        countryName = $('#countrySelect').find(':selected').text();
        getBorders(countryCode);
        getInfo(countryCode);
        getNews(countryCode);
        countryFlag(countryCode);
        getCoordinates(countryName);
        getCities(countryCode);
        getCurrencyInfo(countryName);
        getAirports(countryCode);


      })


      return { countryCode };


    }
    catch (error) {
      console.error("Error getting location:", error);
      throw error;
    }
  }
}


//get borders

function getBorders(countryCode) {
  if (countryBorder) {
    map.removeLayer(countryBorder);
  }
  $.ajax({
    url: "php/getBorders.php",
    type: 'GET',
    dataType: 'json',
    data: {
      iso_a2: countryCode

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {

        countryBorder = L.geoJSON(result.data, {
          style: {
            color: 'green',
            weight: 1,
          },

        }).addTo(map);
        map.fitBounds(countryBorder.getBounds());

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Selecting borders error', textStatus, errorThrown);

    }
  });

}

//Info
function getInfo(countryCode) {


  $.ajax({
    url: "php/getCountryInfo.php",
    type: 'POST',
    dataType: 'json',
    data: {
      country: countryCode

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {

        $('#txtCountry').html(result['data'][0]['countryName']);
        $('#txtContinent').html(result['data'][0]['continent']);
        $('#txtCapital').html(result['data'][0]['capital']);
        $('#txtLanguages').html(result['data'][0]['languages']);
        $('#txtPopulation').html(numberWithCommas(Math.round(result['data'][0]['population'])));
        $('#txtArea').html(numberWithCommas(Math.round(result['data'][0]['areaInSqKm'])));
        var north =result['data'][0]['north'];
        var south=result['data'][0]['south'];
        var east=result['data'][0]['east'];
        var west=result['data'][0]['west'];
        getEarthquakes(north,south,east,west);

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Country Information error', textStatus, errorThrown);

    }
  });
}
//get Flags
function countryFlag(countryCode) {
  var flag = document.getElementById("imgFlag");
  flag.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
}

//get Weather
function getWeather(latitude, longitude) {
  $.ajax({
    url: "php/getWeather.php",
    type: 'POST',
    dataType: 'json',
    data: {
      lat: latitude,
      lon: longitude

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {


        //Today
        $('#txtCurrentWeather').html(`<strong>${result['data'][0]['weather'][0]['description']}</strong>`);
        $('#imgIcon').attr("src", `http://openweathermap.org/img/w/${result['data'][0]['weather'][0].icon}.png`);
        $('#tMax').html(Math.round(result['data'][0]['main']['temp_max'] - 273.15) + "°C");
        $('#tMin').html(Math.round(result['data'][0]['main']['temp_min'] - 273.15) + "°C");
        //Next Day
        $('#nextDayIcon').attr("src", `http://openweathermap.org/img/w/${result['data'][8]['weather'][0].icon}.png`);
        $('#nextDayMaxTemp').html(Math.round(result['data'][8]['main']['temp_max'] - 273.15));
        $('#nextDayMinTemp').html(Math.round(result['data'][8]['main']['temp_min'] - 273.15));
        //Day After
        $('#dayAfterIcon').attr("src", `http://openweathermap.org/img/w/${result['data'][16]['weather'][0].icon}.png`);
        $('#dayAfterMaxTemp').html(Math.round(result['data'][16]['main']['temp_max'] - 273.15));
        $('#dayAfterMinTemp').html(Math.round(result['data'][16]['main']['temp_min'] - 273.15));


      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Weather error', textStatus, errorThrown);

    }
  });
}
//get News
function getNews(countryCode) {

  $('#txtNews').empty();

  $.ajax({
    url: "php/getNews.php",
    type: 'POST',
    dataType: 'json',
    data: {
      country: countryCode.toLowerCase()

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {
        
        if(result.data == 0){
          $('#txtNews').append("<p>", '<strong>Now news for this country, sorry!</strong>')
          
         }else{

        $.each(result.data, function (index) {
          $('#txtNews').append("<div>", `<table class="table table-striped">
          <tbody>
           <tr>
           
            <td><a href="${result.data[index].url}" target="_blank">${result.data[index].title}</a></td>
           </tr>
           </tbody>
           </table>`)

        
        
        })
         }
      }


    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('News error', textStatus, errorThrown);

    }
  });
}
//get cities
function getCities(countryCode) {

  $.ajax({
    url: "php/getCities.php",
    type: 'POST',
    dataType: 'json',
    data: {
      country: countryCode

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {
        cityMap.clearLayers();
        for (let i = 0; i < result.data.length; i++) {
          const cityName = result.data[i].name;
          let cityLat = result.data[i].lat;
          let cityLon = result.data[i].lng;

          L.marker([cityLat, cityLon], { icon: cityIcon })
            .bindTooltip("<div class='col text-center'><strong>" + cityName + "</strong><br><i></i></div>", { direction: 'top', sticky: true })
            .addTo(cityMap);
        }

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Location cities error', textStatus, errorThrown);

    }

  });
}

//get earthquakes
function getEarthquakes(north,south,east,west) {

  $.ajax({
    url: "php/getEarthquakes.php",
    type: 'GET',
    dataType: 'json',
    data: {
      north: north,
      south: south,
      east: east,
      west: west
    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {
        airportsMap.clearLayers();

        for (let i = 0; i < result.data.length; i++) {
          const magnitude = result.data[i].magnitude;
          let earthquakeLat = result.data[i].lat;
          let earthquakeLon = result.data[i].lng;

          L.marker([earthquakeLat, earthquakeLon], { icon: earthquakesIcon })
            .bindTooltip("<div class='col text-center'><strong>" + magnitude + "</strong><br><i></i></div>", { direction: 'top', sticky: true })
            .addTo(earthquakeMap);
        }

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Location earthquakes error', textStatus, errorThrown);

    }

  });
}

//get airports
function getAirports(countryCode) {

  $.ajax({
    url: "php/getAirports.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: countryCode

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {
        airportsMap.clearLayers();

        for (let i = 0; i < result.data.length; i++) {
          const airportName = result.data[i].name;
          let airportLat = result.data[i].latitude;
          let airportLon = result.data[i].longitude;

          L.marker([airportLat, airportLon], { icon: airportIcon })
            .bindTooltip("<div class='col text-center'><strong>" + airportName + "</strong><br><i></i></div>", { direction: 'top', sticky: true })
            .addTo(airportsMap);
        }

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Location airports error', textStatus, errorThrown);

    }

  });
}

//get latitude and longitude
function getCoordinates(countryName) {
  $.ajax({
    url: "php/getCoordinates.php",
    type: 'POST',
    dataType: 'json',
    data: {
      q: encodeURIComponent(countryName)

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {

        latitude = result.data.results[0].geometry.lat;
        longitude = result.data.results[0].geometry.lng;
        getWeather(latitude, longitude);
        getWikipedia(latitude,longitude);

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Coordinates error', textStatus, errorThrown);

    }
  });
}
//get currencyInfo
function getCurrencyInfo(countryName) {


  $.ajax({
    url: "php/getCurrencyInfo.php",
    type: 'POST',
    dataType: 'json',
    data: {
      q: encodeURIComponent(countryName)

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {

        $('#txtCurrencyName').html(result.data.results[0].annotations.currency.name);
        $('#txtCurrencyCode').html(result.data.results[0].annotations.currency.iso_code);
        $('#txtSymbol').html(result.data.results[0].annotations.currency.symbol);
        currencyIso = result.data.results[0].annotations.currency.iso_code;
        

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('ExchangeRate Data Error', textStatus, errorThrown);

    }
  });
}

//wikipedia
function getWikipedia(latitude, longitude) {
  $('#txtWikipedia').empty();
  $.ajax({
    url: "php/getWikipedia.php",
    type: 'POST',
    dataType: 'json',
    data: {
      lat: latitude,
      lng: longitude

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {
        $.each(result.data, function (index) {
          var link = "https://" + result.data[index].wikipediaUrl
          
          $('#txtWikipedia').append("<div>", `<table class="table table-striped">
          <tbody>
           <tr>
             <td><a href="${link}" target="_blank">${result.data[index].summary}</a></td>
           </tr>
           </tbody>
           </table>`)
        })
      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Wikipedia error', textStatus, errorThrown);

    }
  });
}
//Currency converter
function currencyConverter(currencyIso) {
  var quantity = parseFloat($('#quantity').val());
  $('#targetCurrency').html(currencyIso);


  $.ajax({
    url: "php/currencyConverter.php",
    type: 'POST',
    dataType: 'json',
    data: {

      currencyIso: currencyIso

    },
    success: function (result) {

      console.log(JSON.stringify(result));

      if (result.status.name == "ok") {

        var quantityResult = quantity * result.data;
        $('#quantityResult').val(quantityResult.toFixed(4));

      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Currency converter error', textStatus, errorThrown);

    }
  });
}
//Converter function to improve usability
var moneyInput = document.getElementById('quantity');
function usabilityConverter() {
  if(parseFloat(moneyInput.value) !== 0){
    currencyConverter(currencyIso)
  };
}
moneyInput.addEventListener('input', usabilityConverter);

//number with commas
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// initialise and add controls once DOM is ready
$(document).ready(function () {
  populateList();
  
  getCountry();
  

  map = L.map("map", {
    layers: [streets]
  })

  layerControl = L.control.layers(basemaps, overlayMaps).addTo(map);

  infoBtn.addTo(map);
  weatherBtn.addTo(map);
  currencyBtn.addTo(map);
  newsBtn.addTo(map);
  wikipediaBtn.addTo(map);
  
})
// buttons

var infoBtn = L.easyButton("fas fa-info", function (btn, map) {
  $("#countryInfo").modal("show");
});
var weatherBtn = L.easyButton("fa-solid fa-cloud", function (btn, map) {
  $("#weather").modal("show");
});
var currencyBtn = L.easyButton("fa-solid fa-money-bill-trend-up", function (btn, map) {
  $("#currency").modal("show");
});
var newsBtn = L.easyButton("fa-solid fa-newspaper", function (btn, map) {
  $("#news").modal("show");
});
var wikipediaBtn = L.easyButton("fa-brands fa-wikipedia-w", function (btn, map) {
  $("#wikipedia").modal("show");
});



