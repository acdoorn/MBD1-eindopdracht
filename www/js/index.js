$(document).on('pageinit', '#home', function(){
    $(document).on('swipeleft swiperight', '#home', function(e) {
        if(e.type === "swiperight") {
            $('#menu').panel("open");
        } else if (e.type === "swipeleft") {
            $('#menu').panel("close");
        }
    });
});

$(document).on('pageinit', '#detail', function(){    
    if($('#name').text() == "") {
        showDetails(null, "slide");
    }

    $('#detail').on('swipeleft', function(){
        var id_next = $('#id_next').val();
        if(id_next != "") {
            var rel = $('#'+id_next).attr('rel');
            var json = jQuery.parseJSON(rel);
            showDetails(json, "slideup");
        }
    });
    $('#detail').on('swiperight', function(){
        var id_previous = $('#id_previous').val();
        if(id_previous != "") {
            var rel = $('#'+id_previous).attr('rel');
            var json = jQuery.parseJSON(rel);
            showDetails(json, "slidedown");
        }
    });
});

$(document).on('pageinit', '#settings', function(){
    $('#save').on('tap', function(){
        save();
    });
    
    setValues();//get from cache
});

$(document).on('tap', '#settingslink', function(){
    startLoading();
});

function onDeviceReady(){
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

    if(refreshRestaurants === true){
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
}

function addToContacts() {
    if($('#telephone').text() != "Unavailable") {
        var myContact = navigator.contacts.create({"displayName": $('#name').text()});

        var phoneNumbers = [];
        phoneNumbers[0] = new ContactField('HOME', $('#telephone').text(), false);
        myContact.phoneNumbers = phoneNumbers;

        myContact.save(onSuccessCallBack, onErrorCallBack);

        function onSuccessCallBack(contact) {
            alert($('#name').text() + " is added to your contacts!");
        };

        function onErrorCallBack(contactError) {
            alert("Error = " + contactError.code);
        };
    } else {
        alert("No telephone found!");
    }
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

    var longitude = position.coords.longitude;
    var latitude = position.coords.latitude;
    var url = "https://api.eet.nu/venues?max_distance="+distance+"&geolocation="+latitude+","+longitude+"&sort_by="+sortby;
    if(distance >= 0){
        startLoading();
        $.getJSON(url, function(data) {
            $('#restaurantlist').empty();
            $.each(data.results, function(i, line) {
                var previous = "";
                var next = "";

                if(i > 0){
                    previous = data.results[i-1].id;
                } else {
                    previous = '\"\"';
                }
                if(i < data.results.length-1){
                    next = data.results[i+1].id;
                } else {
                    next = '\"\"';
                }
                var jsonObject = new Object();
                jsonObject.id = line.id;
                jsonObject.next = next;
                jsonObject.previous = previous;
                var relString = JSON.stringify(jsonObject);
                var rating = '';
                if(line.rating !== null) {
                    rating = line.rating.toString();
                    rating = '<span style="float:right">'+rating.charAt(0)+','+rating.charAt(1)+'</span>';
                }
                $('#restaurantlist').append('<li id="'+line.id+'" rel'+"='"+relString+"'"+'><a href="#" data-transition="flip" class="ui-btn ui-corner-all ui-shadow ui-btn-inline">'+line.name+rating+'</a></li>');
            });    
            stopLoading();

            $('#restaurantlist li').each(function(){
                $(this).on('tap', function(){
                    var rel = $(this).attr('rel');
                    var json = jQuery.parseJSON(rel);

                    showDetails(json, "slide");
                });
            });
        });
    }
}

function showDetails(json, slide_direction) {
    if(json != null) {
        window.localStorage.removeItem("lastDetails");
        window.localStorage.setItem("lastDetails", JSON.stringify(json));
    } else {
        json =  jQuery.parseJSON(window.localStorage.getItem("lastDetails"));
    }

    var id = json.id;
    var url = "https://api.eet.nu/venues/"+id;
    startLoading();
    $.getJSON(url, function(data) {

        var lat = data.geolocation.latitude;
        var lng = data.geolocation.longitude;

        // Title and Navigation
        $('#name').text(data.name);
        $('#id_next').val(json.next);
        $('#id_previous').val(json.previous);

                // Beoordeling
        var urlReview = "https://api.eet.nu/venues/" + id + "/reviews";
        $.getJSON(urlReview, function(reviewData) {
            if(reviewData.results.length == 0) {
                $('#ratings').hide();
            } else {
                var rating = '';
                if(data.rating !== null) {
                    rating = data.rating.toString();
                    rating = rating.charAt(0)+','+rating.charAt(1);
                    $('#eetnu').text(rating);
                    $('#eetnuRating').show();
                } else {
                    $('#eetnuRating').hide();
                }
                var reviews = 0;
                var ratings = {"rating": 0, "ambiance": 0, "food": 0, "service": 0, "value": 0};
                $.each(reviewData.results, function(i, j) {
                    if(j.rating != null) {
                        reviews++;
                        ratings["rating"] = ratings["rating"] + j.scores.ambiance;;
                        ratings["ambiance"] = ratings["ambiance"] + j.scores.ambiance;
                        ratings["food"] = ratings["food"] + j.scores.food;
                        ratings["service"] = ratings["service"] + j.scores.service;
                        ratings["value"] = ratings["value"] + j.scores.value;
                    }
                });

                $.each(ratings, function(i, j) {
                    ratings[i] = Math.round(j / reviews);
                    ratings[i] = ratings[i].toString();
                    if(ratings[i] != "NaN") {
                        ratings[i] = ratings[i].substr(0, 1) + ratings[i].substr(1);
                    } else {
                        ratings[i] = 0;
                    }
                    if(ratings[i] == 100) {
                        $('#' + i).text(ratings[i].charAt(0) + ratings[i].charAt(1));
                    }
                    else {

                        $('#' + i).text(ratings[i].charAt(0) +','+ ratings[i].charAt(1));
                    }
                });
                $('#ratings').show();
            }
        });

        // Map
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

        // Adres
        $('#street').text(data.address.street);
        $('#zipcode_place').text(data.address.zipcode + " " + data.address.city);
        $('#country').text(data.address.country);

        // Contact
        $('#telephone').text(data.telephone);
        $('#telephone').attr("onclick", "window.open('tel:" + data.telephone + "', '_system');");
        if(data.website_url != null && data.website_url != "") {
            $('#own_url').attr("onclick", "navigator.app.loadUrl('" + data.website_url + "', { openExternal:true });");
            $('#own_url').text(data.name);
            $('#restaurant_url').show();
        } else {
            $('#own_url').attr("onclick", "");
            $('#restaurant_url').hide();
        }
        $('#eetnu_url').attr("onclick", "navigator.app.loadUrl('" + data.url + "', { openExternal:true });");

        // Openingstijden
        if(data.opening_hours.length == 0) {
            $('#opentime').hide();
        } else {
            for (var i = 0; i < 7; i++) {
                $('#day_' + i).text("");
            }
            $.each(data.opening_hours, function(k, v) { // k = key, v = value.
                if(v.closed == true) {
                    $('#day_' + v.day).text("Closed");
                } else {
                    var start = "", end = "";
                    if(v.lunch_from == null) { start = v.dinner_from; } else { start = v.lunch_from; }
                    if(v.dinner_till == null){ end = v.lunch_till;    } else { end = v.dinner_till;  }
                    if(start == null) { start = "?"  }
                    if(end == null)   { end = "?"    }
                    $('#day_' + v.day).text(start + " - " + end);
                }
            });
            $('#opentime').show();
        }

        // Omschrijving
        if(data.description === null) {
            $('#descriptionfield').hide();
        } else {
            $('#description').text(data.description);
            $('#descriptionfield').show();
        }



        $.mobile.changePage("#detail", { transition: slide_direction });
        stopLoading();
    });
}

function startLoading() {
    var $this = $( this ),
        theme = "a",
        msgText = "laden",
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

