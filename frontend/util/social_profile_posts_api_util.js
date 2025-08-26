import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchSocialProfilePosts = async (profileId) => {
  const res = await fetch(`${API_BASE}/api/social_media_profiles/${profileId}/posts`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch social profile posts');
};

export const createSocialProfilePost = async (profileId, post) => {
  const res = await fetch(`${API_BASE}/api/social_media_profiles/${profileId}/posts`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ post }),
  });
  return handleResponse(res, 'Failed to create social profile post');
};
