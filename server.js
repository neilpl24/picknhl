require('dotenv').config();
let bodyParser = require('body-parser')
const profileModel = require("./profileSchema")
const Express = require("express");
let app = Express();
let cors = require('cors');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
const mongoose = require('mongoose');
app.get('/', (req, res) => {
    res.send('Hello World!');
  });
app.set('port', 4000);
app.listen(4000, () => {
    try {
        mongoose.connect(process.env.SRV, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
        console.log('Online');
    } catch(error) {
        console.log(error);
    }
});
app.options('/pick', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.end();
  });
    app.post('/pick', async (request, response) => {
        const updateProfile = await profileModel.findOneAndUpdate({
            username: request.body.body.name
        },
            {
            $push: {
                picks: request.body.body.pick
            },
        });
        response.send(updateProfile);
    });

    app.options('/getpicks', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.end();
      });

    app.post('/getpicks', async(request, response) => {
        let profileData = await profileModel.findOne({username: request.body.body});
        response.send({picks: profileData.picks, wins: profileData.wins, losses: profileData.losses});
    });
    app.options('/signup', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.end();
      });
    app.post('/signup', async (request, response) => {
        let profileData = await profileModel.findOne({username: request.body.body.name});
        let profile;
        if(profileData == undefined) {
            profile = profileModel.create({
                username: request.body.body.name,
                password: request.body.body.pass,
            });
            response.send(true);
        } else {
            response.send(false);
        }
    });
    app.options('/login', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.end();
      });
    app.post('/login', async (request, response) => {
        let profileData = await profileModel.findOne({username: request.body.body.name});
        if(profileData == undefined) {
            response.send('There is no account under this username.');
        } else {
            if(profileData.password == request.body.body.pass) {
                response.send(true);
            } else {
                response.send(false);
            }
        }
    });

    app.options('/decide', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.end();
      });

    app.post('/decide', async(request, response) => {
        let profiles = await profileModel.find();
        for(let i=0; i<profiles.length; i++) {
            const picks = profiles[i].picks;
            const winsArray = profiles[i].picks.filter(game => request.body.body.includes(game));
            const wins = winsArray.length;
            const loss = picks.length - wins;
            await profileModel.findOneAndUpdate({
                username: profiles[i].username,
            },
            {
                $inc: {
                    losses: loss,
                    wins: wins,
                },
                $set: {
                    picks: [],
                }
            });
            }
            response.send('Done');
        });