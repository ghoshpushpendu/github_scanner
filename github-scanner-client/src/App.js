import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RepoList from './components/RepoList';
import RepoDetails from './components/RepoDetails';

import client from './apollo';
import { ApolloProvider } from '@apollo/client';

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <Routes>
          <Route path="/" element={<RepoList />} />
          <Route path="/repos/:repoName" element={<RepoDetails />} />
        </Routes>
      </Router>
    </ApolloProvider>
  );
}

export default App;
