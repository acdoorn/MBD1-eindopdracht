// document.addEventListener("deviceready", onDeviceReady, false);

// Wanneer de settings pagina geladen wordt dan wordt de slider op de opgeslagen waarde gezet.
$(document).on('pageinit', '#settings', function(){
    setValues();
    getTags();

    $('#tag').focusout(function() {
        $('#autocompletelist').hide();
    });

    $('#tag').focusin(function() {
        $('#autocompletelist').show();
    });

    $('#save').on('tap', function(){
        save();
    });
});


function onDeviceReady(){
    alert(navigator.geolocation)
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function setValues() {
    var distance = window.localStorage.getItem("distance");
    if(distance > 0) {
        $('#distance').val(distance).slider("refresh");
    }

    var sortby = window.localStorage.getItem("sortby");
    if(sortby != null) {
        $('#sortby').val(sortby).selectmenu("refresh");
    }

    var tag = window.localStorage.getItem("tag");
    if(tag != null) {
        $('#tag-input').val(tag);
    }
}

function onSuccess(position) {
    getRestaurants(position);
}

function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function save() {
    var refreshRestaurants = false;
    
    var distance = $('#distance').val();
    if(distance !== window.localStorage.getItem("distance")){
        window.localStorage.setItem("distance", distance);
        refreshRestaurants = true;
    }
    
    var sortby = $('#sortby').val();
    if(sortby !== window.localStorage.getItem("sortby")){
        window.localStorage.setItem("sortby", sortby);
        refreshRestaurants = true;
    }

    var tag = $('#tag-input').val();
    if(tag !== window.localStorage.getItem("tag")){
        window.localStorage.setItem("tag", tag);
        refreshRestaurants = true;
    }

    if(refreshRestaurants === true){
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
}

function getTags(){
    var url = "https://api.eet.nu/tags";
    startLoading();
    $.getJSON(url, function(data) {
        $('#autocompletelist ul').empty();
        $.each(data.results, function(i, line) {
            $('#autocompletelist ul').append('<li onclick="fillInputField(\''+line.name+'\');"><a href="#">'+line.name+'</a></li>');
            $('#autocompletelist ul').filterable("refresh");
        });
        $('#tag').focusout();
        stopLoading();
    });
}

function getRestaurants(position) {
    if(window.localStorage.getItem("distance") > 0){
        var distance = window.localStorage.getItem("distance");
    } else {
        var distance = $('#distance').val();
    }

    if(window.localStorage.getItem("sortby") != null){
        var sortby = window.localStorage.getItem("sortby");
    } else {
        var sortby = $('#sortby').val();
    }

    if(window.localStorage.getItem("tag") != null && window.localStorage.getItem("tag") != ""){
        var tag = "&tags="+window.localStorage.getItem("tag");
    } else if($('#tag-input').val() != null && $('#tag-input').val() != ""){
        var tag = "&tags="+$('#tag-input').val();
    } else {
        var tag = "";
    }

    var longitude = position.coords.longitude;
    var latitude = position.coords.latitude;
    var url = "https://api.eet.nu/venues?max_distance="+distance+"&geolocation="+latitude+","+longitude+tag+"&sort_by="+sortby;
    if(distance >= 0){
        startLoading();
        $.getJSON(url, function(data) {
            $('#restaurantlist').empty();
            $.each(data.results, function(i, line) {
                $('#restaurantlist').append('<li rel="'+line.id+'"><a href="#" data-transition="flip" class="ui-btn ui-corner-all ui-shadow ui-btn-inline">'+line.name+'</a></li>');
            });    
            stopLoading();

            $('#restaurantlist li').each(function(){
                $(this).on('tap', function(){
                    var id = $(this).attr('rel');
                    showDetails(id);
                });
            });
        });
    }
}

function showDetails(id) {
    var url = "https://api.eet.nu/venues/"+id;
    startLoading();
    $.getJSON(url, function(data) {
        $('#name').text(data.name);

        $('#map_canvas').gmap({ 'center': new google.maps.LatLng(data.geolocation.latitude,data.geolocation.longitude), 
            'zoomControl': false,
            'mapTypeControl': false,
            'scaleControl': false, 
            'streetViewControl': false,
            'zoom':15, 'callback':function() {
                 $('#map_canvas').gmap('clearMarkers');
                $('#map_canvas').gmap('addMarker',{'position':new google.maps.LatLng(data.geolocation.latitude,data.geolocation.longitude)})
            } 
        });

        /*$('#map_canvas').gmap('addMarker', {'position': '57.7973333,12.0502107', 'bounds': true}).click(function() {
            $('#map_canvas').gmap('openInfoWindow', {'content': 'Hello World!'}, this);
        });*/

        $.mobile.changePage("#detail", { transition: "slide" });
        stopLoading();
    });
}

function fillInputField(name) {
    $('#tag-input').val(name);
    $('#tag-input').change();
    $('#tag').focusout();
}

function startLoading() {
    var $this = $( this ),
        theme = "b",
        msgText = "loading",
        textVisible = true,
        textonly = false;

    $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
    });
}

function stopLoading() {
    $.mobile.loading( "hide" );
}