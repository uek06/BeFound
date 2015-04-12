var target = "";
var myPseudo = "";
// Tout le code qui concerne les connections socket
var IO = {

    //fonction lancée au  chargement de la page, lancée grâce à IO.init() en bas de la page
    init: function () {
        IO.socket = io.connect();
        IO.initListeners();
    },

    //initialise les différents listeners qui vont écouter les évènements émis par le serveur socket
    //puis lance la fonction appropriée
    initListeners: function () {
        IO.socket.on('connected', IO.onConnected);
        IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
        IO.socket.on('alreadyChosen', App.alreadyChosen);
        IO.socket.on('messageAlert', App.messageAlert);
        IO.socket.on('updateDisplay',App.updateDisplay);
        IO.socket.on('firstDisplay',App.firstDisplay);
        IO.socket.on('createListener',App.createListener);
        IO.socket.on('launchTchat',App.launchTchat);
        IO.socket.on('sendMessage',App.sendMessage);
        IO.socket.on('meetMe',App.meetMe);
    },

    /**
     * The client is successfully connected!
     */
    onConnected: function () {
        // Cache a copy of the client's socket.IO session ID on the App
        App.mySocketId = IO.socket.socket.sessionid;
    },

    //un client s'est connecté, on va donc lui changer le template
    //data contient le pseudo
    playerJoinedRoom: function (data) {
        App.$main.html(App.$templateList);
    }
};

var App = {

    //l'id du game qui est identique à l'id de la room socket (où les players et l'host communiquent)
    roomId: 0,
    //l'id de l'objet socket io, unique pour chaque player et host.
    //il est généré quand le navigateur se connecte au serveur pour la première fois
    mySocketId: '',

    //est appelée en bas de la page
    init: function () {
        App.initVariables();
        App.$main.html(App.$templateMenu);
        App.$doc.on('click', '#btnConnect', App.onButtonConnect);
        App.$doc.on('click','#btn_tchat',App.onButtonTchat);
    },

    //initialise les variables utilisées pour définir les différents templates
    initVariables: function () {
        App.$doc = $(document);
        App.$main = $('#main');
        App.$templateMenu = $('#menu').html();
        App.$templateList = $('#templateList').html();
        App.$tchat = $('#tchat').html();
        App.$templateLocalisation = $('#localisation').html();
    },

    onTchatUser: function(friend){
        App.$main.html(App.$tchat);
        target = friend;
        IO.socket.emit('talk',friend,myPseudo);
    },

    onLocalisation: function(friend){
        App.$main.html(App.$templateLocalisation);
        target = friend;
        initLocalisation();
    },

    /**
     * Méthode appelée lorsque l'on appui sur le bouton de connection.
     */
    onButtonConnect : function() {
        App.getPseudoInForm();
    },


    /**
     * Récupère le pseudo entré par l'utilisateur.
     */
    getPseudoInForm : function() {
        var pseudo = $('#inputPseudo').val();
        if (/[a-zA-Z]+/.test(pseudo)) {
            myPseudo = pseudo;
            IO.socket.emit('recupPseudos', pseudo);
        }
        else $("#alreadyChosen").text("Veuillez mettre que des lettres et des chiffres");
    },


    /**
     * fonction qui va permettre, en fonction du booleen,
     * d'afficher un message si le pseudo est déjà pris
     * (boolean a false) sinon va afficher la liste des
     * utilisateurs.
     *
     * @param isAlreadyChosen Boolean dont la valeur est définie dans le serveur
     */
    alreadyChosen : function() {
        $("#alreadyChosen").text("Ce pseudo est déjà pris !");
    },


    updateDisplay : function(pseudo) {
        $('#userList').append(
            '<a role="button">' +
            '<div class="row">' +
            '<div style="text-align:center" class="col-md-4"><h2>' + pseudo + '</h2></div>' +
            '<div class="col-md-4"><button id="localisation'+pseudo+'" type="button" style="margin: 10px" class="btn btn-primary btn-lg">Localiser</button>' +
            '<button id="tchat'+ pseudo +'" type="button" style="margin: 10px" class="btn btn-primary btn-lg">Lui parler</button></div>' +
            '<div class="col-md-4"></div>' +
            '</div>' +
            '</a>');
        App.createListener(pseudo);
    },


    firstDisplay : function(users) {
        App.$main.html(App.$templateList);
        for (var i=0; i<users.length; i++) {
            if (users[i].connected) {
                $('#userList').append(
                    '<a role="button">' +
                    '<div class="row">' +
                    '<div style="text-align:center" class="col-md-4"><h2>' + users[i].name + '</h2></div>' +
                    '<div class="col-md-4"><button id="localisation'+users[i].name+'" type="button" style="margin: 10px" class="btn btn-primary btn-lg">Localiser</button>' +
                    '<button id="tchat' + users[i].name + '" type="button" style="margin: 10px" class="btn btn-primary btn-lg">Lui parler</button></div>' +
                    '<div class="col-md-4"><h2><span class="label label-success">Connecté <div class="glyphicon glyphicon-ok"></div></span></h2></div>' +
                    '</div>' +
                    '</a>');
            }
            else {
                $('#userList').append(
                    '<a role="button">' +
                    '<div class="row">' +
                    '<div style="text-align:center" class="col-md-4"><h2>' + users[i].name + '</h2></div>' +
                    '<div class="col-md-4"><button id="localisation'+users[i].name+'" type="button" style="margin: 10px" class="btn btn-primary btn-lg">Localiser</button>' +
                    '<button id="tchat'+ users[i].name +'" type="button" style="margin: 10px" class="btn btn-primary btn-lg">Lui parler</button></div>' +
                    '<div class="col-md-4"></div>' +
                    '</div>' +
                    '</a>');
            }
        }
    },


    createListener : function(pseudo) {
        // Ajout du listener
        App.$doc.on('click', '#tchat'+pseudo, function() {App.onTchatUser(pseudo)});
        App.$doc.on('click', '#localisation'+pseudo, function() {App.onLocalisation(pseudo)});
    },


    onButtonTchat : function() {
        var message = $('#msg').val();
        IO.socket.emit('newMessage',message,target);
        App.showMessage(message);
    },

    launchTchat : function(myPseudo) {
        target = myPseudo;
        App.$main.html(App.$tchat);
    },

    meetMe : function(lat,lon,myPseudo) {
        //target = myPseudo;
        App.$main.html(App.$templateLocalisation);
        $('#latlng').html(lat+'</br>'+lon);
    },

    sendMessage : function(message) {
        $('#zone_tchat').prepend('<p><strong>' + target + ": " + '</strong>' + message +'\n</p>');
    },

    /**
     * Montre un message chez le récépteur
     *
     * @param message le message à afficher
     */
    showMessage : function(message) {
        $('#zone_tchat').prepend('<p><strong>' + myPseudo + ": " + '</strong>' + message +'\n</p>');
    }



};

IO.init();
App.init();

// PARTIE DORIAN

var ori = 0;
var lat = 0;
var lon = 0;
function initLocalisation() {
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
        IO.socket.emit('sendLatLon',lat,lon,target,myPseudo);
        //$('#latlng').html(position.coords.latitude + "</br>" + position.coords.longitude)
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
