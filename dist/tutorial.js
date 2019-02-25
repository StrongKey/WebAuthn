"use strict";

/*
* Base64URL-ArrayBuffer
* https://github.com/herrjemand/Base64URL-ArrayBuffer
*
* Copyright (c) 2017 Yuriy Ackermann <ackermann.yuriy@gmail.com>
* Copyright (c) 2012 Niklas von Hertzen
* Licensed under the MIT license.
*/
(function () {
	let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	// Use a lookup table to find the index.
	let lookup = new Uint8Array(256);
	for (let i = 0; i < chars.length; i++) {
		lookup[chars.charCodeAt(i)] = i;
	}
	let encode = function (arraybuffer) {
		let bytes = new Uint8Array(arraybuffer),
			i, len = bytes.length, base64url = '';
		for (i = 0; i < len; i += 3) {
			base64url += chars[bytes[i] >> 2];
			base64url += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
			base64url += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
			base64url += chars[bytes[i + 2] & 63];
		}
		if ((len % 3) === 2) {
			base64url = base64url.substring(0, base64url.length - 1);
		} else if (len % 3 === 1) {
			base64url = base64url.substring(0, base64url.length - 2);
		}
		return base64url;
	};
	let decode = function (base64string) {
		let bufferLength = base64string.length * 0.75,
			len = base64string.length, i, p = 0,
			encoded1, encoded2, encoded3, encoded4;
		let bytes = new Uint8Array(bufferLength);
		for (i = 0; i < len; i += 4) {
			encoded1 = lookup[base64string.charCodeAt(i)];
			encoded2 = lookup[base64string.charCodeAt(i + 1)];
			encoded3 = lookup[base64string.charCodeAt(i + 2)];
			encoded4 = lookup[base64string.charCodeAt(i + 3)];
			bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
			bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
		}
		return bytes.buffer
	};
	let methods = {
		'decode': decode,
		'encode': encode
	}
	/**
	* Exporting and stuff
	*/
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = methods;
	} else {
		if (typeof define === 'function' && define.amd) {
			define([], function () {
				return methods
			});
		} else {
			window.base64url = methods;
		}
	}
})();

var textEncoder = new TextEncoder("utf-8");
var textDecoder = new TextDecoder("utf-8");

// ES6 class - no compilation required in modern browser
class FidoTutorial {
	constructor() {
		this.server = '/webauthntutorial/';
		this.loggedIn = false;
		this.registering = false;
	}

	initUI() {
		this.isLoggedIn();

		$('#regSubmit').click(() => {
			if (!this.loggedIn) {
				this.registering = true;
				this.preregister({
					"username": $('#regUsername').val(),
					"displayName": $('#regDisplayName').val()
				})
				.then((resp) => {
					if (resp.Error == "true") onError(resp.Message);
					this.register(resp.Response);
				});
				// .catch(this.handleError);
			}
			else {
				this.preregisterExisting({
					"username": $('#regUsername').val(),
					"displayName": $('#regDisplayName').val()
				});
			}
		});

		$('#authSubmit').click(() => {
			this.registering = false;
			this.preauth({
				"username": $('#regUsername').val(),
				"displayName": $('#regDisplayName').val()
			})
			.then((resp) => {
				if (resp.Error == "true") onError(resp.Message);
				this.authenticate(resp.Response);
			});
			// .catch(this.handleError);
		});
	}

	isLoggedIn() {
		this.post('isLoggedIn', null)
			.then((resp) => {
				if (resp.Error == "true") onError(resp.Message);
				this.loggedIn = (resp.Response === "True");
				$('#sessionStatus').text(this.loggedIn);
			});
			// .catch(this.handleError);
			
		return this.isLoggedIn;
	}

	preregister(data) {
		return this.post('preregister', data);
	}

	register(preregResponse) {
		let that = this;

		if (preregResponse.serviceErr != null) {
			this.onError(preregResponse.serviceErr.Message);
		}
		else {
			let responseBody = JSON.parse(preregResponse).Challenge;
			// let responseChallenge = JSON.parse(JSON.stringify(responseBody.challenge));
			let challengeBuffer = this.preregToBuffer(preregResponse);
			let credentialsContainer;
			credentialsContainer = window.navigator;
			credentialsContainer.credentials.create({ publicKey: challengeBuffer.Challenge })
				.then((resp) => {
					let response = this.preregResponseToBase64(resp);
					// let that = this;
					if (this.registering) {
						if (!this.loggedIn) {
							this.post('register', response)
								.then(regResponse => that.onRegResult(regResponse));
						}
						else {
							this.post('registerExisting', response)
								.then(regResponse => that.onRegResult(regResponse));
						}
					}				
				}).catch(error => {
					that.onError(error.Message)
				});
		}
	}

	preregToBuffer(input) {
		input = JSON.parse(input);
		
		input.Challenge.challenge = window.base64url.decode(input.Challenge.challenge);
		console.log(textDecoder.decode(input.Challenge.challenge));

		input.Challenge.user.id = window.base64url.decode(input.Challenge.user.id);
		if (input.Challenge.excludeCredentials) {
			for (let i = 0; i < input.Challenge.excludeCredentials.length; i++) {
				input.Challenge.excludeCredentials[i].id = input.Challenge.excludeCredentials[i].id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
				input.Challenge.excludeCredentials[i].id = window.base64url.decode(input.Challenge.excludeCredentials[i].id);
			}
		}
		return input;
	}

	preregResponseToBase64(input) {
		let copyOfDataResponse = {};
		copyOfDataResponse.id = input.id;
		copyOfDataResponse.rawId = base64url.encode(input.rawId);
		copyOfDataResponse.response = {};
		copyOfDataResponse.response.attestationObject = base64url.encode(input.response.attestationObject);
		copyOfDataResponse.response.clientDataJSON = base64url.encode(input.response.clientDataJSON);
		copyOfDataResponse.type = input.type;
		return copyOfDataResponse;
	}

	onRegResult(regResponse) {
		let responseJSON = JSON.parse(JSON.stringify(regResponse));
		// let body = JSON.parse(JSON.stringify(responseJSON.body));
		let body = responseJSON;
		let error = body.Error;
		// let message = body.Message;
		let response = body.Response;
		if (response === "Successfully processed registration response") {
			console.log(response);
			let username = this._sharedService.getNewUserName();
			this._sharedService.setUsername(username);
			this.zone.run(() => this._router.navigateByUrl("/profile"));
		} else this.onError(error);
	}

	onError(errMsg) {
		alert(errMsg);
	}

	preregisterExisting(data) {
		this.post('preregisterExisting', data, (respData) => {
			this.registerExisting(respData.Response);
		});
	}

	registerExisting(data) {
		this.post('registerExisting', data, (respData) => {
			this.registerExistingResponse(respData);
		});
	}

	preauthenticate(data) {
		this.post('preauthenticate', data, (respData) => {
			this.preauthenticateResponse(respData);
		});
	}

	authenticate(data) {
		this.post('authenticate', data, (respData) => {
			this.authenticateResponse(respData);
		});
	}

	post(endpoint, data) {
		return $.ajax({
			url: this.server + endpoint,
			type: 'post',
			data: data ? JSON.stringify(data) : null,
			contentType: 'application/json; charset=UTF-8',
			dataType: 'json'
		});
	}

	preregToBuffer(input) {
		input = JSON.parse(input);
		input.Challenge.challenge = base64url.decode(input.Challenge.challenge);
		input.Challenge.user.id = base64url.decode(input.Challenge.user.id);
		if (input.Challenge.excludeCredentials) {
			for (let i = 0; i < input.Challenge.excludeCredentials.length; i++) {
				input.Challenge.excludeCredentials[i].id = input.Challenge.excludeCredentials[i].id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
				input.Challenge.excludeCredentials[i].id = base64url.decode(input.Challenge.excludeCredentials[i].id);
			}
		}
		return input;
	}
}

let app = new FidoTutorial();
app.initUI();
