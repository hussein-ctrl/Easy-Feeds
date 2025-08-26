import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchFeedResults = async (q) => {
  const res = await fetch(`${API_BASE}/api/feeds?q=${encodeURIComponent(q)}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch feed results');
};

export const fetchUnsubscribedFeed = async (feedId) => {
  const res = await fetch(`${API_BASE}/api/feeds/${feedId}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch unsubscribed feed');
};

export const createFeedOnly = async (feed) => {
  const res = await fetch(`${API_BASE}/api/feeds`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ feed }),
  });
  return handleResponse(res, 'Failed to create feed');
};

export const removeFeedFromAllCollections = async (feedId) => {
  const res = await fetch(`${API_BASE}/api/feeds/${feedId}/remove_from_collections`, {
    method: 'DELETE',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
  });
  return handleResponse(res, 'Failed to remove feed from all collections');
};