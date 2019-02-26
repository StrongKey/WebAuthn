# WebAuthn
This project is a sample WebAuthn client written to work with the [StrongKey FIDO Server](https://github.com/StrongKey/FIDO-Server) and [sample Relying Party](https://github.com/StrongKey/relying-party-java). It is intended to demonstrate the basic web service calls needed to register users and keys, and to manage FIDO2 authentication. Follow the instructions below to get a functioning WebAuthn demo for your own use. After you're done, keep reading to learn how to make successful contributions to the sample WebAuthn project.


#### Installation Instructions ####

## Prerequisites

- This WebAuthn example must have a means of connecting with a StrongKey FIDO Server and sample Relying Party.  
- You must have a Java Application Server. These instructions assume you are using Payara (GlassFish).
- The instructions assume the default ports for all the applications installed; Payara runs HTTPS on port 8181 by default, so make sure all firewall rules allow that port to be accessible.
- **The sample commands below assume you are installing this sample WebAuthn on the same server where StrongKey FIDO Server was previously installed.** If you are installing on a separate server, you may have to adjust the commands accordingly.

1. Switch to (or login as) the _strongkey_ user.
  
    ```sh
    su strongkey
    ```

2. Change directory to _/usr/local/strongkey_ (the home directory for the _strongkey_ user).

    ```sh
    cd /usr/local/strongkey
    ```

3. Download the WebAuthn distribution file [WebAuthn.tgz](https://github.com/StrongKey/WebAuthn/blob/master/WebAuthn.tgz).

    ```sh
    wget https://github.com/StrongKey/WebAuthn/raw/master/WebAuthn.tgz
    ```

4. Extract the distribution to the default Payara docroot.

    ```sh
    tar xvzf WebAuthn.tgz -C payara41/glassfish/domains/domain1/docroot/
    ```

5. Now point your browser to the following URL:

    https://\<YOUR SERVER ADDRESS>:8181/tutorial.html
    
    Remember to be sure that your firewall allows access to port 8181.

## Contributing to Sample WebAuthn
If you would like to contribute to the [sample WebAuthn client](https://github.com/StrongKey/WebAuthn) project, please read [CONTRIBUTING.md](https://github.com/StrongKey/WebAuthn/blob/master/CONTRIBUTING.md), then sign and return the [Contributor License Agreement (CLA)](https://cla-assistant.io/StrongKey/FIDO-Server).

## Licensing
This project is currently licensed under the [GNU Lesser General Public License v2.1](https://github.com/StrongKey/relying-party-java/blob/master/LICENSE).


