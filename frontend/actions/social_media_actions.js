// social_media_actions.js
// Redux actions for social media posts

import { fetchSocialMediaPosts } from '../util/social_media_api_util';

export const RECEIVE_SOCIAL_MEDIA_POSTS = 'RECEIVE_SOCIAL_MEDIA_POSTS';
export const RECEIVE_SOCIAL_MEDIA_ERROR = 'RECEIVE_SOCIAL_MEDIA_ERROR';

export const receiveSocialMediaPosts = (platform, posts) => ({
  type: RECEIVE_SOCIAL_MEDIA_POSTS,
  platform,
  posts
});

export const receiveSocialMediaError = (platform, error) => ({
  type: RECEIVE_SOCIAL_MEDIA_ERROR,
  platform,
  error
});

// Thunk action

export const fetchPostsForPlatform = (platform, params) => async dispatch => {
  try {
    const data = await fetchSocialMediaPosts(platform, params);
    dispatch(receiveSocialMediaPosts(platform, data.posts || []));
    return data;
  } catch (err) {
    dispatch(receiveSocialMediaError(platform, err.message));
    throw err;
  }
};
