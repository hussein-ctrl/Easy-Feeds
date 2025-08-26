import { API_BASE, buildHeaders, handleResponse } from './api_helpers';

export const fetchSocialMediaPosts = async (platform, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/social_media/${platform}?${queryParams}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res, `Failed to fetch ${platform} posts.`);
};
