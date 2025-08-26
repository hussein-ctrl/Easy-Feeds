// feeds_reducer.js
import { RECEIVE_FEEDS_RESULTS } from '../actions/discovery_actions';
import { REMOVE_FEED, RECEIVE_NEW_FEED, RECEIVE_SINGLE_FEED, RECEIVE_ALL_SUBSCRIPTIONS }
  from '../actions/subscription_actions';
import { CLEAR_ENTITIES, RECEIVE_CURRENT_USER } from '../actions/session_actions';
import { RECEIVE_LATEST, RECEIVE_READS } from '../actions/story_actions';
import merge from 'lodash-es/merge';
import union from 'lodash-es/union';
import { combineReducers } from 'redux';

const feedsById = (state = {}, action) => {
  Object.freeze(state);
  let newState;

  switch (action.type) {
    case RECEIVE_FEEDS_RESULTS:
      return action.feeds?.byId ? merge({}, state, action.feeds.byId) : merge({}, state, action.feeds);
    case RECEIVE_NEW_FEED:
    case RECEIVE_ALL_SUBSCRIPTIONS:
      {
        const feeds = action.feeds?.byId || action.feeds || {};
        const subscriptions = action.subscriptions?.byId || action.subscriptions || {};
        return merge({}, state, feeds, subscriptions);
      }
    case REMOVE_FEED:
      {
        // Mark the feed as unsubscribed (subscribed: false) instead of removing it
        const feeds = action.feeds?.byId || action.feeds || {};
        const subscriptions = action.subscriptions?.byId || action.subscriptions || {};
        let newState = merge({}, state, feeds, subscriptions);
        // If feed id is present, set subscribed to false
        if (action.feeds && action.feeds.allIds && action.feeds.byId) {
          action.feeds.allIds.forEach(feedId => {
            if (newState[feedId]) {
              newState[feedId].subscribed = false;
            }
          });
        }
        return newState;
      }
    case RECEIVE_LATEST:
    case RECEIVE_READS:
      {
        const feeds = action.feeds?.byId || action.feeds || {};
        const subscriptions = action.subscriptions?.byId || action.subscriptions || {};
        return merge({}, state, feeds, subscriptions);
      }
    case RECEIVE_SINGLE_FEED:
      if (!action.feeds) return state;
      
      if (action.feeds.allIds && action.feeds.byId) {
        const feedId = action.feeds.allIds[0];
        const prevStories = state[feedId]?.stories || [];
        const allStories = union(prevStories, action.feeds.byId[feedId]?.stories || []);
        newState = merge({}, state, action.feeds.byId);
        if (newState[feedId]) {
          newState[feedId].stories = allStories;
        }
        return newState;
      } else {
        return merge({}, state, action.feeds);
      }
    case CLEAR_ENTITIES:
      return {};
    default:
      return state;
  }
};

const allFeedsResults = (state = [], action) => {
  Object.freeze(state);
  switch (action.type) {
    case RECEIVE_NEW_FEED:
      return action.feeds?.allIds ? union(action.feeds.allIds, state) : state;
    case RECEIVE_FEEDS_RESULTS:
      return action.results || state;
    case CLEAR_ENTITIES:
      return [];
    default:
      return state;
  }
};

const isLoading = (state = false, action) => {
  switch (action.type) {
    case 'START_FEED_LOADING':
      return true;
    case 'COMPLETE_FEED_LOADING':
      return false;
    default:
      return state;
  }
};

const feedsReducer = combineReducers({
  byId: feedsById,
  results: allFeedsResults,
  isLoading
});

export default feedsReducer;