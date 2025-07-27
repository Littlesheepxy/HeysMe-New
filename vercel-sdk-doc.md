# Get deployment events

import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.getDeploymentEvents({
    idOrUrl: "dpl_5WJWYSyB7BpgTj3EuwF37WMRBXBtPQ2iTMJHJBJyRfd",
    direction: "backward",
    follow: 1,
    limit: 100,
    name: "bld_cotnkcr76",
    since: 1540095775941,
    until: 1540106318643,
    statusCode: "5xx",
    delimiter: 1,
    builds: 1,
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();

# Update deployment integration action

import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  await vercel.integrations.updateIntegrationDeploymentAction({
    deploymentId: "<id>",
    integrationConfigurationId: "<id>",
    resourceId: "<id>",
    action: "<value>",
  });


}

run();

# Get a deployment by ID or URL

import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.getDeployment({
    idOrUrl: "dpl_89qyp1cskzkLrVicDaZoDbjyHuDJ",
    withGitRepoInfo: "true",
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();

# Create a new deployment
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.createDeployment({
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
    requestBody: {
      deploymentId: "dpl_2qn7PZrx89yxY34vEZPD31Y9XVj6",
      files: [
        {
          data: "<value>",
          file: "folder/file.js",
        },
      ],
      gitMetadata: {
        remoteUrl: "https://github.com/vercel/next.js",
        commitAuthorName: "kyliau",
        commitAuthorEmail: "kyliau@example.com",
        commitMessage: "add method to measure Interaction to Next Paint (INP) (#36490)",
        commitRef: "main",
        commitSha: "dc36199b2234c6586ebe05ec94078a895c707e29",
        dirty: true,
      },
      gitSource: {
        ref: "main",
        repoUuid: "123e4567-e89b-12d3-a456-426614174000",
        sha: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
        type: "bitbucket",
        workspaceUuid: "987e6543-e21b-12d3-a456-426614174000",
      },
      meta: {
        "foo": "bar",
      },
      name: "my-instant-deployment",
      project: "my-deployment-project",
      projectSettings: {
        buildCommand: "next build",
        installCommand: "pnpm install",
      },
      target: "production",
    },
  });

  console.log(result);
}

run();

# Create a new deployment
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.cancelDeployment({
    id: "dpl_5WJWYSyB7BpgTj3EuwF37WMRBXBtPQ2iTMJHJBJyRfd",
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();

# Upload Deployment Files
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.uploadFile({
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();

# List Deployment Files

import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.listDeploymentFiles({
    id: "<id>",
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();

# Get Deployment File Contents
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  await vercel.deployments.getDeploymentFileContents({
    id: "<id>",
    fileId: "<id>",
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });


}

run();

# List deployments
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.getDeployments({
    app: "docs",
    from: 1612948664566,
    limit: 10,
    projectId: "QmXGTs7mvAMMC7WW5ebrM33qKG32QK3h4vmQMjmY",
    target: "production",
    to: 1612948664566,
    users: "kr1PsOIzqEL5Xg6M4VZcZosf,K4amb7K9dAt5R2vBJWF32bmY",
    since: 1540095775941,
    until: 1540095775951,
    state: "BUILDING,READY",
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();

# Delete a Deployment
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: "<YOUR_BEARER_TOKEN_HERE>",
});

async function run() {
  const result = await vercel.deployments.deleteDeployment({
    id: "dpl_5WJWYSyB7BpgTj3EuwF37WMRBXBtPQ2iTMJHJBJyRfd",
    url: "https://files-orcin-xi.vercel.app/",
    teamId: "team_1a2b3c4d5e6f7g8h9i0j1k2l",
    slug: "my-team-url-slug",
  });

  console.log(result);
}

run();