const https = require('https');
const fetch = require("node-fetch");
const crypto = require('crypto');
const moment = require('moment');
const auth = require("./auth.json");

module.exports = class BaseApiCommands {
	constructor() {
		this.devId = auth.apiKeys.smite.devId;
		this.authKey = auth.apiKeys.smite.authKey;
		this.session = null;
		this.privateProfileResult = { "isPrivate": true };
	}

	/**
	 * A HiRez Signature is needed for each API call.
	 * This function takes the parameters and encodes the signature.
	 * @param {any} devId - Provided by HiRez
	 * @param {any} methodName - Determines which api endpoint
	 * @param {any} authKey - Provided by HiRez
	 * @param {any} timestamp
	 */
	createHirezSig(devId, methodName, authKey, timestamp) {
		return new Promise((resolve, reject) => {
			if (!timestamp) timestamp = moment().utc().format('YYYYMMDDHHmmss');
			const hash = crypto.createHash('md5');
			hash.on('error', reject);
			hash.on('readable', () => {
				const data = hash.read();
				if (!data) return reject(new Error('No hash data'));
				return resolve({ signature: data.toString('hex'), timestamp });
			});
			hash.write(`${devId}${methodName.toLowerCase()}${authKey}${timestamp}`);
			hash.end();
		})
	}

	/**
	 * Base Api Method
	 * @param {any} methodName
	 */
	async fetchMethod(methodName) {
		const { signature, timestamp } = await this.createHirezSig(this.devId, methodName, this.authKey);
		const res = await fetch(`http://api.smitegame.com/smiteapi.svc/${methodName}Json/${this.devId}/${signature}/${this.session ? `${this.session}/` : ''}${timestamp}`);
		const resJson = await res.json();
		return resJson;
	}

	/**
	 * Base Api Method with playerId input
	 * @param {any} methodName
	 * @param {any} playerId
	 */
	async fetchMethodWithPlayerId(methodName, playerId) {
		const { signature, timestamp } = await this.createHirezSig(this.devId, methodName, this.authKey);
		const res = await fetch(`http://api.smitegame.com/smiteapi.svc/${methodName}Json/${this.devId}/${signature}/${this.session ? `${this.session}/` : ''}${timestamp}/${playerId}`);
		const resJson = await res.json();
		return resJson;
	}

	/**
	 * Base Api Method with matchId input
	 * @param {any} methodName
	 * @param {any} matchId
	 */
	async fetchMethodWithMatchId(methodName, matchId) {
		const { signature, timestamp } = await this.createHirezSig(this.devId, methodName, this.authKey);
		const res = await fetch(`http://api.smitegame.com/smiteapi.svc/${methodName}Json/${this.devId}/${signature}/${this.session ? `${this.session}/` : ''}${timestamp}/${matchId}`);
		const resJson = await res.json();
		return resJson;
	}

	/**
	 *  Creates the session and stores it.
	 *  The session can expire and will need to be refreshed.
	 */
	async createSession() {
		const session = await this.getSession();
		if (session.ret_msg.toLowerCase() == "approved") {
			console.log("Session SUCCESS", session.session_id);
			this.session = session.session_id;
		} else {
			console.log("Session FAILED");
        }
	}

	async getSession() {
		const session = await this.fetchMethod('createsession');
		return session;
	}

	// The session needs to be null for a successful getSession()
	setSessionToNull() {
		this.session = null;
  }

	async validateSession() {
		const session = await this.fetchMethod('testsession');
		return session;
	}

	async isProfilePrivate(playerName) {
		const player = await this.getPlayerIdByName(playerName);
		return {
			"isPrivate": (player[0].privacy_flag == "y") ? true : false,
			"playerId": player[0].player_id
		}
	}

	async getServerStatus() {
		const status = await this.fetchMethod('gethirezserverstatus');
		return status;
	}

	async getPlayerIdByName(playerName) {
		const methodName = "getplayeridbyname";
		const { signature, timestamp } = await this.createHirezSig(this.devId, methodName, this.authKey);
		const res = await fetch(`http://api.smitegame.com/smiteapi.svc/${methodName}Json/${this.devId}/${signature}/${this.session ? `${this.session}/` : ''}${timestamp}/${playerName}`);
		const resJson = res.json();
		return resJson;
	}

	async getPlayerInfo(playerName) {
		const methodName = "getplayer";
		let playerInfo = await this.isProfilePrivate(playerName);
		if (playerInfo.isPrivate) return this.privateProfileResult;
		const playerId = playerInfo.playerId;
		return await this.fetchMethodWithPlayerId(methodName, playerId);
    }

	async getMotd() {
		const methodName = "getmotd";
		return await this.fetchMethod(methodName);
    }

	async getMatchHistory(playerName) {
		const methodName = "getmatchhistory";
		let playerInfo = await this.isProfilePrivate(playerName)
		if (playerInfo.isPrivate) return this.privateProfileResult;
		const playerId = playerInfo.playerId;
		return await this.fetchMethodWithPlayerId(methodName, playerId);
	}

	async getGodRanks(playerName) {
		const methodName = "getgodranks";
		let playerInfo = await this.isProfilePrivate(playerName)
		if (playerInfo.isPrivate) return this.privateProfileResult;
		const playerId = playerInfo.playerId;
		return await this.fetchMethodWithPlayerId(methodName, playerId);
	}

	async getPlayerStatus(playerName) {

		let playerInfo = await this.isProfilePrivate(playerName);
		if (playerInfo.isPrivate == true) return this.privateProfileResult;
		const playerId = playerInfo.playerId;
		return await this.fetchMethodWithPlayerId("getplayerstatus", playerId);
	}

	async getMatchByMatchId(matchId) {
		const methodName = "getmatchdetails";
		return await this.fetchMethodWithMatchId(methodName, matchId);

	}

	async getMatchPlayerDetailsByMatchId(matchId) {
		const methodName = "getmatchplayerdetails";
		return await this.fetchMethodWithMatchId(methodName, matchId);
	}

}