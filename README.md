# WebAuthn
This project is a sample WebAuthn client written to work with the [StrongKey FIDO Server](https://github.com/StrongKey/FIDO-Server) and [sample Relying Party](https://github.com/StrongKey/relying-party-java).


#### Installation Instructions ####

## Prerequisites

- This WebAuthn example has to have a [StrongKey FIDO Server](https://github.com/StrongKey/FIDO-Server) and [sample Relying Party](https://github.com/StrongKey/relying-party-java) to talk to.  
- You must have a Java Application Server. These instructions assume you are using Payara (GlassFish).
- **The sample commands below assume you are installing this RP on the same server as you have previously installed the [StrongKey FIDO Server](https://github.com/StrongKey/FIDO-Server).** If you are installing on a separate server, you may have to adjust the commands accordingly.

1. Switch to (or login as) the strongkey user

```sh
su strongkey
```

2. cd to _/usr/local/strongkey_ (the home directory for the _strongkey_ user).

```sh
cd /usr/local/strongkey
```

3.  Download the WebAuthn distribution file [WebAuthn.tgz](https://github.com/StrongKey/WebAuthn/blob/master/WebAuthn.tgz).

```sh
wget https://github.com/StrongKey/WebAuthn/raw/master/WebAuthn.tgz
```

4. Extract the distribution to the default Payara docroot

```sh
tar xvzf WebAuthn.tgz -C payara41/glassfish/domains/domain1/docroot/
```

5. Now point your browser to the following URL: https://<YOUR SERVER ADDRESS>:8181/tutorial.html. Remember to be sure that your firewall allows access to port 8181.


If you would like to contribute to the [sample WebAuthn client](https://github.com/StrongKey/WebAuthn) project, please read [CONTRIBUTING.md](https://github.com/StrongKey/WebAuthn/blob/master/CONTRIBUTING.md), then sign and return the [Contributor License Agreement (CLA)](https://cla-assistant.io/StrongKey/FIDO-Server).

## Licensing
This project is currently licensed under the [GNU Lesser General Public License v2.1](https://github.com/StrongKey/relying-party-java/blob/master/LICENSE).


