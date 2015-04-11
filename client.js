
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
        IO.socket.on('dataSent', App.showUserList);
        IO.socket.on('alreadyChosen', App.alreadyChosen);
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
    },

    //initialise les variables utilisées pour définir les différents templates
    initVariables: function () {
        App.$doc = $(document);
        App.$main = $('#main');
        App.$templateMenu = $('#menu').html();
        App.$templateList = $('#templateList').html();
    },

    //initialise les différents listeners pour les users
    initListeners: function () {
        $(".user").each(function() {
            App.$doc.on('click', '#Ugo', App.onButtonConnect($(this).text()));
        });
    },

    /**
     * Méthode appelée lorsque l'on appui sur le bouton de connection.
     */
    onButtonConnect : function(pseudo) {
        //alert(pseudo);
    },

    /**
     * Va afficher tout les utilisateurs utilisant l'application.
     *
     * @param data Données sur les utilisateurs
     */
    showUserList : function(data) {
        var contenu = $('#userList').text();
        $('#userList').html(contenu + '<div class="user" id="'+data.name+'">'+data.name+'</div>');
    },


    /**
     * Récupère le pseudo entré par l'utilisateur.
    */
    getPseudoInForm : function() {
        var pseudo = $('#inputPseudo').val();
        IO.socket.emit('recupPseudos',pseudo);
    },


    /**
     * fonction qui va permettre, en fonction du booleen,
     * d'afficher un message si le pseudo est déjà pris
     * (boolean a false) sinon va afficher la liste des
     * utilisateurs.
     *
     * @param isAlreadyChosen Boolean dont la valeur est définie dans le serveur
     */
    alreadyChosen : function(isAlreadyChosen) {
        if(isAlreadyChosen)
            $("#alreadyChosen").text("Ce pseudo est déjà pris !");
        else {
            App.initListeners();
            App.$main.html(App.$templateList);
            IO.socket.emit('getDataBase');
        }
    }

};

    IO.init();
    App.init();