var geocoder = new google.maps.Geocoder();
var app = angular.module('myApp', ["AngularGM"]);
app.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|blob):/);
    }
]);

app.directive('filelistBind', function() {
  return function( scope, elm, attrs ) {
    elm.bind('change', function( evt ) {
      
      scope.$apply(function() {
        scope[attrs.onLoad](evt.target.files[0]);
        //scope[ attrs.name ] = evt.target.files;
      });
    });
  };
});

/* $http ajax calls really belongs in a service, 
but I'll be using them inside the controller for this demo */ 
/*var content = 'file content';
var blob = new Blob([ "lll" ], { type : 'text/plain' });
var myurl = (window.URL || window.webkitURL).createObjectURL( blob );
document.getElementById("downloadLink").href = myUrl;
*/
app.controller('myCtrl', function($scope, $http) {
  //inputting json directly for this example
  $scope.medicalCentres = [{"id":"1","centreType":"Clinics","area":"Jerusalem","name":"Bikur Rofeh","address":"Beit Hadfus 22, Jerusalem","openingHours":["Sun: 17:00 - 01:00","Mon- Thur: 18:30 - 01:00","Fri, holiday eve: 09:00 - 14:00","Sat, holidays: 17:30 - 01:00"],"phoneNumbers":[{"phoneType":null,"number":"077-554-0943","extension":null}],"location":{"lat":31.78626,"lon":35.1856894}},{"id":"2","centreType":"aClinics","area":"Jerusalem","name":"Bikur Rofeh","address":"Klermon Gano 1, Jerusalem","openingHours":["Sun - Thur: 19:00 - 23:00","Fri, Sat: 16:00 - 23:00"],"phoneNumbers":[{"phoneType":null,"number":"02-589-3845","extension":null}],"location":{"lat":31.768319,"lon":35.21371}}];

  $scope.centreTypes = $scope.medicalCentres.reduce(function(sum, medicalCentre) {
   return ( sum.indexOf( medicalCentre.centreType ) == -1 ? sum.concat( medicalCentre.centreType ) : sum );
}, []);
  $scope.areas = $scope.medicalCentres.reduce(function(sum, medicalCentre) {
   return ( sum.indexOf( medicalCentre.area ) == -1 ? sum.concat( medicalCentre.area ) : sum );
}, []);
  $scope.exportFile = function() {
    /*$http.post('path/to/server/file/to/save/json', $scope.languages).then(function(data) {
      $scope.msg = 'Data saved';
    });*/
    $scope.msg = 'Paste this into the file: '+ JSON.stringify(angular.copy($scope.medicalCentres));
  };
  $scope.del = function(id) {
    $scope.medicalCentres = $scope.medicalCentres.filter(function(c) {
      return c.id != id;
    });
    $scope.setDownloadUrl();
  };
  function emptyCentre() {
    return {"id":null,"centreType":null,"area":null,"name":null,"address":null,"openingHours":[],"phoneNumbers":[],"location":{"lat":null,"lon":null}};
  }
  function emptyPhoneNum() { return {"phoneType":null,"number":null,"extension":null}; }
  $scope.addNew = function() {
    $scope.medicalCentre = emptyCentre();
    $scope.phoneNum = emptyPhoneNum();
    $scope.hour = null;
  };

  $scope.medicalCentre = undefined;
  $scope.edit = function(id) {
    $scope.medicalCentre = angular.copy($scope.medicalCentres.filter(function(c) {
      return c.id == id;
    })[0]);
    
    setTimeout(function(){
      $scope.$apply(function() {
        $scope.updateMapCenter($scope.medicalCentre.location.lat,$scope.medicalCentre.location.lon);
      });
    },1250);
  };
  $scope.hour = null;
  $scope.phoneNum = emptyPhoneNum();
  $scope.removeOpeningHours = function(index){
   $scope.medicalCentre.openingHours.splice(index,1);
  };
  $scope.addOpeningHours = function(hour){
    $scope.medicalCentre.openingHours.push(hour);
    $scope.hour=null;
  };
  $scope.removePhoneNumber = function(index){
   $scope.medicalCentre.phoneNumbers.splice(index,1);
  };
  $scope.addPhoneNumber = function(phoneNum){
    $scope.medicalCentre.phoneNumbers.push(phoneNum);
    $scope.phoneNum=emptyPhoneNum();
  };	
  $scope.cancel = function() {
    console.log("Cancelling edit/add");
    $scope.medicalCentre = undefined;
    $scope.hour = null;
    $scope.phoneNum = emptyPhoneNum();
    console.log("Cancelling edit/add - done");
  };
  $scope.save = function(id) {
    var newId = $scope.medicalCentre.id;
    if (newId === null) {
      newId = Number($scope.medicalCentres[$scope.medicalCentres.length-1].id)+1;
       $scope.medicalCentre.id = String(newId);
    }
    var i = getIndexById($scope.medicalCentres,newId);
    $scope.medicalCentres[i] = $scope.medicalCentre;
    $scope.medicalCentre = undefined;
    $scope.hour = null;
    $scope.phoneNum = emptyPhoneNum();
    $scope.setDownloadUrl();
  };

  
  $scope.lookupAddress = function(address) {
    $scope.medicalCentre.location.lat =null;
    $scope.medicalCentre.location.lon =null;
    
    geocoder.geocode( { 'address': address+", Israel"}, function(results, status) {
      $scope.$apply(function () {
    if (status == google.maps.GeocoderStatus.OK) {
      $scope.medicalCentre.location.lat = results[0].geometry.location.lat();
      $scope.medicalCentre.location.lon = results[0].geometry.location.lng();
 $scope.updateMapCenter($scope.medicalCentre.location.lat,$scope.medicalCentre.location.lon);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
      });
  });
  };
  $scope.updateMapCenter = function(lat, lng) {
    google.maps.event.trigger(myMap, 'resize');
    $scope.mapCenter = new google.maps.LatLng(lat, lng);
    $scope.mapMarker = [{
    "id":"onlyOne",
    "location":{
      "lat":lat,
      "lon":lng
    }
  }
    ];
  };
  $scope.mapClicked = function(map,event) {
    if (shiftOn) {
    var lat = event.latLng.lat();
    var lon = event.latLng.lng();
    $scope.medicalCentre.location.lat = lat;
    $scope.medicalCentre.location.lon = lon;
    $scope.updateMapCenter(lat,lon);
    }
  };
  $scope.$on('gmMapIdle', function(event, mapId) {
    $scope.mapZoom = 15;
});
  
  $scope.setDownloadUrl = function() {
    $scope.url = (window.URL || window.webkitURL).createObjectURL( new Blob([ JSON.stringify(angular.copy($scope.medicalCentres)) ], { type : 'text/plain' }) );
  };
  $scope.fileLoaded = function(f) {
    var reader = new FileReader();
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
            $scope.$apply(function() {
            $scope.medicalCentres = angular.fromJson(e.target.result);
            $scope.cancel();
            $scope.setDownloadUrl();
          });
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsText(f);
    
  };
  
});

document.onkeydown = keyDownHandler;
document.onkeyup = keyUpHandler;

var shiftOn = false;

function keyDownHandler(ev){
//alert("keydown");
 var e = ev ? ev : window.event;
 if ( (e.shiftKey) ){
        shiftOn = true;
   } else {
        shiftOn = false;
  }
}

function keyUpHandler(ev){
//alert("keydown");
  var e = ev ? ev : window.event;
 if ( (e.shiftKey) ){
        shiftOn = true;
   } else {
        shiftOn = false;
  }
}

function getIndexById(arr,id) {
for(var i = 0; i < arr.length; i += 1){
    var obj = arr[i];
    if(obj.id === id){
        return i;
    }
}
  return arr.length;
}