var halveminuut = {};

halveminuut.Config = class {
    constructor() {
        this.players = [];
        this.teams = [];
        this.wordLists = [];

        this.words = {};
        this.loadWords();
    }
    randint(max) {
        return parseInt(Math.random() * max);
    }
    shuffled(list) {
        var order = [];
        var used = {}
        var listLen = list.length;
        while (order.length < list.length) {
            var newNum = this.randint(list.length - order.length);
            while (newNum in used)
                newNum++;
            order.push(newNum);
            used[newNum] = true;
        }
        var newList = [];
        for (var i = 0; i < list.length; ++i) {
            newList.push(list[order[i]]);
        }
        return newList;
    }
    setPlayers(players) {
        this.players = players.slice();

        // Add players so we have a multiple of 2
        if (this.players.length < 2 || (this.players.length % 2) != 0) {
            this.players.push('Alice');
            if (this.players.length < 2)
                this.players.push('Bob');
        }

        this.setTeams(this.generateTeams());
    }
    getPlayers() {
        return this.players.slice(); /* copy */
    }
    generateTeams() {
        var randomPlayers = this.shuffled(this.players);
        var teams = []
        for (var i = 0; i < randomPlayers.length - 1; i += 2) {
            teams.push([randomPlayers[i], randomPlayers[i+1]]);
        }
        return teams;
    }
    setTeams(teams) {
        this.teams = teams;
    }
    getTeams() {
        return this.teams.slice(); /* shallow copy */
    }
    loadWords() {
        var t = this;
        var lists = {
            'Doekes': 'words/doekes.txt',
            'JSVM': 'words/jsvm.txt',
            'Nieuw2019': 'words/nieuw2019.txt',
            'Tweakers2019': 'words/tweakers.txt',
            'Uploaded': 'words/www-data.txt'
        };
        var get_store_func = function(destination) {
            return function(data) {
                var words = data.split('\n');
                for (var i = 0; i < words.length; ++i) {
                    var word = words[i].replace('/^\s+|\s+$/g', '');
                    if (word.length && word.charAt(0) != '#') {
                        destination.push(word);
                    }
                }
            };
        }
        for (var listkey in lists) {
            var destination = t.words[listkey] = [];
            $.get(lists[listkey], get_store_func(destination));
        }
    }
    getWords() {
        // Merge, remove dupes and shuffle
        var dwords = {};
        for (var listkey in this.words) {
            console.log(listkey, this.words[listkey].length);
            for (var i = 0; i < this.words[listkey].length; ++i) {
                dwords[this.words[listkey][i]] = true;
            }
        }
        var words = [];
        for (var word in dwords) {
            words.push(word);
        }
        return this.shuffled(words);
        //return [
        //    'aap', 'noot', 'mies', 'piet', 'henk', 'jan', 'dirk', 'charles',
        //    'aap', 'noot', 'mies', 'piet', 'henk', 'jan', 'dirk', 'charles'];
    }
}

halveminuut.Wizard = class {
    constructor(config, game) {
        this.config = config;
        this.game = game;
        this.nullSetup();
    }
    makeVisible(id, showHeading) {
        //window.location.hash = id;
        $('.blog-post').removeClass('visible');
        var next = $('#' + id).addClass('visible');
        //$('html, body').animate({scrollTop: next.offset().top});
        if (showHeading) {
            $('.blog-header').addClass('visible');
        } else {
            $('.blog-header').removeClass('visible');
        }
        //$('#' + id).find('form input:first').focus();
        next.find(':first')[0].scrollIntoView();
    }
    nullSetup() {
        this.makeVisible('wizard-null', true);
        return false;
    }
    nullConfig(ref) {
        return this.playersSetup(); /* next */
    }
    playersSetup() {
        this.makeVisible('wizard-players');
        return false;
    }
    playersConfig(ref) {
        var players = [];
        $(ref).find('input[name="player[]"]').each(function() {
            var value = this.value.replace(/^\s+|\s+$|[,;:]/g, '');
            if (value) {
                players.push(value);
            }
        });
        this.config.setPlayers(players);

        return this.teamsSetup(); // next
    }
    teamsSetup() {
        var teams = config.getTeams();
        var ret = [];
        for (var i = 0; i < teams.length; ++i) {
            ret.push('<li>' + teams[i].join(' & ') + '</li>');
        }
        $('#wizard-teams p:last').after('<ul>' + ret.join('') + '</ul>');
        /*$('#wizard-teams input[name="team[]"]').each(function() {
            if (teams.length) {
                var next = teams.shift();
                this.value = next.join(', ');
            } else {
                this.value = '';
            }
        });*/

        this.makeVisible('wizard-teams');
        return false;
    }
    teamsConfig(ref) {
    /*
        return this.wordsSetup(); // next
    }
    wordsSetup() {
        this.makeVisible('wizard-words');
        return false;
    }
    wordsConfig(ref) {
    */
        this.makeVisible('game');
        return game.start(); /* next */
    }
}

halveminuut.Game = class {
    constructor(config) {
        this.config = config;
        this.beep = new Audio(halveminuut.AUDIO);
    }
    start() {
        this.wordIndex = 0;
        this.words = this.config.getWords();
        this.teams = this.config.getTeams();

        //window.location.hash = 'game';
        $('#game input').blur(); /* don't auto-accept enter */

        this.turnIndex = -1
        this.nextTurn();
        return false;
    }
    getTeamIndex() {
        return this.turnIndex % this.teams.length;
    }
    getPlayerIndex() {
        var teamIndex = this.getTeamIndex();
        return parseInt((this.turnIndex - teamIndex) / this.teams.length) % (
            this.teams[teamIndex].length);
    }
    nextTurn() {
        this.turnTime = 30;
        this.turnIndex += 1;
        this.cardsThisTurn = 0;
        $('#turn-pre').show();
        $('#turn').removeClass('done').hide();
        $('#turn .cards').html('');
        $('#turn .another').show();
        $('#turn .nextturn').hide();
        this.updateInfo();
        $('#game :first')[0].scrollIntoView();
        return false;
    }
    endTurn() {
        $('#turn').addClass('done');
        $('#turn .another').hide();
        $('#turn .nextturn').show();
        // Real audio. Not fake this time.
        this.beep.volume = 1.0;
        this.beep.play();
    }
    startTurn() {
        $('#turn-pre').hide();
        $('#turn').show();
        this.nextCard();
        this.startTimer();
        // Fake audio press, because Android won't let me play without a call from a click.
        this.beep.volume = 0.0;
        this.beep.play();
        return false;
    }
    startTimer() {
        var t = this;
        this.timer = setInterval(function() { t.onTimer(); }, 1000);
        this.updateTime();
    }
    onTimer() {
        this.turnTime -= 1;
        this.updateTime();
        if (!this.turnTime) {
            clearInterval(this.timer);
            this.endTurn();
        }
    }
    nextCard() {
        this.cardsThisTurn += 1;
        var nextWords = this.words.slice(this.wordIndex, this.wordIndex + 5);
        if (nextWords.length < 5) {
            alert('Woorden zijn op. Bug :(');
        }
        var card = this.generateCard(nextWords);
        this.wordIndex += 5;
        $('#turn .cards').append(card)
        $('#game input').blur(); /* don't auto-accept enter */
        $('#turn .cards .card:last li:first')[0].scrollIntoView();
    }
    generateCard(words) {
        var ret = ['<div class="card"><ul>'];
        for (var i = 0; i < words.length; ++i) {
            ret.push('<li>' + words[i] + '</li>');
        }
        ret.push('</ul></div>');
        return ret.join('');
    }
    anotherCard() {
        var maxCards = 2;
        if (this.cardsThisTurn < maxCards) {
            this.nextCard();
            if (this.cardsThisTurn == maxCards) {
                $('#turn .another').hide();
            }
        }
        return false;
    }
    currentTeam() {
        return this.teams[this.getTeamIndex()];
    }
    currentQuestioner() {
        return this.currentTeam()[this.getPlayerIndex()];
    }
    currentAnswerer() {
        var team = this.currentTeam();
        return team[(this.getPlayerIndex() + 1) % team.length];
    }
    teamsAsOl() {
        var ret = ['<ol>'];
        var teamIndex = this.getTeamIndex();
        var playerIndex = this.getPlayerIndex();
        for (var i = 0; i < this.teams.length; ++i) {
            var players = [];
            for (var j = 0; j < this.teams[i].length; ++j) {
                if (i == teamIndex && j == playerIndex) {
                    players.push('<strong>' + this.teams[i][j] + '</strong>');
                } else {
                    players.push(this.teams[i][j]);
                }
            }
            ret.push('<li>' + players.join(', ') + '</li>');
        }
        ret.push('</ol>');
        return ret.join('');
    }
    gameAsUl() {
        var ret = ['<ul>'];
        ret.push('<li>' + this.words.length + ' woorden</li>');
        ret.push('<li>' + (parseInt(this.turnIndex / this.teams.length) + 1) + 'e beurt</li>');
        ret.push('</ul>');
        return ret.join('');
    }
    updateInfo() {
        // TODO: this is something for an observer, yes?
        $('#game .blog-post-title').html(this.currentQuestioner().toUpperCase() + ' is aan zet');
        $('#game .blog-post-meta').html(this.currentAnswerer().toUpperCase() + ' mag <em>NIET</em> meekijken');
        $('#info-teams').html(this.teamsAsOl());
        $('#info-game').html(this.gameAsUl());
    }
    updateTime() {
        if (!this.turnTime) {
            $('#info-time').html('-');
        } else {
            $('#info-time').html(this.turnTime);
        }
    }
}

halveminuut.AUDIO = ("data:audio/wav;base64," +
"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" +
"RYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////" +
"////////////////////////////////////////////////////////////////////////////" +
"////////////////////////////////////////////////////////////////////////////" +
"////////////////////////////////////////////////////////////////////////////" +
"////////////////////////////////////////////////////////////////////////////" +
"////////////////////////////////////////////////////////////////////////////" +
"////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUA" +
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6" +
"Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");

// vim: set ts=8 sw=4 sts=4 et ai:
