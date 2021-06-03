require("dotenv").config();
const { Bitbucket } = require("bitbucket");
const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const chalk = require("chalk");
const clui = require("clui");
const Progress = clui.Progress;

const clientOptions = {
  auth: {
    username: process.env.BB_USERNAME,
    password: process.env.BB_PASSWORD,
  },
};

const bitbucket = new Bitbucket(clientOptions);
const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const migrationProgress = new Progress(30);
const successList = [];
const failureList = [];

const createRepo = async (repo, team, cloneUrl) => {
  const githubRepo = await octokit.rest.repos.createInOrg({
    org: process.env.GH_ORG,
    name: repo.name,
    private: true,
    team_id: team.data.id,
  });
  console.log(`cloning ${repo.name} ...`);
  execSync(`git clone --bare ${cloneUrl}`);
  console.log(`pushing ${repo.name} ...`);
  execSync(`git push --mirror ${githubRepo.data.clone_url}`, {
    cwd: `./${repo.name}.git`,
  });
  console.log(`cleaning up ${repo.name} ...`);
  execSync(`rm -rf ${repo.name}.git`);
  successList.push(`${repo.name} - ${githubRepo.data.html_url}`);
  console.log(chalk.green(`done migrating ${repo.name}`));
  return true;
};

const createRepos = async () => {
  const team = await octokit.rest.teams
    .getByName({
      org: process.env.GH_ORG,
      team_slug: process.env.GH_TEAM,
    })
    .catch(() => {
      console.log(chalk.bgRed.black(" Couldn't find org or team in Github "));
      console.log(
        "*** Please check your Github configuration in the .env file ***"
      );
      process.exit(1);
    });
  const bbRepos = await bitbucket.repositories
    .list({
      workspace: process.env.BB_WORKSPACE,
      pagelen: 100,
    })
    .catch(() => {
      console.log(
        chalk.bgRed.black(
          " Couldn't fetch repos for the provided bitbucket workspace "
        )
      );
      console.log(
        "*** Please check your bitbucket configuration in the .env file ***"
      );
      process.exit(1);
    });

  const reposCount = bbRepos.data?.values?.length;

  if (!reposCount)
    console.log(
      chalk.bgRed.black(` No repos found in ${process.env.BB_WORKSPACE} `)
    );
  console.log(
    chalk.green(` ${reposCount} repo is found in ${process.env.BB_WORKSPACE}`)
  );

  console.log("Starting the migrating process ...");
  console.log(migrationProgress.update(0, reposCount));
  for (let index = 0; index < reposCount; index++) {
    const repo = bbRepos.data.values[index];
    console.log(`creacting ${repo.name} on Github ...`);
    const cloneUrl = repo.links.clone.find(
      (i) => (i.name = process.env.GH_PROTOCOL)
    ).href;
    try {
      await createRepo(repo, team, cloneUrl);
    } catch {
      failureList.push(`${repo.name}`);
      console.log(
        chalk.bgRed.black(` Repo ${repo.name} already exists on Github `)
      );
      console.log("*** This repo will be ignored ***");
    } finally {
      console.log(migrationProgress.update(index + 1, reposCount));
    }
  }
  console.log(
    chalk.bgGreen.black(
      ` ${successList.length} repos were migrated successfuly `
    )
  );
  console.log(chalk.green(successList.join("\n")));
  console.log(
    chalk.bgRed.black(` ${failureList.length} repos were not migrated `)
  );
  console.log(chalk.red(failureList.join("\n")));
};

createRepos();
