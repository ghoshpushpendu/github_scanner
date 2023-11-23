import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const GET_REPO_DETAILS = gql`
  query GetRepoDetails($repoName: String!) {
    getRepoDetails(repoName: $repoName) {
      name
      size
      owner
      isPrivate
      filesCount
      ymlContent
      activeWebhooks
    }
  }
`;

function RepoDetails() {
    const { repoName } = useParams();
    const { loading, error, data } = useQuery(GET_REPO_DETAILS, {
        variables: { repoName },
    });

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const repoDetails = data.getRepoDetails;

    return (
        <div>
            <h2>Repository Details</h2>
            <p>Name: {repoDetails.name}</p>
            <p>Size: {repoDetails.size} KB</p>
            <p>Owner: {repoDetails.owner}</p>
            <p>Private: {repoDetails.isPrivate ? 'Yes' : 'No'}</p>
            <p>Files Count: {repoDetails.filesCount}</p>
            <p>YAML Content: {repoDetails.ymlContent}</p>
            <p>Active Webhooks: {repoDetails.activeWebhooks}</p>
        </div>
    );
}

export default RepoDetails;
