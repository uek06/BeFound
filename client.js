//nb de joueurs par défaut
var nbPlayers = 2;
//indique le jeu choisi ("quizz" ou "mvt")
var typeOfGame = "";
//indique si on peut capter l'accéléromètre
var motionActivated = false;
//nb de joueurs ayant répondu à la question
var nbAnswers=0;
//index du tableau des players (chaque player aura son index)
var indexPlayer=0;

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
        IO.socket.on('newRoomCreated', IO.onNewRoomCreated);
        IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
        IO.socket.on('beginNewGame', IO.beginNewGame);
        IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
    },

    /**
     * The client is successfully connected!
     */
    onConnected: function () {
        // Cache a copy of the client's socket.IO session ID on the App
        App.mySocketId = IO.socket.socket.sessionid;
    },

    //une room a été crée avec un id de room généré
    //data est de la forme {{ roomId, mySocketId }}
    onNewRoomCreated: function (data) {
        App.Host.gameInit(data);
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
    },



    //le serveur nous confirme que tout le monde a rejoint la room, on lance le compte à rebour
    // (en fonction du role cad host ou player)
    beginNewGame: function (data) {
        App[App.myRole].gameCountdown(data);
    },

    //une réponse a été proposée, on vérifie si c'est bien l'host
    hostCheckAnswer: function (data) {
        if (App.myRole === 'Host') {
            //si on est en phase de réponse
            if (motionActivated) {
                App.Host.stockAnswer(data);
            }
        }
    },

    //affiche une erreur
    error: function (data) {
        alert(data.message);
    }

};

var App = {

    //l'id du game qui est identique à l'id de la room socket (où les players et l'host communiquent)
    roomId: 0,
    //le type du navigateur (soit Player soit Host)
    myRole: '',
    //l'id de l'objet socket io, unique pour chaque player et host.
    //il est généré quand le navigateur se connecte au serveur pour la première fois
    mySocketId: '',

    //numéro du round actuel
    currentRound: 0,

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
        App.$templateJouer = $('#menu-jouer').html();
        App.$templateNbPlayers = $('#menu-nbPlayers').html();
        App.$templateHostGameId = $('#templateHostGameId').html();
        App.$templateJoinGame = $('#templateJoinGame').html();
        App.$templateQuizzGame = $('#templateQuizzGame').html();
    },

    //initialise les différents listeners qui vont écouter les évènements émis par le serveur socket
    //puis lance la fonction appropriée
    initListeners: function () {
        App.$doc.on('click', '#btnJouer', App.Host.onJouer);
        //App.$doc.on('click', '#btnScores', App.Host.onJoinClick);
        App.$doc.on('click', '#btnMouvement', App.Host.onMouvement);
        App.$doc.on('click', '#btnQuizz', App.Host.onQuizz);
        App.$doc.on('click', '#btn1', App.Host.on1);
        App.$doc.on('click', '#btnConnect', App.Player.onPlayerConnect);

    },


    Host: {

        //contient les infos des différents players
        players: [],

        /**
         * Flag to indicate if a new game is starting.
         * This is used after the first game ends, and players initiate a new game
         * without refreshing the browser windows.
         */
        isNewGame: false,

        //nombre de joueurs qui ont rejoint la room
        nbPlayersInRoom: 0,

        //la réponse du round courant (soit H, B, G, D)
        currentCorrectAnswer: '',

        //la réponse du round courant sous sa vraie forme (David Guetta, 1789)...
        currentCorrectAnswerString: '',

        //Quand on clique sur jouer dans le menu
        onJouer: function () {
            App.$main.html(App.$templateJouer);

        },

        //Quand on choisit le jeu des mouvements
        onMouvement: function () {
            //on sauvegarde la décision
            typeOfGame = "mvt";
            App.$main.html(App.$templateNbPlayers);
        },

        //Quand on choisit le jeu du quizz
        onQuizz: function () {
            //on sauvegarde la décision
            typeOfGame = "quizz";
            App.$main.html(App.$templateNbPlayers);
        },

        on1: function () {
            nbPlayers = 1;
            IO.socket.emit('hostCreateNewRoom');
        },

        //lance la room de l'host
        //data est de la forme {{ roomId, mySocketId }}
        gameInit: function (data) {
            App.roomId = data.roomId;
            App.mySocketId = data.mySocketId;
            App.myRole = 'Host';
            App.Host.nbPlayersInRoom = 0;
            App.Host.displayNewGameScreen();
        },

        //affiche le template de l'host avec le lien goog gl et le room id...
        displayNewGameScreen: function () {
            App.$main.html(App.$templateHostGameId);
            $('#gameURL').text("goo.gl/wQLS6f");
            App.doTextFit('#gameURL');
            $('#spanNewGameCode').text(App.roomId);
        },

        //met à jour l'écran d'attente de l'host
        //data contient le room id et le pseudo
        updateWaitingScreen: function (data) {
            // If this is a restarted game, show the screen.
            if (App.Host.isNewGame) {
                App.Host.displayNewGameScreen();
            }
            //on indique que le joueur a rejoint la room
            $('#playersWaiting')
                .append('<p/>')
                .text('LE JOUEUR ' + data.pseudo + ' A REJOINT LA PARTIE');

            //on stocke les informations du player
            App.Host.players.push(data);
            //on incrémente le nb de joueurs dans la room
            App.Host.nbPlayersInRoom += 1;
            //si le nb de joueur correspond au nb voulu
            if (App.Host.nbPlayersInRoom === nbPlayers) {
                // on envoie un event au serveur avec le gameId pour lui dire que la room est full
                IO.socket.emit('hostRoomFull', App.roomId);
            }
        },

        //affiche le compte à rebour de l'host
        gameCountdown: function () {
            // on charge le template de jeu
            App.$main.html(App.$templateQuizzGame);
            App.doTextFit('#hostQuestion');

            //insère les div des scores en fct du nb de joueurs
            var res = "";
            for (var i = 0; i < nbPlayers; i++) {
                var numPlayer = i + 1;
                res += '<div id="player' + numPlayer + '"><span class="playerName">Player ' + numPlayer + '</span><span class="score">0</span><span class="answer"></span></div>';
            }
            $('#playerScoresAnswers').html(res);
            //on commence le timer
            var $secondsLeft = $('#hostQuestion');
            App.countDown($secondsLeft, 5, function () {
                //on commence à capter l'accéléromètre
                motionActivated = true;
                if (typeOfGame == "mvt") {
                    IO.socket.emit('hostMvtCountdownFinished', App.roomId);
                }
                if (typeOfGame == "quizz") {
                    IO.socket.emit('hostQuizzCountdownFinished', App.roomId);
                }
            });

            //on affiche les pseudos des joueurs pour le score
            for (var i = 0; i < App.Host.players.length; i++) {
                //on stocke le num du joueur (à i=0 c'est le player1)
                var numPlayer = i + 1;
                //on remplace par le pseudo du joueur
                $('#player' + numPlayer)
                    .find('.playerName')
                    .html(App.Host.players[i].pseudo);
                //on fixe l'id du joueur au score
                $('#player' + numPlayer)
                    .find('.score')
                    .attr('id', 'score' + App.Host.players[i].mySocketId);
                //on fixe l'id du joueur à la réponse
                $('#player' + numPlayer)
                    .find('.answer')
                    .attr('id', 'answer' + App.Host.players[i].mySocketId);
            }
        },

        //stock la réponse du player
        stockAnswer: function (data) {
            //on vérifie que c'est le bon round
            if (data.round === App.currentRound) {
                nbAnswers++;
                //on récupère le score du joueur qui a répondu (l'id my socket id)
                var $pScore = $('#score' + data.playerId);

                //on affiche que le joueuer a répondu
                $('#answer' + data.playerId).text("A REPONDU");
                //si c'est la bonne réponse
                if (App.Host.currentCorrectAnswer === data.answer) {
                    // Add 5 to the player's score
                    $pScore.text(+$pScore.text() + 10);


                } else {
                    //alert("MAUVAISE REPONSE SALE MERDE");
                    //$('#answerAndWinner').text("NON");
                    // A wrong answer was submitted, so decrement the player's score.
                    $pScore.text(+$pScore.text() + 5);
                }
                App.Host.players[data.index].answer = data.answer;
                if (nbAnswers == nbPlayers) {
                    App.Host.showAnswerAndWinner(data);
                    //on incrémente le numéro de room
                    App.currentRound += 1;
                    //on prépare les données à envoyer au serveur (roomId et le numéro de round)
                    var data = {
                        roomId: App.roomId,
                        round: App.currentRound
                    };
                    lol = data;
                    setTimeout(App.Host.haha, 7000);
                    //on dit au serveur de commencer le prochain round

                }
            }
        }
    },


        Player: {

            // l'id socket de l'host
            hostSocketId: '',

            // le pseudo du player
            pseudo: '',

            index: 0,

            //quand le joueur clique sur commencer sur son mobile, après avoir rentré son pseudo et l'id de la room
            onPlayerConnect: function () {
                //on collecte les infos à envoyer au serveur
                var data = {
                    //pseudo: $('#inputPseudo').val() || 'Anonyme'
                };
                //on envoie donc la room id et le pseudo au serveur
                IO.socket.emit('playerJoinRoom', data);

                //et on sauvegarde les infos du player
                App.myRole = 'Player';
                App.Player.pseudo = data.pseudo;
            },


            //confirme que au joueur qu'il s'est bien connecté à la room
            updateWaitingScreen: function (data) {
                if (IO.socket.socket.sessionid === data.mySocketId) {
                    App.myRole = 'Player';
                    App.roomId = data.roomId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('VOUS AVEZ REJOINT LE JEU NUMERO ' + data.roomId + '. ATTENDEZ QUE LE JEU COMMENCE');
                }
            }
        }

};

IO.init();
App.init();