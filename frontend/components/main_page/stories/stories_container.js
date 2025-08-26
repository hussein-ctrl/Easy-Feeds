import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import StoriesIndex from './stories_index';
import { fetchSingleFeed } from '../../../actions/subscription_actions';
import {
  fetchUnsubscribedFeed, fetchLatest, readStory,
  unreadStory, fetchReads
} from '../../../actions/story_actions';

const mapStateToProps = (state, ownProps) => {
  // Derive section more robustly. If you don't have a `section` param,
  // fall back to parsing but keep a safe default.
  const sectionParam = ownProps.match.params.section; // e.g. "subscriptions", "latest", etc.
  const path = sectionParam || (ownProps.match.url || '').split('/')[2] || 'subscriptions';

  const id = ownProps.match.params.id;
  const feedsById = state.entities?.feeds?.byId || {};
  const storiesById = state.entities?.stories?.byId || {};

  // Feed may exist before its `stories` array is populated
  const feed = feedsById[id] || {};
  const feedStories = Array.isArray(feed.stories) ? feed.stories : [];

  const baseTitle = feed.subscription_title || feed.title || '';
  const titleLink = feed.website_url || null;

  const pathProps = {
    latest:       { title: 'Latest' },
    reads:        { title: 'Recently Read', readView: true },
    discover:     { title: baseTitle, titleLink, previewView: true },
    subscriptions:{ title: baseTitle, titleLink }
  };

  const storyIdsByPath = {
    latest:       Array.isArray(state.session?.latest) ? state.session.latest : [],
    reads:        Array.isArray(state.session?.reads)  ? state.session.reads  : [],
    discover:     feedStories,
    subscriptions:feedStories
  };

  const storyIds = storyIdsByPath[path] || [];
  const stories = storyIds.map(storyId => storiesById[storyId]).filter(Boolean);

  return {
    feeds: feedsById,
    ...pathProps[path],
    stories,
    moreStories: state.ui?.moreStories
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const sectionParam = ownProps.match.params.section;
  const path = sectionParam || (ownProps.match.url || '').split('/')[2] || 'subscriptions';

  const fetchActions = {
    latest:       (_id, offset) => dispatch(fetchLatest(offset)),
    reads:        (_id, offset) => dispatch(fetchReads(offset)),
    discover:     id            => dispatch(fetchUnsubscribedFeed(id)),
    subscriptions:(id, offset)  => dispatch(fetchSingleFeed(id, offset))
  };

  return {
    readStory:   id => dispatch(readStory(id)),
    unreadStory: id => dispatch(unreadStory(id)),
    fetchAction: fetchActions[path]
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StoriesIndex));
