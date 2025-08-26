import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchFollowedSocialProfiles = () => {
  return fetch(`${API_BASE}/api/social_media_markeds`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  }).then(res => res.json());
};

export const fetchSocialMediaMarked = async () => {
  const res = await fetch(`${API_BASE}/api/social_media_marked`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch social media marked');
};

export const markSocialMedia = async (id) => {
  const res = await fetch(`${API_BASE}/api/social_media_marked/${id}/mark`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
  });
  return handleResponse(res, 'Failed to mark social media');
};

export const unmarkSocialMedia = async (id) => {
  const res = await fetch(`${API_BASE}/api/social_media_marked/${id}/unmark`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
  });
  return handleResponse(res, 'Failed to unmark social media');
};
