import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: 'http://localhost:4000', // Replace with your server's URL
    cache: new InMemoryCache(),
});

export default client;
