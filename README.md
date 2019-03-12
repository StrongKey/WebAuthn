# WebAuthn
This project is a sample WebAuthn JavaScript/HTML web page written to work with StrongKey's [FIDO2 Server, Community Edition](../FIDO-Server) and sample [Relying Party web application](https://github.com/StrongKey/relying-party-java).

The goal of this project is to demonstrate how to use the JavaScript calls built into [WebAuthn](https://www.w3.org/TR/webauthn/)-compliant [web browsers](https://caniuse.com/#search=webauthn). It explains how to parse the JSON values returned by StrongKey's FIDO2 Server when calling the WebAuthn API. **If you are a front-end developer looking to call the WebAuthn API, [this code](https://github.com/StrongKey/WebAuthn/blob/master/dist/js/fido2demo.js) demonstrates how to do so.**

Click these links to learn more:

- [WebAuthn](https://en.wikipedia.org/wiki/WebAuthn) on Wikipedia
- Browse the entire [W3 Schools Web Authentication specification](https://www.w3.org/TR/webauthn/)
- Or, for a good visual of WebAuthn API calls in action, see [these diagrams](https://www.w3.org/TR/webauthn/#api)

Follow the instructions below to deploy this project.

## Prerequisites

- This WebAuthn client must have a means of connecting with a StrongKey FIDO2 Server and sample Relying Party web application.  
- You must have a Java web application server. These instructions assume you are using Payara (GlassFish).
- The instructions assume the default ports for all the applications installed; Payara runs HTTPS on port 8181 by default, so make sure all firewall rules allow that port to be accessible.
- **The sample commands below assume you are installing this sample WebAuthn on the same server where StrongKey FIDO2 Server and sample Relying Party web application have been installed.** It is recommended that the sample WebAuthn client is installed after StrongKey FIDO2 Server and the sample Relying Party web application code. If you are installing on a separate server, you may have to adjust the commands accordingly.

## Installation Instructions

1. Switch to (or login as) the _strongkey_ user. The default password for the _strongkey_ user is _ShaZam123_.
  
    ```sh
    su - strongkey
    ```

2. Download the WebAuthn distribution file [WebAuthn.tgz](https://github.com/StrongKey/WebAuthn/blob/master/WebAuthn.tgz).

    ```sh
    wget https://github.com/StrongKey/WebAuthn/raw/master/WebAuthn.tgz
    ```

3. Extract the distribution to the default Payara docroot.

    ```sh
    tar xvzf WebAuthn.tgz -C payara41/glassfish/domains/domain1/docroot/
    ```

4. Now point your browser to the following URL:

    https://\<YOUR SERVER FQDN>:8181/index.html
    
    Remember to be sure that your firewall allows access to port 8181.
    
    **NOTE:** The first time opening the above address may result in a warning from the self-signed certificate. This must be accepted to proceed.  


## Removal
To uninstall the sample WebAuthn client, follow the uninstall instructions in the [FIDO2 Server, Community Edition Installation Guide](https://github.com/StrongKey/FIDO-Server/blob/master/docs/Installation_Guide_Linux.md#removal). Removing the StrongKey FIDO Server also removes the sample RP web application and sample WebAuthn client.

## Contributing to Sample WebAuthn
If you would like to contribute to the [sample WebAuthn client](https://github.com/StrongKey/WebAuthn) project, please read [CONTRIBUTING.md](https://github.com/StrongKey/WebAuthn/blob/master/CONTRIBUTING.md), then sign and return the [Contributor License Agreement (CLA)](https://cla-assistant.io/StrongKey/FIDO-Server).

## Licensing
This project is currently licensed under the [GNU Lesser General Public License v2.1](https://github.com/StrongKey/relying-party-java/blob/master/LICENSE).


