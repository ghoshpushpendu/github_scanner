const { ApolloServer, gql } = require('apollo-server');
const { Octokit } = require('octokit');
const axios = require('axios');
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
            const yamlFile = await findYamlFile(repo.owner.login, repo.name, '');
            let ymlContent = 'No YAML files found';
            console.log('yamlFile', yamlFile);
            if (yamlFile) {
                try {
                    const contentResponse = await axios.get(yamlFile.download_url);
                    ymlContent = contentResponse.data;
                } catch (e) {
                    console.log('e', e)
                }
            } else {
                ymlContent = 'No YAML files found';
            }

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

async function findYamlFile(owner, repo, path = '') {
    try {
        // Get the list of files in the repository
        const filesResponse = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: path, // Path to the root directory
        });

        // Filter for YAML files
        let yamlFile;

        for (const file of filesResponse.data) {
            if (file.type === 'file' && (file.name.endsWith('.yml') || file.name.endsWith('.yaml'))) {
                // Fetch content of the YAML file
                yamlFile = file;
                break;
            } else if (file.type === 'dir') {
                // Recursively scan subdirectory
                const subdirectoryPath = `${path}/${file.name}`;
                const subDirectoryYamlFile = await findYamlFile(owner, repo, subdirectoryPath);
                if (subDirectoryYamlFile) {
                    yamlFile = subDirectoryYamlFile;
                    break;
                }
            }
        }

        return yamlFile;
    } catch (error) {
        console.error('Error fetching YAML files:', error.message);
    }
}

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
