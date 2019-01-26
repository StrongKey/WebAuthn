# What is WebAuthn?
Web Authentication - usually shortened to "**WebAuthn**" - is the JavaScript API for cryptographic authentication that's being standardized by the [W3C](https://www.w3.org/TR/webauthn/) and built into most modern browsers. WebAuthn is one of the elements that work together to provide strong authentication via the FIDO (Fast Identity Online) standard:
- **WebAuthn**: the JavaScript API used to communicate with Authenticators and the FIDO Server.
- **Relying Party**: the web app that communicates to the Authenticator through WebAuthn and to the FIDO Server for user registration and authentication.
- **Authenticator**: a cryptographic device that creates private/public key pairs and verifies user presence and consent through methods like a successful fingerprint scan. Authenticators are accessible to the browser either as an embedded element (such as a fingerprint scanner on a smartphone or laptop) or through USB, Bluetooth Low Energy (BLE), or Near-Field Communication (NFC).
- **FIDO Server**: the authentication server that verifies the identity of the user. The FIDO Server provides the APIs to communicate with the Relying Party.

WebAuthn extends the Credential Management API with a new credential type called `PublicKeyCredential`, which is used for user ***registration*** and ***authentication***:

- **Register**: during registration, a public/private key pair is created on the Authenticator and the public key is registered with the FIDO Server.
- **Authenticate**: during authentication, the FIDO Server verifies the user's possession of the private key.

## Registering a User
When a user wants to register a credential to a web app (referred to as the "Relying Party"):
1. The Relying Party generates a challenge.
2. The Relying Party asks the browser, through the Credential Manager API, to generate a new credential for the Relying Party, specifying device capabilities, e.g., whether the device provides its own user authentication (with biometrics, etc).
3. After the Authenticator obtains user consent, the Authenticator generates a public/private key pair and returns the public key and optional signed attestation to the web app.
4. The Relying Party forwards the public key to the FIDO Server.
5. The FIDO Server stores the public key, coupled with the user identity, to remember the credential for future authentications.

A sample registration example: 
```
let credential = await navigator.credentials.create({ publicKey: {
  challenge: Uint8Array(32) [74, 72, 233, ...]
  rp: {
    id: "example.com",
    name: "Example Web App"
  },
  user: {
    id: Uint8Array(8) [14, 97, 23, 76, 125, 89, 231, 13]
    name: "johndoe",
    displayName: "John Doe"
  },
  pubKeyCredParams: [ {type: "public-key", alg: -7} ]
}});
```

## Authenticating a User
To authenticate a user:
1. The Relying Party generates a challenge and supplies the browser with a list of credentials that are registered to the user. It can also indicate where to look for the credential, e.g., on a local built-in authenticator, or on an external one over USB, BLE, etc.
2. The browser asks the Authenticator to sign the challenge.
3. If the Authenticator contains one of the given credentials, the Authenticator returns a signed assertion to the web app after receiving user consent.
4. The web app forwards the signed assertion to the server for the relying party to verify.
5. Once verified by the server, the authentication flow is considered successful.

A sample Relying Party implementation is below: 
```
let credential = await navigator.credentials.get({ publicKey: {
  challenge: Uint8Array(32) [73, 123, 42, ...]
  rpId: "example.com",
  allowCredentials: [{
    type: "public-key",
    id: Uint8Array(80) [241, 39, 127, ...]
  }],
  userVerification: "required",
}});
```
Try WebAuthn yourself at https://demo.strongkey.com/
