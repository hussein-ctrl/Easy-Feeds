import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchSingleFeed = async (feedId, offset = 0) => {
  const res = await fetch(`${API_BASE}/api/subscriptions/${feedId}?offset=${offset}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch single feed');
};

export const fetchAllSubscriptions = async () => {
  const res = await fetch(`${API_BASE}/api/subscriptions/`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch subscriptions');
};

export const deleteSubscription = async (subID) => {
  const res = await fetch(`${API_BASE}/api/subscriptions/${subID}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to delete subscription');
};

export const updateSubscription = async (subscription) => {
  const res = await fetch(`${API_BASE}/api/subscriptions/${subscription.id}`, {
    method: 'PATCH',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ subscription }),
  });
  return handleResponse(res, 'Failed to update subscription');
};

export const createFeed = async (feed) => {
  const res = await fetch(`${API_BASE}/api/subscriptions`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ subscription: feed }),
  });
  return handleResponse(res, 'Failed to create feed');
};

export const subscribeExistingFeed = async (feed_id) => {
  const res = await fetch(`${API_BASE}/api/subscriptions/subscribe_existing_feed`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ feed_id }),
  });
  return handleResponse(res, 'Failed to subscribe to existing feed');
};
