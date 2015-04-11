// Le serveur
var io;
// La socket du client
var clientSocket;
fs = require('fs');

// Fonction appellée par server.js pour initialiser le jeu
// exports sert à pouvoir utiliser cette fonction dans un autre fichier (en l'occurence server.js ici)
exports.initHost = function (paramIO, paramSocket) {
    //on sauvegarde le serveur et la socket dans ce fichier
    io = paramIO;
    clientSocket = paramSocket;
    clientSocket.emit('connected');

    // On écoute les évenements de l'host
    clientSocket.on('hostCreateNewRoom', hostCreateNewRoom);
    clientSocket.on('hostRoomFull', hostPrepareGame);
    clientSocket.on('hostQuizzCountdownFinished', hostStartQuizz);
    clientSocket.on('hostMvtCountdownFinished', hostStartMvt);
    clientSocket.on('hostNextRound', hostNextRound);

    // On écoute les évenements du player
    clientSocket.on('playerJoinRoom', playerJoinRoom);
    clientSocket.on('playerAnswer', playerAnswer);
    clientSocket.on('playerRestart', playerRestart);
};

//quand on a rentré tous les paramètres on va sur la page classique host et cette fonction est appelée
function hostCreateNewRoom() {
    // on crée une room unique socket io
    var roomId = ( Math.random() * 100 ) | 0;

    // on envoie l'id de la room et l'id de la socket au navigateur du smartphone
    this.emit('newRoomCreated', {roomId: roomId, mySocketId: this.id});

    // on rejoint la room et on attend les autres joueurs
    this.join(roomId.toString());
};

//tout le monde a rejoint la room, on l'indique à l'host
function hostPrepareGame(roomId) {
    var sock = this;
    var data = {
        mySocketId: sock.id,
        roomId: roomId
    };
    //in avec un room id en paramètre permet d'envoyer seulement aux participants de la room
    io.sockets.in(data.roomId).emit('beginNewGame', data);
}

//le compta a rebours est fini, on lance le jeu quizz
function hostStartQuizz(roomId) {
    sendQuestion(0, roomId);
};


//une bonne réponse a été faite, on passe à la question suivante
function hostNextRound(data) {
    if (data.round < questions.questions.length) {
        //on envoie une nouvelle question
        sendQuestion(data.round, data.roomId);
    } else {
        // If the current round exceeds the number of words, send the 'gameOver' event.
        io.sockets.in(data.gameId).emit('gameOver', data);
    }
}

//on capte ce message quand le player a cliqué sur connect
// data contient le pseudo
function oldplayerJoinRoom(data) {
    //on stocke la référence de la socket du player ici
    var sock = this;

    //on regarde si le room id correcpond à une room créee
    var room = clientSocket.manager.rooms["/" + data.roomId];

    //si la room existe bien
    if (room != undefined) {
        //on fixe l'id de la socket dans data
        data.mySocketId = sock.id;

        //on rejoint la room
        sock.join(data.roomId);

        // on envoie un event au client pour lui dire qu'il a bien rejoint la room
        io.sockets.in(data.roomId).emit('playerJoinedRoom', data);

    } else {
        //si la room n'existe pas, on envoie un message d'erreur
        this.emit('error', {message: "NUMERO DE JEU INCORRECT"});
    }
}

//on capte ce message quand le player a cliqué sur connect
// data contient le pseudo
function playerJoinRoom(data) {
    //on stocke la référence de la socket du player ici
    var sock = this;

    // on envoie un event au client pour lui dire qu'il a bien rejoint la room
    io.sockets.emit('playerJoinedRoom', data);

}

//on recoit la réponse proposée par le player
function playerAnswer(data) {
    //on va demander à l'host si c'est la bonne réponse
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}