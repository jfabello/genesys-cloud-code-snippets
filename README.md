# Genesys Cloud Code Snippets

Repository with code snippets that call the Genesys Cloud API

## Instructions

All the instructions below assume that you are on a UNIX compatible shell. For example **bash** or **zsh** on Windows Subsystem for Linux, macOS or Linux.

### Prerequisites

To use the code snippets you need the following:

- A recent version of Node.js installed.
- A Genesys Cloud CX organization.
- OAuth client credentials to access your Genesys Cloud CX organization with enough priviledges.

### Clone the repository on your local computer

Run the following command in a directory where you want the code to be stored:

```shell
git clone https://github.com/jfabello/genesys-cloud-code-snippets.git
```

### Get the required npm packages

Run the following command in the `genesys-cloud-code-snippets` directory:

```shell
npm install
```

### Create a shell script to set your client credentials

Using the `example-set-env-vars.sh` shell script as an example, create your own shell script that sets the required environment variables: `GENESYS_CLOUD_CLIENT_ID`, `GENESYS_CLOUD_CLIENT_SECRET` and `GENESYS_CLOUD_REGION`.

💡 **TIP:** Set your shell script file name with the `set-` prefix and the `-env-vars.sh` suffix so it is protected from being versioned by git or npm. For example, you can name your shell script `set-myorg-env-vars.sh`.

### Set the required environment variables

Run the following command in the `genesys-cloud-code-snippets` directory, replace `set-myorg-env-vars.sh` with your shell script file name:

```shell
source ./set-myorg-env.vars.sh
```

### Run a code snippet

Run the following command in the `genesys-cloud-code-snippets` directory, replace `sample-code-snippet.js` with your shell script name:

```shell
node sample-code-snippet.js
```
