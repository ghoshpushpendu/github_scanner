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
    activeWebhooks: Int
  }

  type Query {
    listRepositories: [Repository]
    getRepoDetails(repoName: String!): RepoDetails
  }
`;

const resolvers = {
    Query: {
        listRepositories: async () => {

            const {
                data: { login },
            } = await octokit.rest.users.getAuthenticated();

            console.log('login', login);

            // Fetch list of repositories from GitHub
            const { data } = await octokit.rest.repos.listForAuthenticatedUser();
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
            console.log('filesCount', filesCount);

            // Additional logic to get details like private/public, number of files, content of 1 YAML file, active webhooks, etc.
            // ...

            return {
                name: repo.name,
                size: repo.size,
                owner: repo.owner.login,
                isPrivate: repo.private,
                filesCount: filesCount
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

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
