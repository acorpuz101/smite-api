const fs = require("fs");
const path = require("path");
const moment = require("moment");
const express = require('express');

const config = require("./config.json")
const HiRezApi = require("./BaseApiCommands");

const app = express();
const PORT_NUMBER = config.PORT;
const http = require('http').Server(app);

// Configure Express

const hiRezApi = new HiRezApi();


// Configure Routing
app.get('/', (req, res) => {
  return res.send("Smite Microservice is up. Try another endpoint like /motd.");
});

app.get('/motd', async (req, res) => {
  return res.send(await hiRezApi.getMotd());
});

app.get('/status', async (req, res) => {
  return res.send(await hiRezApi.getServerStatus());
});

app.get('/playerId', async (req, res) => {
  const username = req.query.username;
  return res.send(await hiRezApi.getPlayerIdByName(username));
});

app.get('/playerStatus', async (req, res) => {
  const username = req.query.username;
  return res.send(await hiRezApi.getPlayerStatus(username));
});

app.get('/godRanks', async (req, res) => {
  const username = req.query.username;
  return res.send(await hiRezApi.getGodRanks(username));
});

app.get('/matchHistory', async (req, res) => {
  const username = req.query.username;
  return res.send(await hiRezApi.getMatchHistory(username));
});

app.get('/match', async (req, res) => {
  const matchId = req.query.matchId;
  return res.send(await hiRezApi.getMatchByMatchId(matchId));
});

app.get('/matchDetails', async (req, res) => {
  const matchId = req.query.matchId;
  return res.send(await hiRezApi.getMatchPlayerDetailsByMatchId(matchId));
});

// TODO: err handle not-found
app.get('/playerInfo', async (req, res) => {
  const username = req.query.username;
  return res.send(await hiRezApi.getPlayerInfo(username));
});



// Express-Server Start Up
http.listen(PORT_NUMBER, async () => {
  console.log(`listening on *:${PORT_NUMBER}`);
  await hiRezApi.createSession();
});