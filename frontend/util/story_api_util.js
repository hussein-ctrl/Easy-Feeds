import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchLatest = async (offset) => {
  const res = await fetch(`${API_BASE}/api/stories?offset=${offset}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch latest stories');
};

export const fetchStory = async (id) => {
  const res = await fetch(`${API_BASE}/api/stories/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch story');
};

export const readStory = async (id) => {
  const res = await fetch(`${API_BASE}/api/reads`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ read: { story_id: id } }),
  });
  return handleResponse(res, 'Failed to mark story as read');
};

export const unreadStory = async (id) => {
  const res = await fetch(`${API_BASE}/api/reads/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to mark story as unread');
};

export const fetchReads = async (offset) => {
  const res = await fetch(`${API_BASE}/api/reads?offset=${offset}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch reads');
};
