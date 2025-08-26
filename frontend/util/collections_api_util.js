import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchCollections = async () => {
  const res = await fetch(`${API_BASE}/api/collections`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch collections');
};

export const fetchCollectionsWithFeedsAndSocialMediaProfiles = async () => {
  const res = await fetch(`${API_BASE}/api/collections/with_feeds_and_social_media_profiles`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, 'Failed to fetch collections with feeds');
};

export const createCollection = async (collection) => {
  const res = await fetch(`${API_BASE}/api/collections`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ collection }),
  });
  return handleResponse(res, 'Failed to create collection');
};

export const updateCollection = async (collection) => {
  const res = await fetch(`${API_BASE}/api/collections/${collection.id}`, {
    method: 'PATCH',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ collection }),
  });
  return handleResponse(res, 'Failed to update collection');
};

export const deleteCollection = async (collectionId) => {
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}`, {
    method: 'DELETE',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
  });
  return handleResponse(res, 'Failed to delete collection');
};

export const addCollectionItem = async (collectionId, itemType, itemId) => {
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}/add_items`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ item_type: itemType, item_id: itemId }),
  });
  return handleResponse(res, 'Failed to add item to collection');
};

export const removeCollectionItem = async (collectionId, itemType, itemId) => {
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}/remove_item`, {
    method: 'DELETE',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ item_type: itemType, item_id: itemId }),
  });
  return handleResponse(res, 'Failed to remove item from collection');
};
