import React from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_REPOS = gql`
  query {
    listRepositories {
      name
      size
      owner
    }
  }
`;

function RepoList() {
  const { loading, error, data } = useQuery(GET_REPOS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>List of Repositories</h2>
      <ul>
        {data.listRepositories.map(repo => (
          <li style={{
            cursor: 'pointer',
            padding: '2px'
          }}
            key={repo.name} onClick={() => {
              window.location.href = `/repos/${repo.name}`;
            }}>
            {repo.name} - {repo.size} KB - {repo.owner}
          </li>
        ))}
      </ul>
    </div >
  );
}

export default RepoList;
