// Open en sluit panel met swipe.
$(document).on('pageinit', '#home', function(){
    $(document).on('swipeleft swiperight', '#home', function(e) {
        if(e.type === "swiperight") {
            $('#menu').panel("open");
        } else if (e.type === "swipeleft") {
            $('#menu').panel("close");
        }
    });
});

// Swipe up en down eventlisteners voor detail pagina.
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

// Wanneer de settings pagina geinitialiseerd wordt dan worden de opgeslagen waarden, tags en eventlisteners gezet.
$(document).on('pageinit', '#settings', function(){
    $('#tag').focusout(function() {
        $('#autocompletelist').hide();
    });

    $('#tag').focusin(function() {
        $('#autocompletelist').show();
    });

    $('#save').on('tap', function(){
        save();
    });
    
    setValues();
    getTags();
});

// Wanneer de settings link wordt aangetapt, dan wordt de mobile.loading getoond.
$(document).on('tap', '#settingslink', function(){
    startLoading();
});

// Wanneer de applicatie gestart wordt, dan wordt je huidige locatie opgehaald, indien dat gelukt is wordt de onSuccess functie uitgevoerd.
function onDeviceReady(){
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

// Indien er settings in localStorage zijn opgeslagen, worden deze gezet in de settings pagina.
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

// Wanneer de savebutton aangeklikt wordt, wordt de volgende functie uitgevoerd.
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

    // var tag = $('#tag-input').val();
    // if(tag !== window.localStorage.getItem("tag")){
    //     window.localStorage.setItem("tag", tag);
    //     refreshRestaurants = true;
    // }

    if(refreshRestaurants === true){
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
}

// getTags() haalt de tags op uit de API en cachet deze.
function getTags(){
    var url = "https://api.eet.nu/tags";
    if(window.localStorage.getItem('cached_tags') == null) {
        $.getJSON(url, function(data) {
            var dataToStore = JSON.stringify(data);
            window.localStorage.setItem('cached_tags', dataToStore);
            $('#autocompletelist ul').empty();
            $.each(data.results, function(i, line) {
                $('#autocompletelist ul').append('<li onclick="fillInputField(\''+line.name+'\');"><a href="#">'+line.name+'</a></li>');
                $('#autocompletelist ul').filterable("refresh");
            });
            $('#tag').focusout();
        });
    } else {
        var data = JSON.parse(window.localStorage.getItem('cached_tags'));
        $('#autocompletelist ul').empty();
        $.each(data.results, function(i, line) {
            $('#autocompletelist ul').append('<li onclick="fillInputField(\''+line.name+'\');"><a href="#">'+line.name+'</a></li>');
            $('#autocompletelist ul').filterable("refresh");
        });
        $('#tag').focusout();
    }
}

// getRestaurants haalt de restaurants uit de buurt op en genereerd de lijst met restaurants.
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
                var rating = (line.rating !== null ? '<span style="float:right">'+line.rating+'</span>' : '')
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

// Indien er een nieuwe detail pagina geopend wordt dan wordt deze functie uitgevoerd.
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

        // Title and Navigation
        $('#name').text(data.name);
        $('#id_next').val(json.next);
        $('#id_previous').val(json.previous);

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
            $('#own_url').text("Restaurant");
            $('#restaurant_url').show();
        } else {
            $('#own_url').attr("onclick", "");
            $('#own_url').text("Restaurant");
            $('#restaurant_url').hide();
        }
        $('#eetnu_url').attr("onclick", "navigator.app.loadUrl('" + data.url + "', { openExternal:true });");

        // Beoordeling
        var urlReview = "https://api.eet.nu/venues/" + id + "/reviews";
        $.getJSON(urlReview, function(reviewData) {
            if(reviewData.results.length == 0) {
                $('#ratings').hide();
            } else {
                var nOfReview = 0;
                var ratings = {"rating": 0, "ambiance": 0, "food": 0, "service": 0, "value": 0};
                $.each(reviewData.results, function(k, v) { // k = key, v = value.
                    if(v.rating != null) {
                        nOfReview++;
                        ratings["rating"] = ratings["rating"] + v.rating;
                        ratings["ambiance"] = ratings["ambiance"] + v.scores.ambiance;
                        ratings["food"] = ratings["food"] + v.scores.food;
                        ratings["service"] = ratings["service"] + v.scores.service;
                        ratings["value"] = ratings["value"] + v.scores.value;
                    }
                });

                var maxScore = 10 * nOfReview;
                $.each(ratings, function(k, v) { // k = key, v = value.
                    ratings[k] = Math.round(v / nOfReview);
                    ratings[k] = ratings[k].toString();
                    if(ratings[k] == "100") {                
                        $('#' + k + "_stars").html(getRating(ratings[k].charAt(0) + "" + ratings[k].charAt(1)));
                    } else {
                        $('#' + k + "_stars").html(getRating(ratings[k].charAt(0)));
                    }
                    if(ratings[k] != "NaN") {
                        if(ratings[k] == "100") {
                            ratings[k] = ratings[k].slice(0,-1);
                        } else {
                            ratings[k] = ratings[k].substr(0, 1) + "," + ratings[k].substr(1);
                        }
                    } else {
                        ratings[k] = 0;
                    }
                    $('#' + k).text(ratings[k]);
                });
                $('#ratings').show();
            }
        });

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

        // Menukaarten
        if(data.tags.length == 0) {
            $('#tags').hide();
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
            $('#tags').show();
        }

        $.mobile.changePage("#detail", { transition: slide_direction });
        stopLoading();
    });
}

// fillInputField zorgt ervoor dat indien er op een tag geklikt is dat deze waarde in de textbox komt en de suggestie lijst verdwijnt.
function fillInputField(name) {
    $('#tag-input').val(name);
    $('#tag-input').change();
    $('#tag').focusout();
}

// Toont het loading schermpje
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

// Stopt het loading scherm. 
function stopLoading() {
    $.mobile.loading( "hide" );
}

function getRating(rating) {
    var returnString = "";
    switch (rating) {
        case "1": returnString = "<i class=\"fa fa-star-half-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "2": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "3": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star-half-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "4": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "5": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star-half-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "6": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "7": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star-half-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "8": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star-o\"></i>"; break;
        case "9": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star-half-o\"></i>"; break;
        case "10": returnString = "<i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i><i class=\"fa fa-star\"></i>"; break;
        default: returnString = "<i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i><i class=\"fa fa-star-o\"></i>"; break;
    }
    return returnString;
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

