var ori = 0;
var lat = 0;
var lon = 0;
function init() {
  var compass = document.getElementById('compassContainer');
  if(window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function(event) {
      var dir='';
      var alpha;
      if(event.webkitCompassHeading) {
        alpha = event.webkitCompassHeading;
        dir='-';
      }
      else alpha = event.alpha;
      if (alpha != null) {
        ori = Math.floor(alpha);

        compass.style.Transform = 'rotate(' + alpha + 'deg)';
        compass.style.WebkitTransform = 'rotate('+dir + alpha + 'deg)';
        compass.style.MozTransform = 'rotate(' + alpha + 'deg)'; 
        $("#orientation").text(Math.floor(alpha) + ' deg');
      }

    }  , false);
  }

  if (navigator.geolocation)
    var watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, {enableHighAccuracy:true});
  else
    alert("Votre navigateur ne prend pas en compte la géolocalisation HTML5");

  function successCallback(position){
    if (position.coords.latitude != null) {
      lat = position.coords.latitude;
    }
    if (position.coords.longitude !=null) {
      lon = position.coords.longitude;
    }

    $('#latlng').html(position.coords.latitude + "</br>" + position.coords.longitude)
  }

  function errorCallback(error){
    switch(error.code){
      case error.PERMISSION_DENIED:
      alert("L'utilisateur n'a pas autorisé l'accès à sa position");
      break;      
      case error.POSITION_UNAVAILABLE:
      alert("L'emplacement de l'utilisateur n'a pas pu être déterminé");
      break;
      case error.TIMEOUT:
      alert("Le service n'a pas répondu à temps");
      break;
    }
  }

  function stopWatch(){
    navigator.geolocation.clearWatch(watchId);
  }
}//fin init

function findThisBuddy(id){
  $.post( "request_buddy.php", { id: id }, function( data ) {
    $("#orientation2").html(data.name+"</br>"+data.orientation+" deg");
    $("#latlng2").html(data.name+"</br>"+data.latitude+"</br>"+data.longitude);
  }, "json").done(function() {
    console.log('TERMINE');
  })
  .fail(function() {
    console.log( "ERREUR" );
  })
  .always(function() {
    console.log( "FINI" );
  });

/*
  if (id!=old_id) {
    clearTimeout(finder);
  }
  var old_id = id;
  */
  finder = setTimeout("findThisBuddy("+id+")", 1000);
}

function storeInformationAboutMe(id){
  $.post( "request_store.php", { id:id, latitude: lat, longitude: lon, orientation: ori }, function(data) {
    $("#users").html("");
    data.forEach(function(entry) {
      if(entry.connected){
        class_btn = "btn-success";
      }
      else{
        class_btn = "btn-primary";
      }
      $("#users").append("<a class='btn "+class_btn+" btn-xs space-around' onclick='findThisBuddy("+entry.id+")'>"+entry.name+"</a>");
    });
    
  }, "json");

  setTimeout("storeInformationAboutMe("+id+")", 1000);
}

jQuery(document).ready(function($) {
  $.get('request_id.php', function(data) {
    storeInformationAboutMe(data);
  });
});