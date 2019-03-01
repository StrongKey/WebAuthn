'use strict';

// ES6 class - no compilation required in modern browser
class FidoTutorial {
	constructor() {
		this.server = '/webauthntutorial/';
	}

	initComponents() {
		this.initActions();

		this.debugPanelVisible = false;
		this.fidoData = null;
		this.clearModel();

		this.queryLoggedIn();
	}

	// wire up the buttons
	initActions() {
		$('#regSubmit').click(() => {
			this.fidoData = null;

			if (!this.loggedIn) {
				this.post('preregister', {
					'username': $('#regUsername').val(),
					'displayName': $('#regDisplayName').val()
				})
					.done(resp => {
						if (resp.Error == 'true') {
							onError(resp.Message);
							return;
						}
						this.register(resp.Response);
					})
					.fail((jqXHR, textStatus, errorThrown) => {
						this.onFailError(jqXHR, textStatus, errorThrown);
					});
			}
			else {
				this.post('preregisterExisting', {
					'displayName': $('#regDisplayName').val()
				})
					.done(resp => {
						if (resp.Error == 'true') {
							onError(resp.Message);
							return;
						}
						this.register(resp.Response);
					})
					.fail((jqXHR, textStatus, errorThrown) => {
						this.onFailError(jqXHR, textStatus, errorThrown);
					});
			}
		});

		$('#authSubmit').click(() => {
			this.fidoData = null;

			this.post('preauthenticate', {
				'username': $('#authUsername').val()
			})
				.done((resp) => {
					if (resp.Error == 'true') {
						onError(resp.Message);
						return;
					}
					this.authenticate(/* JSON.parse(JSON.stringify(resp)) */ resp.Response);
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					this.onFailError(jqXHR, textStatus, errorThrown);
				});
		});

		$('#logout').click(() => {
			this.post('logout', null)
				.done(resp => {
					if (resp.Error != 'true') {
						this.fidoData = null;
						this.clearModel();
						this.queryLoggedIn();
					}
					else {
						onError(resp.Message);
					}
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					this.onFailError(jqXHR, textStatus, errorThrown);
				});
		});

		$('#showRegPanel').click(() => {
			this.registering = true;
			this.updateView();
		});	

		$('#showAuthPanel').click(() => {
			this.registering = false;
			this.updateView();
		});	

		$('#fidoCheckbox').click(() => {
			this.debugPanelVisible = !this.debugPanelVisible;
			this.updateView();
		});
	}

	// clear view model and update UI
	clearModel() {
		// using MVVM style model
		this.username = null;
		this.displayName = null;
		this.loggedIn = false;
		this.registering = false;

		// this.debugPanelVisible = false;
		// this.fidoData = null;

		this.updateView();
	}

	// refresh widgets from view model
	updateView() {
		// default to authentication panel when not logged in
		// if user wants to register or is logged in, show registration panel
		// use logout to return to auth panel
		let showRegPanel = (this.loggedIn || this.registering);
		this.setVisible('#authPanel', !showRegPanel);
		this.setVisible('#regPanel', showRegPanel);

		if (this.loggedIn) {
			$('.login_logo').removeClass('dimmed');
		}
		else {
			$('.login_logo').addClass('dimmed');
		}

		// could use binding but keeping it simple for demo
		$('#loginUsername').text(this.elide(this.username, 12) || '');
		$('#authUsername').val(this.username || '');
		$('#regUsername').val(this.username || '');
		$('#regDisplayName').val(this.displayName || '');

		$('#regSubmit').text(this.loggedIn ? 'Register Additional Key' : 'Register New Key');
		// this needs display:none
		this.setVisible('#regUsernamePanel', !this.loggedIn);

		$('#authUsername').css('visibility', !this.loggedIn ? 'visible' : 'hidden');

		this.setVisible('#logoutLinkPanel', this.loggedIn);
		this.setVisible('#registerLinkPanel', !this.loggedIn && !this.registering);
		this.setVisible('#authLinkPanel', !this.loggedIn && this.registering);

		$('#authSubmit').prop('disabled', this.loggedIn);

		$('#metadataContent').css('visibility', this.debugPanelVisible ? 'visible' : 'hidden');
		$('#metadataContent').empty().append(this.fidoData || '');

		// $('#regUsername').prop('disabled', this.loggedIn);
		// $('#authUsername').prop('disabled', this.loggedIn);
	}

	elide(s, len) {
		if (!s) return "";

		if (s.length > len) {
			return s.substr(0, len) + "...";
		}
		return s;
	}

	setVisible(element, value) {
		$(element).css('visibility', value ? 'visible' : 'hidden');
		// to hide child elements
		$(element).css('display', value ? 'block' : 'none');
	}

	// update session status in model and update UI
	queryLoggedIn() {
		this.post('isLoggedIn', null)
			.done(resp => {
				if (resp.Error != 'true') {
					this.username = resp.Response;
					this.loggedIn = !!this.username;
					this.updateView();
				}
				else {
					onError(resp.Message);
				}
			})
			.fail((jqXHR, textStatus, errorThrown) => {
				this.onFailError(jqXHR, textStatus, errorThrown);
			});
	}

	displayFIDOData(credResponse) {
		// another way to go: record all the fields in the model and add a toString() method
		this.fidoData = '';

		// $('#metadataContent').append('type: ' + credResponse.type);

		// display fido data if decode functions are available 
		if (TextDecoder) {				
			let clientData = base64url.decode(credResponse.response.clientDataJSON);
			let textDecoder = new TextDecoder('utf-8');
			let clientData2 = textDecoder.decode(clientData);
			clientData2 = JSON.parse(clientData2);
			this.fidoData += '<p style="margin-top: 0"><span class="fido-data-header">Client Data</span></p>';
			this.fidoData += '<ul>';
			for (let key of Object.keys(clientData2)) {
				this.fidoData += '<li><span class="fido-data-key">' + key + ':</span> <span class="fido-data-value">' + clientData2[key] + '</span></li>';
			}
			this.fidoData += '</ul>';
		}

		if (CBOR) {
			if (credResponse.response.attestationObject) {
				let attest = base64url.decode(credResponse.response.attestationObject);
				let attest2 = CBOR.decode(attest);
				this.fidoData += '<p><span class="fido-data-header">Attestation</span></p>';
				this.fidoData += '<ul>';
				for (let key of Object.keys(attest2)) {
					this.fidoData += '<li><span class="fido-data-key">' + key + ':</span> <span class="fido-data-value">';
					switch (key) {
						case 'authData':
							this.fidoData += base64js.fromByteArray(attest2[key]);
							break;

						case 'attStmt':
							if (Buffer) {
								this.fidoData += base64js.fromByteArray(new Buffer(JSON.stringify(attest2[key])));
							}
							else {
								this.fidoData += attest2[key];
							}
							break;

						default:
							this.fidoData += attest2[key];
							break;
					}
					this.fidoData += '</span></li>'; 
				}
				this.fidoData += '</ul>';
			}

			// if (Buffer) {
			// 	let authData = parseAuthData(new Buffer(attest2.authData));
			//  this.fidoData += '<p>authData:</p>';
			// 	for (let key of Object.keys(authData)) {
			// 		this.fidoData += '<li>' + key + ': ' + authData[key] + '</li>';
			// 	}
			// }
		}
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
			if (!credentialsContainer.credentials) {
				this.onError('WebAuthn is unsupported by this browser');
				return;
			}
			credentialsContainer.credentials.create({ publicKey: challengeBuffer.Response })
				.then(credResp => {
					let credResponse = this.preregResponseToBase64(credResp);
					this.displayFIDOData(credResponse);
					if (this.registering) {
						if (!this.loggedIn) {
							this.post('register', credResponse)
								.done(regResponse => that.onRegResult(regResponse))
								.fail((jqXHR, textStatus, errorThrown) => {
									this.onFailError(jqXHR, textStatus, errorThrown);
								});
						}
						else {
							this.post('registerExisting', credResponse)
								.done(regResponse => that.onRegResult(regResponse))
								.fail((jqXHR, textStatus, errorThrown) => {
									this.onFailError(jqXHR, textStatus, errorThrown);
								});
						}
					}
				})
				.catch(error => {
					that.onError(error);
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
			if (!credentialsContainer.credentials) {
				this.onError('WebAuthn is unsupported by this browser');
				return;
			}
			credentialsContainer.credentials.get({ publicKey: challengeBuffer.Response })
				.then(credResp => {
					let credResponse = that.preauthResponseToBase64(credResp);
					this.displayFIDOData(credResponse);
					this.post('authenticate', credResponse)
						.done(authResponse => that.onAuthResult(authResponse))
						.fail((jqXHR, textStatus, errorThrown) => {
							this.onFailError(jqXHR, textStatus, errorThrown);
						});
				})
				.catch(error => {
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
				input.Response.excludeCredentials[i].id = input.Response.excludeCredentials[i].id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
				input.Response.allowCredentials[i].id = input.Response.allowCredentials[i].id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
		if (responseJSON.Error == 'true') {
			onError(resp.Message);
			return;
		}

		if (responseJSON.Response === 'Successfully processed registration response') {
			this.clearModel();
			this.queryLoggedIn();
		}
	}

	onAuthResult(authResponse) {
		if (authResponse.Error === 'False') {
			let response = authResponse.Response;
			this.clearModel();
			this.queryLoggedIn();
		}
		else {
			let errorMsg = JSON.parse(authResponse.Message);
			let authresponse = JSON.parse(errorMsg.authresponse);
			let error = authresponse.Error;
			if (error.includes('ERR')) {
				this.onError(error.split(':')[1]);
			}
			else {
				this.onError(error.Message);
			}
		}
	}

	onFailError(jqXHR, textStatus, errorThrown) {
		var msg = '';
		if (jqXHR) {
			if (jqXHR.status === 0) {
				msg = 'Network error/server not available';
			}
			else if (jqXHR.status === 401) {
				msg = 'Authentication error/username does not exist';
			}
			else if (jqXHR.status === 409) {
				// this is a good example of why we want domain-specific error codes
				// simplifies our error handling logic
				// we don't need to worry *which* resource already exists here
				// client just maps keys to localized strings
				// (note: spa and mobile apps may not have server logic to localize)
				msg = 'Username already exists';
			}
			else if (jqXHR.responseJSON) {
				if (jqXHR.responseJSON.Message) {
					msg = jqXHR.responseJSON.Message;
				}
			}
		}

		if (!msg) {
			if (textStatus) {
				msg = textStatus;
			}
			else if (errorThrown) {
				msg = errorThrown;
			}
			else {
				msg = 'An unknown error was encountered';
			}
		}

		alert(msg);
	}

	onResponseError(errMsg, response) {
		var msg;
		if (errMsg) {
			msg = errMsg;
		}
		else if (response) {

		}
		else {
			msg = 'An unknown error was encountered'
		}
		alert(msg);
	}

	onError(errMsg) {
		this.onResponseError(errMsg);
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

$(app.initComponents());

