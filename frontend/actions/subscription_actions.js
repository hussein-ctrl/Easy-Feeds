import * as SubscriptionApiUtil from '../util/subscription_api_util';
import * as FeedApiUtil from '../util/feed_api_util';
import { startFeedAction } from './loading_actions';

export const REMOVE_FEED = 'REMOVE_FEED';
export const RECEIVE_SINGLE_FEED = 'RECEIVE_SINGLE_FEED';
export const RECEIVE_NEW_FEED = 'RECEIVE_NEW_FEED';
export const RECEIVE_SUBSCRIPTION_ERRORS = 'RECEIVE_SUBSCRIPTION_ERRORS';
export const RECEIVE_ALL_SUBSCRIPTIONS = 'RECEIVE_ALL_SUBSCRIPTIONS';

const commonAction = type => payload => ({
  type,
  feeds: payload.feeds,
  subscriptions: payload.subscriptions,
  stories: payload.stories
});

export const receiveSingleFeed = commonAction(RECEIVE_SINGLE_FEED);
export const receiveNewFeed = commonAction(RECEIVE_NEW_FEED);

export const startFeedLoading = () => ({ type: 'START_FEED_LOADING' });
export const completeFeedLoading = () => ({ type: 'COMPLETE_FEED_LOADING' });



export const receiveAllSubscriptions = subscriptionsPayload => ({
  type: RECEIVE_ALL_SUBSCRIPTIONS,
  feeds: subscriptionsPayload.feeds,
  subscriptions: subscriptionsPayload.subscriptions
});

export const removeFeed = feedPayload => ({
  type: REMOVE_FEED,
  feeds: feedPayload.feeds,
  subscriptions: feedPayload.subscriptions
});

export const receiveSubscriptionErrors = errors => ({
  type: RECEIVE_SUBSCRIPTION_ERRORS,
  errors
});

export const fetchAllSubscriptions = () => dispatch => {
  return (
    SubscriptionApiUtil.fetchAllSubscriptions()
      .then(
        subscriptionsPayload =>
          dispatch(receiveAllSubscriptions(subscriptionsPayload))
      )
  );
};

export const fetchSingleFeed = (feedId, offset) => dispatch => {
  return (
    SubscriptionApiUtil.fetchSingleFeed(feedId, offset)
      .then(
        feedPayload =>
          dispatch(receiveSingleFeed(feedPayload)),
        errors =>
          dispatch(receiveSubscriptionErrors(errors.responseJSON))
      )
  );
};

export const deleteFeed = (subscriptionId) => (dispatch) => (
  SubscriptionApiUtil.deleteSubscription(subscriptionId)
    .then((deletedFeed) => dispatch(removeFeed(deletedFeed)))
);

export const updateSubscription = subscription => dispatch => {
  return SubscriptionApiUtil.updateSubscription(subscription)
    .then(
      updatedFeed => {
        return dispatch(receiveSingleFeed(updatedFeed));
      },
      errors => {
        return dispatch(receiveSubscriptionErrors(errors.responseJSON));
    });
};

export const createFeed = feed => dispatch => {
  dispatch(startFeedAction(["Subscribing to Feed..."]));
  return (
    SubscriptionApiUtil.createFeed(feed)
    .then(
      newFeed => dispatch(receiveNewFeed(newFeed)),
      errors => dispatch(receiveSubscriptionErrors(errors.responseJSON)))
  );
};

export const createFeedOnly = feed => dispatch => {
  dispatch(startFeedAction(["Adding Feed..."]));
  return FeedApiUtil.createFeedOnly(feed)
    .then(
      result => {
        dispatch(receiveNewFeed({
          feeds: { [result.id]: result },
          stories: result.stories || {}
        }));
        // Refresh popular feeds after success
        if (typeof dispatch.fetchFeedResults === 'function') {
          dispatch.fetchFeedResults("");
        }
        dispatch(startFeedAction([]));
        return result;
      },
      errors => {
        dispatch(receiveSubscriptionErrors(errors.responseJSON));
        dispatch(startFeedAction([]));
        throw errors;
      }
    );
};

// Subscribe to an existing feed (by feed_id only)
export const subscribeExistingFeed = (feed_id) => dispatch => {
  return SubscriptionApiUtil.subscribeExistingFeed(feed_id)
    .then(
      payload => dispatch(receiveNewFeed(payload)),
      errors => dispatch(receiveSubscriptionErrors(errors.responseJSON))
    );
};
