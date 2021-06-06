# Bitbucket migration tool

This is a simple cli tool to migrate a workspace repos from bitbucket to github.

## Prerequisites

- Node v14
- Yarn v1.x
- Git

Your local env should also be setup to access both bitbucket and github since we will use git cli to clone and push.

## Setup

### Install dependencies

Install the dependencies simply by using

```bash
yarn install
```

### Configurations

All the configuration are handled through the .env file, there is a .env.sample file included in the repo so you can just rename it to .env and fill the correct values.

All the following configurations are required:

- BB_USERNAME - your bitbucket account username (is't not the email)
- BB_PASSWORD - your bitbucket account password
- BB_WORKSPACE - the name of the workspace you need to migrate to github
- GH_TOKEN - github access token which you can generate [here](https://github.com/settings/tokens), with all permissions
- GH_ORG - the github organization name you want to migrate the repos to
- GH_TEAM - the name of the team inside the organization which should have access to the repos
- GH_PROTOCOL - the protocol you use to access github on your machine (`https` or `ssh`)
- GH_SUFFIX - the suffix that will be added at the end of the repo name after migration 

## Migrating the repos

To start the migration process just run the `index.js` file using node

```bash
node index.js
```
