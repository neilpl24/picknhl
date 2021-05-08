let liveFeed = [];
let loggedIn = sessionStorage.getItem("loggedIn");
let webUser = sessionStorage.getItem('username');
let navDisplayed = sessionStorage.getItem('nav');
async function displaySchedule() {
    if(loggedIn == null && !(window.location.href.includes('login.html') || window.location.href.includes('signup.html'))) {
        window.location.href = "login.html";
    }
    liveFeed = [];
    const scheduleUrl = "https://statsapi.web.nhl.com/api/v1/schedule";
    const response = await fetch(scheduleUrl);
    const schedule = await response.json();
    const games = schedule.dates[0].games.map(game => game.gamePk);
    games.sort();
    for(let i=0; i<games.length; i++) {
        const res = await fetch(`https://statsapi.web.nhl.com/api/v1/game/${games[i]}/feed/live?site=en_nhl`);
        const liveGame = await res.json();
        liveFeed.push(liveGame);
    }
    if(!(window.location.href.includes('login.html') || window.location.href.includes('signup.html'))) {
        const result = await axios({
            method: 'post',
            url: `http://localhost:80/getpicks`,
            data: {
                body: webUser,
            }
        });
        const picks = result.data.picks;
        const gameFeed = $('.gameFeed');
        gameFeed.children().remove();
        let finished = true;
        const wins = result.data.wins;
        const losses = result.data.losses;
        if(sessionStorage.getItem('nav') == null) {
            $('#nav').append($(`<li class="nav-item"><a style="color:white;"class="nav-link">Welcome ${webUser}. Your record is ${wins} wins and ${losses} losses.</a></li>`));
            sessionStorage.setItem('nav', 'random');
        }
            liveFeed.forEach((game) => {
            if(game.gameData.status.abstractGameState != "Final") {
                finished = false;
            }
            const awayTeam = game.gameData.teams.away.name;
            const homeTeam = game.gameData.teams.home.name;
            const awayScore = game.liveData.linescore.teams.away.goals;
            const homeScore = game.liveData.linescore.teams.home.goals;
            const displayDiv = $(`<div class="card text-white bg-success mb-3" style="width: 18rem;float:left;margin: 10px 10px 10px 10px;"></div>`);
            displayDiv.append($(`<div class="card-header">
            ︎ </div>`));
            displayDiv.append($(`<img src="nhl.jpg" class="card-img-top" width="30px" alt="NHL">`));
            const cardDiv = $(`<div class="card-body">`);
            const display = $(`<p class="card-text"><img src="/logos/${awayTeam}.png" width="20px" alt="NHL">${awayTeam}: ${awayScore} <br> <img src="/logos/${homeTeam}.png" width="20px" alt="NHL">${homeTeam}: ${homeScore}</p>`);
            cardDiv.append(display);
            if(game.gameData.status.abstractGameState == 'Final') {
                cardDiv.append($(`<a href="https://www.nhl.com/tv/${game.gamePk}" class="btn btn-danger">Final</a>`));
            } else if(game.liveData.linescore.currentPeriodTimeRemaining != "Final" && game.liveData.linescore >= 1) {
                cardDiv.append($(`<a href="www.nhl66.ir" class="btn btn-successs">Watch the game</a>`));
            } else if(picks.includes(homeTeam) || picks.includes(awayTeam)) {
                cardDiv.append($(`<a href="#" id=${game.gamePk} class="btn btn-success">Pick Made</a>`));
            } else {
                cardDiv.append($(`<a href="#" id=${game.gamePk} class="btn btn-primary" onclick="displayPicks(${game.gamePk}, '${homeTeam}', '${awayTeam}')">Place your pick</a>`));
            }
            displayDiv.append(cardDiv);
            gameFeed.append(displayDiv);
        });
            if(finished && picks.length != 0) {
                let winners = liveFeed.map(game => {
                    const awayTeam = game.gameData.teams.away.name;
                    const homeTeam = game.gameData.teams.home.name;
                    const awayScore = game.liveData.linescore.teams.away.goals;
                    const homeScore = game.liveData.linescore.teams.home.goals;
                    return homeScore > awayScore ? homeTeam : awayTeam;
                });
                updateProfiles(winners);
            }
    } else {
        return;
    }
}

function displayPicks(id, home, away) {
    const button = $(`#${id}`);
    const container = $(`<div class="container" id="tempCon"></div>`);
    const form1 = $(`<div class="form-check"></div>`);
    form1.append($(` <input class="form-check-input" type="radio" name="form" id="${away}">`));
    form1.append($(` <label class="form-check-label" for="away"><img src="/logos/${away}.png" width="20px" alt="NHL">${away}</label>`));
    const form2 = $(`<div class="form-check"></div>`);
    form2.append($(` <input class="form-check-input" type="radio" name="form" id="${home}">`));
    form2.append($(` <label class="form-check-label" for="home"><img src="/logos/${home}.png" width="20px" alt="NHL">${home}</label>`));
    container.append(form1);
    container.append(form2);
    container.append(`<button class="btn btn-success" onclick="sendPicks()">Send Picks</button>`);
    container.append(`<a href="index.html" class="btn btn-danger">Cancel</a>`);
    container.append(`<p>Pick carefully! All decisions are final :)</p>`);
    button.replaceWith(container);
}

async function updateProfiles(winners) {
    const result = await axios({
        method: 'post',
        url: `http://localhost:80/decide`,
        data: {
            body: winners,
        }
    });
    displaySchedule();
}

function logout() {
    sessionStorage.setItem(null);
    window.location.href = 'login.html';
}

async function sendPicks() {
    const team = $($('input[name=form]:checked').closest('.form-check').find("input[type=radio]"))[0].id;
    if(team == undefined) {
        return;
    } else {
        const result = await axios({
            method: 'post',
            url: `http://localhost:80/pick`,
            data: {
                body: {name: webUser, pick: team},
            }
        });
    }
    displaySchedule();
}
async function login() {
    const username = $(`#username`).val();
    const password = $(`#password`).val();
    const userPass = {name: username, pass: password};
     const result = await axios({
        method: 'post',
        url: `http://localhost:80/login`,
        data: {
            body: userPass,
        }
    });
    if(result.data === true) {
        $('#logger').append(`<p>Login successful. Redirecting you to the main site...</p>`);
        sessionStorage.setItem('loggedIn', true);
        sessionStorage.setItem('username', username);
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
    } else if(result.data === false) {
        $('#logger').append(`<p>Incorrect password.</p>`);
    } else {
        $('#logger').append(`<p>There is no account under this username.</p>`);
    }
}
async function signup() {
    const username = $(`#username`).val();
    const password = $(`#password`).val();
    const userPass = {name: username, pass: password};
    const result = await axios({
        method: 'post',
        url: `http://localhost:80/signup`,
        data: {
            body: userPass,
        }
});
    if(result.data === true) {
        $('#signer').append(`<p>Account succesfully created. Redirecting you to the main site...</p>`);
        sessionStorage.setItem('loggedIn', true);
        sessionStorage.setItem('username', username);
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
    } else {
        $('signer').append(`<p>There is already an account under this username.</p>`);
    }
}

displaySchedule();