const { ApolloServer, gql } = require('apollo-server');
const { Octokit } = require('octokit');
require('dotenv').config();

console.log('MY_GITHUB_TOKEN', process.env.GITHUB_TOKEN);
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const typeDefs = gql`
  type Repository {
    name: String
    size: Int
    owner: String
  }

  type RepoDetails {
    name: String
    size: Int
    owner: String
    isPrivate: Boolean
    filesCount: Int
    ymlContent: String
    activeWebhooks: String
  }

  type Query {
    listRepositories: [Repository]
    getRepoDetails(repoName: String!): RepoDetails
  }
`;

const resolvers = {
    Query: {
        listRepositories: async () => {
            // Fetch list of repositories from GitHub
            const { data } = await octokit.rest.repos.listForUser({
                username: 'ghoshpushpendu',
                per_page: 1000,
            });
            return data.map(repo => ({
                name: repo.name,
                size: repo.size,
                owner: repo.owner.login,
            }));
        },
        getRepoDetails: async (_, { repoName }) => {
            // Fetch detailed information about a repository from GitHub
            const { data: repo } = await octokit.rest.repos.get({
                owner: 'ghoshpushpendu',
                repo: repoName,
            });

            const filesCount = await getFileCount(repo.owner.login, repo.name);
            const webhooks = await getActiveWebhooks(repo.owner.login, repo.name);
            const ymlContent = await getContentOfYamlFiles(repo.owner.login, repo.name);

            // Additional logic to get details like private/public, number of files, content of 1 YAML file, active webhooks, etc.
            // ...

            return {
                name: repo.name,
                size: repo.size,
                owner: repo.owner.login,
                isPrivate: repo.private,
                filesCount: filesCount,
                activeWebhooks: webhooks,
                ymlContent: ymlContent,
                // Add other details as needed
            };
        },
    },
};

async function getFileCount(owner, repo) {
    try {
        // Get the root directory content of the repository
        const response = await octokit.rest.repos.getContent({
            owner,
            repo,
        });

        // Filter out files from the response
        const files = response.data.filter(item => item.type === 'file');
        return files.length;
    } catch (error) {
        console.error('Error fetching repository content:', error.message);
    }
}

async function getActiveWebhooks(owner, repo) {
    try {
        // Get the list of webhooks for the repository
        const response = await octokit.rest.repos.listWebhooks({
            owner: owner,
            repo: repo,
        });

        const webhooks = response.data.map(webhook => ({
            id: webhook.id,
            name: webhook.name,
            events: webhook.events,
            config: webhook.config,
            active: webhook.active,
        }));

        return JSON.stringify(webhooks, null, 2);
    } catch (error) {
        console.error('Error fetching webhooks:', error.message);
    }
}

async function getContentOfYamlFiles(owner, repo) {
    try {
        // Get the list of files in the repository
        const response = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: '', // Path to the root directory
        });

        // Filter for YAML files
        const yamlFiles = response.data.filter(file => file.name.endsWith('.yaml') || file.name.endsWith('.yml'));

        if (yamlFiles.length === 0) {
            return 'No YAML files found';
        }
        console.log('YAML files:', yamlFiles);
        // Fetch and log the content of each YAML file
        const contentResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: yamlFiles[0].path,
        });

        // Decode the content from base64
        const content = Buffer.from(contentResponse.data.content, 'base64').toString('utf-8');
        console.log('Content of YAML file:', content);
        return content;

    } catch (error) {
        console.error('Error fetching YAML files:', error.message);
    }
}

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
