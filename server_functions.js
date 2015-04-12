// Le serveur
var io;
// La socket du client
var clientSocket;
var pg = require('pg');
var ent = require('ent');

// Tableau des utilisateurs inscrits à l'évènement
users = [];

//valeur actuelle de mouvement pour savoir si l'utilisateur est connecté
var actualValue=0;

// Fonction appellée par server.js pour initialiser le jeu
// exports sert à pouvoir utiliser cette fonction dans un autre fichier (en l'occurence server.js ici)
exports.initApp = function (paramIO, paramSocket) {
    //on sauvegarde le serveur et la socket dans ce fichier
    io = paramIO;
    clientSocket = paramSocket;
    clientSocket.emit('connected');
    // On écoute les évenements de l'host
    clientSocket.on('recupPseudos', recupPseudos);
    clientSocket.on('talk',talk);
    clientSocket.on('newMessage',newMessage);

    // On écoute les évenements du player
    //clientSocket.on('playerJoinRoom', playerJoinRoom);
};

talk = function(friend,myPseudo){
    io.sockets.in(friend).emit('launchTchat',myPseudo);
};

newMessage = function(message,target) {
    io.sockets.in(target).emit('sendMessage',message);
};


/**
 * Parcours la base de données et ajoute les utilisateurs dans
 * un tableau users en variable globale.
 *
 * @param pseudo Le pseudo rentré par l'utilisateur
 */
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

    var query = client.query("SELECT * FROM \"User\"");

    query.on('row', function (row) {
        users.push(row);
    });

    setTimeout(function() {checkPseudo(pseudo)},2500);
};

/**
 * Vérifie si un pseudo est déjà existant dans la base de donnée.
 * On demandera à la vue d'afficher un message suivant si le booleen
 * (true si déjà existant) est à true ou false.
 *
 * @param pseudo Le pseudo rentré par l'utilisateur
 */
checkPseudo = function(pseudo) {
    pseudo = ent.encode(pseudo);
    var isAlreadyChosen = false;
    for (var i=0; i<users.length; i++) {
        // Si il existe déjà
        if (users[i].name == pseudo) isAlreadyChosen = true;
    }
    if (!isAlreadyChosen) {
        // On crée une room avec comme identifiant le pseudo de l'utilisateur
        clientSocket.join(pseudo);
        addPseudoInDB(pseudo);
        // Affichage pour soi
        io.sockets.in(pseudo).emit("firstDisplay",users);
        // Création des listeners
        for (var i=0; i<users.length; i++) io.sockets.in(pseudo).emit("createListener",users[i].name);
        // Affichage pour les autres
        clientSocket.broadcast.emit('updateDisplay',pseudo);
    }
    else io.sockets.emit("alreadyChosen");
    users = [];
};


addPseudoInDB = function(pseudo) {
    var params = {
        host: 'ec2-54-163-225-82.compute-1.amazonaws.com',
        user: 'yaedbmcycdqwmw',
        password: 'Ka-ojSGHcdGx_55g8V7gDoG3Iw',
        database: 'dlk8867oe0a8d',
        ssl: true
    };

    var client = new pg.Client(params);
    client.connect();

    var query = client.query("INSERT INTO \"User\" (name) VALUES('"+pseudo+"')");
};
