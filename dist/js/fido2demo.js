'use strict';

// regular ES6 class
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
		$('#regSubmit').keypress((e) => {
			if (e && e.keyCode == 13) {
				this.submitRegForm();
			}
		});

		$('#regSubmit').click(() => {
			this.submitRegForm();
		});

		$('#regUsername').keypress((e) => {
			if (e && e.keyCode == 13) {
				this.submitRegForm();
			}
		});
		
		$('#regDisplayName').keypress((e) => {
			if (e && e.keyCode == 13) {
				this.submitRegForm();
			}
		});

		$('#authSubmit').keypress((e) => {
			if (e && e.keyCode == 13) {
				this.submitAuthForm();
			}
		});

		$('#authSubmit').click(() => {
			this.submitAuthForm();
		});

		$('#authUsername').keypress((e) => {
			if (e && e.keyCode == 13) {
				this.submitAuthForm();
			}
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

	submitRegForm() {
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
	}

	submitAuthForm() {
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
	}

	// clear view model and update UI
	clearModel() {
		// using MVVM style model
		this.username = null;
		this.displayName = null;
		this.loggedIn = false;
		this.registering = false;

		this.updateView();
	}

	// refresh widgets from view model
	// could use binding but keeping it simple for demo
	updateView() {
		// default to authentication panel when not logged in
		// if user wants to register or is logged in, show registration panel
		// use logout to return to auth panel
		let showRegPanel = (this.loggedIn || this.registering);
		this.setVisible('#authPanel', !showRegPanel);
		this.setVisible('#regPanel', showRegPanel);

		// dim cipher the octopus when user isn't logged in
		if (this.loggedIn) {
			$('.login_logo').removeClass('dimmed');
		}
		else {
			$('.login_logo').addClass('dimmed');
		}

		// truncate username if it's long so it fits neatly in upper right corner
		$('#loginUsername').text(this.elide(this.username, 12) || '');

		// populate reg & auth form fields
		$('#regUsername').val(this.username || '');
		$('#regDisplayName').val(this.displayName || '');
		$('#authUsername').val(this.username || '');

		// reg panel shows only the display name when logged in (this one needs display:none so we use setVisible helper)
		$('#regSubmit').text(this.loggedIn ? 'Register Additional Key' : 'Register New Key');
		this.setVisible('#regUsernamePanel', !this.loggedIn);

		// show/hide the various link actions 
		this.setVisible('#logoutLinkPanel', this.loggedIn);
		this.setVisible('#registerLinkPanel', !this.loggedIn && !this.registering);
		this.setVisible('#authLinkPanel', !this.loggedIn && this.registering);

		$('#metadataContent').css('visibility', this.debugPanelVisible ? 'visible' : 'hidden');
		$('#metadataContent').empty().append(this.fidoData || '');
	}

	// trim string and add ellipsis
	elide(s, len) {
		if (!s) return "";

		if (s.length > len) {
			return s.substr(0, len) + "...";
		}
		return s;
	}

	// hides child elements
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

	// interprets fido credentials response and displays in metadata panel
	displayFIDOData(credResponse) {
		this.fidoData = '';

		// try/catch this so nothing breaks on a failed decode
		try {
			// display fido data if decode functions are available 
			if (typeof TextDecoder !== "undefined") {
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
		catch (err) {
			window.console && console.log(err.message);
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
			// todo: replace this http status switch with map of domain-specific error codes => localized msgs
			switch (jqXHR.status) {
				case 0: 
					msg = 'Network error/server not available';
					break;		
				case 401:
					msg = 'Authentication error/username does not exist';
					break;
				case 409:
					msg = 'Username already exists';
					break;
				default:	
					if (jqXHR.responseJSON && jqXHR.responseJSON.Message) {
						msg = jqXHR.responseJSON.Message;
					}
					break;
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
		// else if (response) {
		// 	// this probably goes away 
		// }
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
