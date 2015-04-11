

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

        var pg = require('pg');

        var params = {
            host: 'ec2-107-20-159-103.compute-1.amazonaws.com',
            user: 'ddvudgojlealkl',
            password: 'M7RFqcWBY4ZLlQVui-nku-dA2i',
            database: 'd3j1bl9lkitr93',
            ssl: true
        };

        var client = new pg.Client(params);
        client.connect();

        var query = client.query("SELECT name FROM \"User\"");

        query.on('row', function (row) {
            alert(JSON.stringify(row));
            //$('#id').text()
        });
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
        App.initListeners();
    },

    //initialise les variables utilisées pour définir les différents templates
    initVariables: function () {
        App.$doc = $(document);
        App.$main = $('#main');
        App.$templateMenu = $('#menu').html();
        App.$templateList = $('#templateList').html();
    },

    //initialise les différents listeners qui vont écouter les évènements émis par le serveur socket
    //puis lance la fonction appropriée
    initListeners: function () {
        App.$doc.on('click', '#btnConnect', alert("moncul"));
    }
};

    IO.init();
    App.init();