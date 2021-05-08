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
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    res.header("Access-Control-Allow-Credentials", true);
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
app.listen(4000, '0.0.0.0', () => {
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

    app.post('/getpicks', async(request, response) => {
        let profileData = await profileModel.findOne({username: request.body.body});
        response.send({picks: profileData.picks, wins: profileData.wins, losses: profileData.losses});
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