require('dotenv').config();
const fs = require("fs");

const username = process.env.XD_USERNAME;
const password = process.env.XD_PASSWORD;
const coords = {
    "latitude": parseFloat(process.env.COORDS.split(",")[0]),
    "longitude": parseFloat(process.env.COORDS.split(",")[1]),
};

const screenshotPath = process.env.SCREENSHOTPATH || "./screens";
if (!fs.existsSync(screenshotPath)){
    fs.mkdirSync(screenshotPath);
}

function lanuchConfig(){
    const debug = {
        headless: false,
        args:[
            '--disable-geolocation',
            '--no-sandbox', 
            '--disable-setuid-sandbox'
        ],
    };
    
    const prod = {
        // headless: true, // Default
        args:[
            '--disable-geolocation',
            '--no-sandbox', 
            '--disable-setuid-sandbox'
        ],
    };

    if(process.env.DEBUG == 'true') return debug;
    return prod;
}

if(username === "" || password === ""){
    throw Error("Username or password not configured");
};

if(coords.latitude === "" || coords.longitude === ""){
    throw Error("Geo coordinates not defined");
};

const debug = process.env.DEBUG == 'true'

const mode = process.env.MODE || "yiqingtong"

module.exports = {
    username, password,
    coords,
    lanuchConfig,
    screenshotPath,
    debug,
    mode,
};
