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

            // Additional logic to get details like private/public, number of files, content of 1 YAML file, active webhooks, etc.
            // ...

            return {
                name: repo.name,
                size: repo.size,
                owner: repo.owner.login,
                isPrivate: repo.private,
                // Add other details as needed
            };
        },
    },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
