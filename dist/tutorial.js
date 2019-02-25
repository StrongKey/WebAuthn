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

// ES6 class - no compilation required in modern browser
class FidoTutorial {
	constructor() {
		this.server = '/webauthntutorial/';
		this.username = null;
		this.loggedIn = false;
		this.registering = false;
	}

	initUI() {
		// update our session label
		this.isLoggedIn();

		$('#regSubmit').click(() => {
			this.registering = true;
			if (!this.loggedIn) {
				this.post('preregister', {
					"username": $('#regUsername').val(),
					"displayName": $('#regDisplayName').val()
				})
					.done((resp) => {
						if (resp.Error == "true") onError(resp.Message);
						this.register(resp.Response);
					})
					.fail((jqXHR, textStatus, errorThrown) => { 
						this.onError(jqXHR.responseJSON.Message || textStatus); 
					});
			}
			else {
				this.post('preregisterExisting', {
					"displayName": $('#regDisplayName').val()
				})
					.done((resp) => {
						if (resp.Error == "true") onError(resp.Message);
						this.register(resp.Response);
					})
					.fail((jqXHR, textStatus, errorThrown) => { 
						this.onError(jqXHR.responseJSON.Message || textStatus); 
					});
			}
		});

		$('#authSubmit').click(() => {
			this.registering = false;

			this.post('preauthenticate', {
				"username": $('#authUsername').val()
			})
				.done((resp) => {
					if (resp.Error == "true") onError(resp.Message);
					this.authenticate(/* JSON.parse(JSON.stringify(resp)) */ resp.Response);
				})
				.fail((jqXHR, textStatus, errorThrown) => { 
					if (jqXHR.status = 401) {
						this.onError("Username doesn't exist");
					} 
					else {
						this.onError(jqXHR.responseJSON.Message || textStatus); 
					}
				});
		});

		$('#logout').click(() => {
			this.post('logout', null)
				.done((resp) => {
					if (resp.Error == "true") onError(resp.Message);
					$('#regUsername').val('');
					$('#regDisplayName').val('');
					$('#authUsername').val('');
					this.isLoggedIn();
				})
				.fail((jqXHR, textStatus, errorThrown) => { this.onError(textStatus); });
		});
	}

	isLoggedIn() {
		this.post('isLoggedIn', null)
			.done((resp) => {
				if (resp.Error == "true") onError(resp.Message);
				this.username = resp.Response;
				this.loggedIn = !!this.username;
				// should be handling this using binding but keeping it simple for demo
				$('#sessionStatus').text(this.username || "(none)");
				$('#logout').prop('disabled', !this.loggedIn);
				$('#regUsername').prop('disabled', this.loggedIn);
				$('#authUsername').prop('disabled', this.loggedIn);
				$('#authSubmit').prop('disabled', this.loggedIn);				
			})
			.fail((jqXHR, textStatus, errorThrown) => { this.onError(textStatus); });

		return this.isLoggedIn;
	}

	register(preregResponse) {
		let that = this;
		if (preregResponse.serviceErr != null) {
			this.onError(preregResponse.serviceErr.Message);
		}
		else {
			let responseBody = JSON.parse(preregResponse).Response;
			// let responseChallenge = JSON.parse(JSON.stringify(responseBody.challenge));
			let challengeBuffer = this.preregToBuffer(preregResponse);
			let credentialsContainer;
			credentialsContainer = window.navigator;
			credentialsContainer.credentials.create({ publicKey: challengeBuffer.Response })
				.then((resp) => {
					let response = this.preregResponseToBase64(resp);
					if (this.registering) {
						if (!this.loggedIn) {
							this.post('register', response)
								.done(regResponse => that.onRegResult(regResponse))
								.fail((jqXHR, textStatus, errorThrown) => { this.onError(textStatus); });
						}
						else {
							this.post('registerExisting', response)
								.done(regResponse => that.onRegResult(regResponse))
								.fail((jqXHR, textStatus, errorThrown) => { this.onError(textStatus); });
						}
					}
				})
				.catch(error => {
					that.onError(error)
				});
		}
	}

	authenticate(preauthResponse) {
		let that = this;
		if (preauthResponse.serviceErr != null) {
			this.onError(preauthResponse.serviceErr.Message);
		}
		else {
			let challengeBuffer = this.preauthToBuffer(preauthResponse);
			let credentialsContainer;
			credentialsContainer = window.navigator;
			credentialsContainer.credentials.get({ publicKey: challengeBuffer.Response })
				.then((resp) => {
					let response = that.preauthResponseToBase64(resp);
					this.post('authenticate', response)
						.done(authResponse => that.onAuthResult(authResponse))
						.fail((jqXHR, textStatus, errorThrown) => { this.onError(textStatus); });
				})
				.catch((error) => {
					this.onError(error);
				});
		}
	}

	preregToBuffer(input) {
		input = JSON.parse(input);
		input.Response.challenge = base64url.decode(input.Response.challenge);
		input.Response.user.id = base64url.decode(input.Response.user.id);

		if (input.Response.excludeCredentials) {
			for (let i = 0; i < input.Response.excludeCredentials.length; i++) {
				input.Response.excludeCredentials[i].id = input.Response.excludeCredentials[i].id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
				input.Response.excludeCredentials[i].id = base64url.decode(input.Response.excludeCredentials[i].id);
			}
		}
		return input;
	}

	preauthToBuffer(input) {
		input = JSON.parse(input);
		input.Response.challenge = base64url.decode(input.Response.challenge);

		if (input.Response.allowCredentials) {
			for (let i = 0; i < input.Response.allowCredentials.length; i++) {
				// must convert from Base64 to Base64URL safe first
				input.Response.allowCredentials[i].id = input.Response.allowCredentials[i].id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
				input.Response.allowCredentials[i].id = base64url.decode(input.Response.allowCredentials[i].id);
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

	preauthResponseToBase64(input) {
		let copyOfDataResponse = {};
		copyOfDataResponse.id = input.id;
		copyOfDataResponse.rawId = base64url.encode(input.rawId);
		copyOfDataResponse.response = {};
		copyOfDataResponse.response.authenticatorData = base64url.encode(input.response.authenticatorData);
		copyOfDataResponse.response.signature = base64url.encode(input.response.signature);
		copyOfDataResponse.response.userHandle = base64url.encode(input.response.userHandle);
		copyOfDataResponse.response.clientDataJSON = base64url.encode(input.response.clientDataJSON);
		copyOfDataResponse.type = input.type;
		return copyOfDataResponse;
	}

	onRegResult(regResponse) {
		let responseJSON = JSON.parse(JSON.stringify(regResponse));
		if (responseJSON.Error == "true") onError(resp.Message);

		if (responseJSON.Response === "Successfully processed registration response") {
			this.username = $('#regUsername').val();
			// refresh session state
			this.isLoggedIn();
		}
	}

	onAuthResult(authResponse) {
		if (authResponse.Error === "False") {
			let response = authResponse.Response;
			this.isLoggedIn();
		}
		else {
			let errorMsg = JSON.parse(authResponse.Message);
			let authresponse = JSON.parse(errorMsg.authresponse);
			let error = authresponse.Error;
			if (error.includes("ERR")) {
				this.onError(error.split(':')[1]);
			}
			else {
				this.onError(error.Message);
			}
		}
	}

	onError(errMsg) {
		alert(errMsg);
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
}

let app = new FidoTutorial();
app.initUI();
