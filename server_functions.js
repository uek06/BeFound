// Le serveur
var io;
// La socket du client
var clientSocket;
var pg = require('pg');

// Tableau des utilisateurs inscrits à l'évènement
var users = [];

// Fonction appellée par server.js pour initialiser le jeu
// exports sert à pouvoir utiliser cette fonction dans un autre fichier (en l'occurence server.js ici)
exports.initApp = function (paramIO, paramSocket) {
    //on sauvegarde le serveur et la socket dans ce fichier
    io = paramIO;
    clientSocket = paramSocket;
    clientSocket.emit('connected');
    // On écoute les évenements de l'host
    clientSocket.on('viewDataBase', viewDataBase);
    clientSocket.on('recupPseudos', recupPseudos);

    // On écoute les évenements du player
    //clientSocket.on('playerJoinRoom', playerJoinRoom);
};

recupPseudos = function(pseudo) {
    var params = {
        host: 'ec2-54-163-225-82.compute-1.amazonaws.com',
        user: 'yaedbmcycdqwmw',
        password: 'Ka-ojSGHcdGx_55g8V7gDoG3Iw',
        database: 'dlk8867oe0a8d',
        ssl: true
    };

    var client = new pg.Client(params);
    client.connect();

    var query = client.query("SELECT name FROM \"User\"");

    query.on('row', function (row) {
        users.push(row.name);
    });

    setTimeout(function() {checkPseudo(pseudo)},2500);
};

checkPseudo = function(pseudo) {
    var isAlreadyChosen = false;
    for (var i=0; i<users.length; i++) {
        // Si il existe déjà
        if (users[i] == pseudo) isAlreadyChosen = true;
    }
    io.sockets.emit("alreadyChosen",isAlreadyChosen);

};

getDataBase = function() {

    var params = {
        host: 'ec2-54-163-225-82.compute-1.amazonaws.com',
        user: 'yaedbmcycdqwmw',
        password: 'Ka-ojSGHcdGx_55g8V7gDoG3Iw',
        database: 'dlk8867oe0a8d',
        ssl: true
    };

    var client = new pg.Client(params);
    client.connect();

    var query = client.query("SELECT name FROM \"User\"");

    query.on('row', function (row) {
        io.sockets.emit('dataSent',row);
        //$('#id').text()
    });

};
