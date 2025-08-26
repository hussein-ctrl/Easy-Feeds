import { combineReducers } from 'redux';
import { RECEIVE_CURRENT_USER } from '../actions/session_actions';
import { REMOVE_FEED, RECEIVE_NEW_FEED, RECEIVE_ALL_SUBSCRIPTIONS  }
  from '../actions/subscription_actions';
import { RECEIVE_LATEST, RECEIVE_READS, RECEIVE_READ, RECEIVE_UNREAD } from '../actions/story_actions';
import { CLEAR_ENTITIES } from '../actions/session_actions';
import merge from 'lodash-es/merge';
import union from 'lodash-es/union';
import remove from 'lodash-es/remove';

const userReducer = (state = null, action) => {
  Object.freeze(state);
  let newState;
  switch (action.type) {
    case RECEIVE_CURRENT_USER:
      return action.currentUser;
    default:
      return state;
  }
};

const subscriptionsReducer = (state = [], action) => {
  Object.freeze(state);
  switch (action.type) {
    case RECEIVE_ALL_SUBSCRIPTIONS:
      return action.feeds?.allIds || [];
    case RECEIVE_NEW_FEED:
      return union(state, action.feeds?.allIds || []);
    case REMOVE_FEED:
      const id = action.feeds?.allIds?.[0];
      return id ? state.filter(el => el !== id) : state;
    case CLEAR_ENTITIES:
      return [];
    default:
      return state;
  }
};

const latestStoriesReducer = (state = [], action) => {
  Object.freeze(state);
  let newState;
  switch (action.type) {
    case RECEIVE_LATEST:
      return union(state, action.stories.allIds);
    case CLEAR_ENTITIES:
      return [];
    default:
      return state;
  }
};

const readsReducer = (state = [], action) => {
  Object.freeze(state);
  let newState;
  switch (action.type) {
    case RECEIVE_UNREAD:
      const id = action.stories.allIds[0];
      return state.filter(el => el !== id);
    case RECEIVE_READ:
      return union(action.stories.allIds, state);
    case RECEIVE_READS:
      return action.stories.allIds;
    case CLEAR_ENTITIES:
      return [];
    default:
      return state;
  }
};

export default combineReducers({
  currentUser: userReducer,
  subscriptions: subscriptionsReducer,
  latest: latestStoriesReducer,
  reads: readsReducer
});
