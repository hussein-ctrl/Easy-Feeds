import React from 'react';
import AssignToFolderDialog from './AssignToFolderDialog';
import { Link } from 'react-router-dom';
import DiscoverIndexItem from './discover_index_item';
import AddFeedForm from './add_feed_form';
// ...existing code...

class Discover extends React.Component {

  // Handle follow social profile button click
  handleFollowSocialProfile = async (profile) => {
    try {
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch('/api/social_media_markeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({
          platform: profile.platform,
          username: profile.username,
          display_name: profile.display_name || profile.name,
          profile_url: profile.url,
          avatar_url: profile.avatar
        })
      });
      if (!response.ok) throw new Error('Failed to follow profile');
      const marked = await response.json();
      // Fetch collections and open dialog to assign this social profile
      const collectionsRes = await fetch('/api/collections', {
        method: 'GET',
        headers: {
          'X-CSRF-Token': csrfToken || ''
        }
      });
      const collections = await collectionsRes.json();
      this.setState({
        showSocialDialog: true,
        collections,
        selectedCollectionIds: [],
        assigningSocialProfile: marked.social_media_profile_id || (marked.social_media_profile && marked.social_media_profile.id),
        socialError: null
      });
    } catch (err) {
      this.setState({ socialError: 'Could not follow profile.' });
    }
  };
  state = {
    query: "",
    dataBaseSearch: true,
    socialInput: "",
    socialProfile: null,
    socialLoading: false,
    socialError: null,
    showSocialDialog: false,
    collections: [],
    selectedCollectionIds: [],
    assigningSocialProfile: null
  };
  handleSocialCollectionToggle = (colId) => {
    this.setState(prev => {
      const selected = prev.selectedCollectionIds;
      if (selected.includes(colId)) {
        return { selectedCollectionIds: selected.filter(id => id !== colId) };
      } else {
        return { selectedCollectionIds: [...selected, colId] };
      }
    });
  };

  closeSocialDialog = () => {
    this.setState({ showSocialDialog: false, selectedCollectionIds: [], assigningSocialProfile: null });
  };

  confirmAssignSocialProfile = async () => {
    const { selectedCollectionIds, assigningSocialProfile } = this.state;
    if (!assigningSocialProfile || selectedCollectionIds.length === 0) {
      this.setState({ socialError: 'Please select at least one folder.' });
      return;
    }
    try {
      for (const colId of selectedCollectionIds) {
        // itemType is 'SocialMediaProfile', itemId is the social profile id
        await this.props.addCollectionItemAction(colId, 'SocialMediaProfile', assigningSocialProfile);
      }
      window.dispatchEvent(new Event('refresh-navbar-folders'));
      this.closeSocialDialog();
    } catch (e) {
      this.setState({ socialError: 'Could not assign to folder.' });
    }
  };

  componentDidMount() {
    window.document.querySelector(".main-content").scrollTo(0,0);
    this.props.fetchFeedResults(this.state.query);
  }

handleQueryChange = async e => {
  const query = e.target.value;
  this.setState({ query });

  try {
    const results = await this.props.fetchFeedResults(query);
    console.log("API results:", results);
  } catch (err) {
    console.error("Error fetching feeds:", err);
  }
};

  handleSwitch = ({ dataBaseSearch, clearErrors }) => {
    this.setState({ dataBaseSearch });
    clearErrors ? this.props.clearErrors() : null;
  }

  // Social media profile input change (only updates input, not fetch)
  handleSocialInputChange = (e) => {
    const value = e.target.value;
    this.setState({ socialInput: value, socialProfile: null, socialError: null });
  };

  // Social media profile fetch logic (triggered by button click)
  handleSocialProfileSearch = async () => {
    const value = this.state.socialInput;
    if (!value || value.length < 2) return;

    // Detect platform and username
    let platform = null, username = null, url = null;
    const trimmed = value.trim();
    // Instagram
    if (/instagram\.com\//i.test(trimmed)) {
      platform = "Instagram";
      username = trimmed.split("instagram.com/")[1].split(/[/?#]/)[0];
      url = `https://www.instagram.com/${username}/`;
    } else if (/twitter\.com\//i.test(trimmed)) {
      platform = "X";
      username = trimmed.split("twitter.com/")[1].split(/[/?#]/)[0];
      url = `https://twitter.com/${username}`;
    } else if (/youtube\.com\//i.test(trimmed)) {
      platform = "YouTube";
      if (/\/channel\//.test(trimmed)) {
        username = trimmed.split("/channel/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/channel/${username}`;
      } else if (/\/user\//.test(trimmed)) {
        username = trimmed.split("/user/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/user/${username}`;
      } else if (/\/c\//.test(trimmed)) {
        username = trimmed.split("/c/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/c/${username}`;
      }
    } else if (/facebook\.com\//i.test(trimmed)) {
      platform = "Facebook";
      username = trimmed.split("facebook.com/")[1].split(/[/?#]/)[0];
      url = `https://facebook.com/${username}`;
    } else if (trimmed.startsWith('@')) {
      // If user enters @username, try all platforms (prefer X, then Instagram)
      username = trimmed.slice(1);
      platform = "X";
      url = `https://twitter.com/${username}`;
    } else if (/^\w+$/.test(trimmed)) {
      // If user enters just a username, try all platforms (prefer X, then Instagram)
      username = trimmed;
      platform = "X";
      url = `https://twitter.com/${username}`;
    }

    // If the user entered a full URL, always use that for unavatar fallback
    let inputUrl = null;
    try {
      inputUrl = new URL(trimmed);
    } catch (e) {}
    // YouTube
    if (!platform && /youtube\.com\//i.test(trimmed)) {
      platform = "YouTube";
      if (/\/channel\//.test(trimmed)) {
        username = trimmed.split("/channel/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/channel/${username}`;
      } else if (/\/user\//.test(trimmed)) {
        username = trimmed.split("/user/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/user/${username}`;
      } else if (/\/c\//.test(trimmed)) {
        username = trimmed.split("/c/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/c/${username}`;
      }
    }
    // Facebook (profile or page)
    if (!platform && /facebook\.com\//i.test(trimmed)) {
      platform = "Facebook";
      username = trimmed.split("facebook.com/")[1].split(/[/?#]/)[0];
      url = `https://facebook.com/${username}`;
    }

    if (!platform || !username) {
      this.setState({ socialProfile: null, socialError: null });
      return;
    }

    this.setState({ socialLoading: true, socialProfile: null, socialError: null });

    // Fetch profile info (oEmbed or public endpoints)
    try {
      let profile = { platform, username, url };
      // Use backend proxy for Instagram avatars to bypass CORS and always get the real image
      if (platform === "Instagram") {
        // Use relative URL for backend proxy so it works in all environments (dev, prod, behind proxy)
        profile.avatar = `/api/instagram_avatar/${username}`;
        profile.avatarFallback = `/api/instagram_avatar/${username}`;
        profile.bio = null;
        profile.followers = null;
      } else if (platform === "X") {
        profile.avatar = `https://unavatar.io/twitter/${username}`;
        profile.avatarFallback = `https://unavatar.io/twitter/${username}`;
        profile.bio = null;
        profile.followers = null;
      } else if (platform === "YouTube") {
        profile.avatar = `https://unavatar.io/youtube/${username}`;
        profile.avatarFallback = `https://unavatar.io/youtube/${username}`;
        profile.bio = null;
        profile.followers = null;
      } else if (platform === "Facebook") {
        profile.avatar = `https://unavatar.io/facebook/${username}`;
        profile.avatarFallback = `https://unavatar.io/facebook/${username}`;
        profile.bio = null;
        profile.followers = null;
      }
      this.setState({ socialProfile: profile, socialLoading: false, socialError: null });
    } catch (err) {
      this.setState({ socialProfile: null, socialLoading: false, socialError: "Could not fetch profile info." });
    }
  };

  render() {
    const text = this.state.query.length === 0 ? "Popular Feeds" : "Results";
    const { dataBaseSearch, socialInput, socialProfile, socialLoading, socialError } = this.state;

    let section = null;
    if (dataBaseSearch) {
      section = <DataBaseSearch handleQueryChange={this.handleQueryChange} {...this.state} />;
    } else if (!dataBaseSearch && !this.state.socialSection) {
      section = <AddFeedForm {...this.props} />;
    } else if (this.state.socialSection) {
      section = (
        <div style={{ marginTop: 24 }}>
          <h1>Find Social Media Profile</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, maxWidth: 420 }}>
            <i className="fa fa-user-circle" style={{ fontSize: 22, color: '#1976d2' }} aria-hidden="true"></i>
            <input
              type="text"
              value={socialInput}
              onChange={this.handleSocialInputChange}
              placeholder="Enter @username or profile URL (Instagram, X, YouTube, Facebook)"
              style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); this.handleSocialProfileSearch(); } }}
            />
            <button
              onClick={this.handleSocialProfileSearch}
              style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#219653', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginLeft: 4 }}
              disabled={socialLoading || !socialInput || socialInput.length < 2}
            >
              Search
            </button>
          </div>
          {socialLoading && <div style={{ color: '#888', fontSize: 14, margin: '12px 0' }}>Loading...</div>}
          {socialError && <div style={{ color: '#d32f2f', fontSize: 14, margin: '12px 0' }}>{socialError}</div>}
          {socialProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '12px 0', background: '#f8f9fa', borderRadius: 8, padding: 14 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img
                  src={socialProfile.platform === 'Instagram' ? `https://unavatar.io/instagram/${socialProfile.username}` : socialProfile.avatar}
                  alt="avatar"
                  style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #eee', background: '#fff', objectFit: 'cover' }}
                  onError={e => {
                    if (socialProfile.platform === 'Instagram' && !e.target._triedDirect) {
                      e.target._triedDirect = true;
                      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(socialProfile.username || 'User') + '&background=eee&color=555&size=56';
                    } else if (socialProfile.platform === 'Facebook' && !e.target._triedDirect) {
                      e.target._triedDirect = true;
                      const fbUrl = `https://graph.facebook.com/${socialProfile.username}/picture?type=large`;
                      e.target.src = fbUrl;
                    } else {
                      if (e.target) {
                        e.target.onerror = null;
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(socialProfile.username || 'User') + '&background=eee&color=555&size=56';
                      }
                    }
                  }}
                />
                {(socialProfile.platform === 'Instagram' || (socialProfile.url && socialProfile.url.includes('instagram.com'))) && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: '#fff', borderRadius: '50%', padding: 2 }}>
                    <i className="fa fa-instagram" style={{ color: '#E1306C', fontSize: 20 }} aria-hidden="true"></i>
                  </span>
                )}
                {socialProfile.platform === 'Facebook' && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: '#fff', borderRadius: '50%', padding: 2 }}>
                    <i className="fa fa-facebook" style={{ color: '#4267B2', fontSize: 20 }} aria-hidden="true"></i>
                  </span>
                )}
                {(socialProfile.platform === 'X' || socialProfile.platform === 'Twitter') && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: '#fff', borderRadius: '50%', padding: 2 }}>
                    <i className="fa fa-twitter" style={{ color: '#1DA1F2', fontSize: 20 }} aria-hidden="true"></i>
                  </span>
                )}
                {socialProfile.platform === 'YouTube' && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: '#fff', borderRadius: '50%', padding: 2 }}>
                    <i className="fa fa-youtube" style={{ color: '#FF0000', fontSize: 20 }} aria-hidden="true"></i>
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{socialProfile.platform}</div>
                <div style={{ color: '#333', fontSize: 16, margin: '2px 0' }}>@{socialProfile.username}</div>
                {socialProfile.bio && <div style={{ color: '#666', fontSize: 14 }}>{socialProfile.bio}</div>}
                {socialProfile.followers && <div style={{ color: '#888', fontSize: 13 }}>Followers: {socialProfile.followers}</div>}
                <a href={socialProfile.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 500, fontSize: 15, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>View Profile</a>
                <button
                  style={{ marginLeft: 16, padding: '6px 18px', borderRadius: 6, border: 'none', background: '#219653', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'inline-block' }}
                  onClick={() => this.handleFollowSocialProfile(socialProfile)}
                >
                  Follow
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Use feeds.byId and feeds.results from Redux
    const feedsById = this.props.feeds && this.props.feeds.byId ? this.props.feeds.byId : {};
    const feedIds = this.props.feeds && this.props.feeds.results ? this.props.feeds.results : Object.keys(feedsById);
    // Compose the feeds to show in order
    const feedsToShow = {};
    feedIds.forEach(id => {
      if (feedsById[id]) feedsToShow[id] = feedsById[id];
    });
    return(
      <div className="discover-search-index">
        <DiscoverFormSwitch
          handleSwitch={sectionType => {
            if (sectionType.dataBaseSearch !== undefined) {
              this.setState({ dataBaseSearch: sectionType.dataBaseSearch, socialSection: false });
            } else if (sectionType.socialSection) {
              this.setState({ dataBaseSearch: false, socialSection: true });
            }
            if (sectionType.clearErrors) this.props.clearErrors();
          }}
          dataBaseSearch={dataBaseSearch}
          socialSection={this.state.socialSection}
        />

        {section}

        <div className="discover-items">
          <h2>{text}</h2>
          <DiscoverIndexItems
            {...this.props}
            feeds={feedsToShow}
          />
        </div>

        {/* Social Profile Assign Dialog */}
        {this.state.showSocialDialog && (
          <AssignToFolderDialog
            open={this.state.showSocialDialog}
            collections={this.state.collections}
            selectedCollectionIds={this.state.selectedCollectionIds}
            onToggle={this.handleSocialCollectionToggle}
            onCancel={this.closeSocialDialog}
            onAssign={this.confirmAssignSocialProfile}
            error={this.state.socialError}
          />
        )}
      </div>
    );
  }
}

function DiscoverFormSwitch({ handleSwitch, dataBaseSearch, socialSection }) {
  return (
    <div className="discover-form-switch" style={{ display: 'flex', alignItems: 'flex-end', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 24 }}>
      <div className={`discover-search-button no-select ${dataBaseSearch && !socialSection ? "selected" : ""}`}
        onClick={e => handleSwitch({dataBaseSearch: true, clearErrors: true})}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 8px 0', fontSize: 18, color: dataBaseSearch && !socialSection ? '#219653' : '#888', fontWeight: dataBaseSearch && !socialSection ? 600 : 400, borderBottom: dataBaseSearch && !socialSection ? '3px solid #219653' : '3px solid transparent', cursor: 'pointer', background: 'none', boxShadow: 'none', outline: 'none', transition: 'color 0.2s, border-bottom 0.2s'
        }}
      >
        <i className="fa fa-rss" aria-hidden="true"></i>
        <span>Search</span>
      </div>
      <div className={`discover-add-url-button no-select ${!dataBaseSearch && !socialSection ? "selected" : ""}`}
        onClick={e => handleSwitch({dataBaseSearch: false, socialSection: false})}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 8px 0', fontSize: 18, color: !dataBaseSearch && !socialSection ? '#219653' : '#888', fontWeight: !dataBaseSearch && !socialSection ? 600 : 400, borderBottom: !dataBaseSearch && !socialSection ? '3px solid #219653' : '3px solid transparent', cursor: 'pointer', background: 'none', boxShadow: 'none', outline: 'none', transition: 'color 0.2s, border-bottom 0.2s'
        }}
      >
        <i className="fa fa-link" aria-hidden="true"></i>
        <span>Add URL</span>
      </div>
      <div className={`discover-social-profile-tab no-select ${socialSection ? "selected" : ""}`}
        onClick={e => handleSwitch({socialSection: true})}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 8px 0', fontSize: 18, color: socialSection ? '#219653' : '#888', fontWeight: socialSection ? 600 : 400, borderBottom: socialSection ? '3px solid #219653' : '3px solid transparent', cursor: 'pointer', background: 'none', boxShadow: 'none', outline: 'none', transition: 'color 0.2s, border-bottom 0.2s'
        }}
      >
        <i className="fa fa-user-circle" aria-hidden="true"></i>
        <span>Social Profile</span>
      </div>
    </div>
  );
}

function DataBaseSearch({ query, handleQueryChange }) {
  return (
    <div>
      <h1>What sources do you want to follow?</h1>
      <form>
        <div className="feed-search-input-container">
          <input className="feed-search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search for a feed..."
            />
          <i className="fa fa-search" aria-hidden="true"></i>
        </div>
      </form>
    </div>
  );
}

function DiscoverIndexItems(props) {
  // Filter out feeds with no title or rss_url (prevents empty rows and backend errors)
  const validFeeds = Object.entries(props.feeds || {}).filter(
    ([, feed]) => feed && feed.title && feed.rss_url
  );
  return (
    <>
      {validFeeds.map(([feedId, feed]) => (
        <DiscoverIndexItem
          key={feedId}
          feed={feed}
          deleteFeed={props.deleteFeed}
          createFeedOnly={props.createFeedOnly}
          addCollectionItemAction={props.addCollectionItemAction}
          subscribeExistingFeed={props.subscribeExistingFeed}
          removeFeedFromAllCollections={props.removeFeedFromAllCollections}
        />
      ))}
    </>
  );
}

export default Discover;
