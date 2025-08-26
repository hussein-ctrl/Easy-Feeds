import React from 'react';
import { Link } from 'react-router-dom';
import {
  fetchCollectionsWithFeedsAndSocialMediaProfiles,
  removeCollectionItem
} from '../../util/collections_api_util';
import InstagramPost from '../main_page/instagramposts/InstagramPost';
import FacebookPost from '../main_page/facebookposts/facebookpost';
import ReactDOM from 'react-dom';
import './navbar.css';

/** ── NEW: Collapsed icon strip for closed sidebar ────────────────────────── */
const CollapsedIcons = ({ selected, closeNavBar, onResetSocialProfile }) => {
  return (
    <div className="collapsed-icons">
      <Link
        to="/i/feeds"
        onClick={() => {
          closeNavBar();
          if (onResetSocialProfile) onResetSocialProfile();
        }}
        className={`collapsed-icon ${selected === 'feeds' ? 'active' : ''}`}
        title="Feeds"
        aria-label="Feeds"
      >
        <i className="fa fa-cog" aria-hidden />
      </Link>
      <Link
        to="/i/latest"
        onClick={() => {
          closeNavBar();
          if (onResetSocialProfile) onResetSocialProfile();
        }}
        className={`collapsed-icon ${selected === 'latest' ? 'active' : ''}`}
        title="Latest"
        aria-label="Latest"
      >
        <i className="fa fa-bars" aria-hidden />
      </Link>

      <Link
        to="/i/reads"
        onClick={() => {
          closeNavBar();
          if (onResetSocialProfile) onResetSocialProfile();
        }}
        className={`collapsed-icon ${selected === 'reads' ? 'active' : ''}`}
        title="Recently Read"
        aria-label="Recently Read"
      >
        <i className="fa fa-book" aria-hidden />
      </Link>

      <Link
        to="/i/discover"
        className="collapsed-icon"
        title="Add Content"
        aria-label="Add Content"
        onClick={closeNavBar}
      >
        <i className="fa fa-plus-circle" aria-hidden />
      </Link>
    </div>
  );
};
/** ───────────────────────────────────────────────────────────────────────── */

class NavBar extends React.Component {
  _isMounted = false;

  componentDidUpdate() {
    if (typeof window !== 'undefined') {
      window.refreshNavBarCollections = this.fetchCollectionsData;
    }
  }

  getSelectedLink = () => {
    const location = this.props.location.pathname.split('/')[2];
    return location === 'subscriptions'
      ? this.props.location.pathname.split('/')[3]
      : location;
  };

  state = {
    isOpen: true,
    selected: this.getSelectedLink(),
    isManuallyClosed: false,
    isManuallyOpen: false,
    selectedSocialProfile: null,
    collections: [],
    loadingCollections: true,
    collectionsError: null,
    searchTerm: ''
  };

  componentDidMount() {
    this._isMounted = true;
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.fetchCollectionsData();
    window.addEventListener('refresh-navbar-folders', this.fetchCollectionsData);
  }

  componentWillUnmount() {
    this._isMounted = false;
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('refresh-navbar-folders', this.fetchCollectionsData);
  }

  fetchCollectionsData = async () => {
    if (!this._isMounted) return;
    
    this.setState({ loadingCollections: true, collectionsError: null });
    try {
      const flatRows = await fetchCollectionsWithFeedsAndSocialMediaProfiles();
      const collectionsMap = {};
      flatRows.forEach((row) => {
        if (!collectionsMap[row.id]) {
          collectionsMap[row.id] = {
            id: row.id,
            name: row.name,
            feeds: [],
            socialProfiles: []
          };
        }
        if (row.collection_item_type === 'Feed' && row.feed_id) {
          collectionsMap[row.id].feeds.push({
            id: row.feed_id,
            title: row.feed_title,
            rss_url: row.feed_rss_url,
            description: row.feed_description,
            favicon_url: row.feed_favicon_url,
            subscription_title: row.feed_title,
            collection_id: row.id
          });
        }
        if (
          row.collection_item_type === 'SocialMediaProfile' &&
          row.social_profile_id
        ) {
          collectionsMap[row.id].socialProfiles.push({
            id: row.social_profile_id,
            username: row.social_profile_username,
            display_name: row.social_profile_username,
            platform: row.social_profile_platform,
            avatar_url: row.social_profile_avatar_url,
            collection_id: row.id
          });
        }
      });
      
      if (this._isMounted) {
        this.setState({
          collections: Object.values(collectionsMap),
          loadingCollections: false
        });
      }
    } catch (err) {
      if (this._isMounted) {
        this.setState({
          collectionsError: err.message,
          loadingCollections: false
        });
      }
    }
  };

  handleResize = () => {
    if (!this._isMounted) return;
    
    if (window.innerWidth < 700 && !this.state.isManuallyOpen) {
      this.setState({ isOpen: false });
    } else if (!this.state.isManuallyClosed) {
      this.setState({ isOpen: true });
    }
    if (window.innerWidth > 700) {
      this.setState({ isManuallyOpen: false });
    }
    
    this.updateMainPageWidth(!!this.state.selectedSocialProfile);
  };

  handleClick = (e) => {
    this.setState(prevState => {
      const isOpen = !prevState.isOpen;
      return {
        isOpen,
        isManuallyClosed: isOpen ? false : true,
        isManuallyOpen: isOpen ? true : false
      };
    });
  };

  handleSelectedUpdate = () => {
    setTimeout(() => {
      if (this._isMounted) {
        this.setState({ selected: this.getSelectedLink() });
      }
    }, 0);
  };

  closeNavBar = () => {
    if (window.innerWidth < 700) {
      this.setState({ isOpen: false });
    }
  };

  updateMainPageWidth = (shrink) => {
    if (!this._isMounted) return;
    
    const mainPage = document.querySelector('.main-page');
    if (!mainPage) return;

    const screenWidth = window.innerWidth;

    if (shrink) {
      if (screenWidth > 1200) {
        mainPage.style.width = '50%';
      } else if (screenWidth > 992) {
        mainPage.style.width = '70%';
      } else if (screenWidth > 768) {
        mainPage.style.width = '80%';
      } else {
        mainPage.style.width = '100%';
      }
    } else {
      mainPage.style.width = '100%';
    }
  };

  handleSocialProfileClick = (profile) => {
    this.setState({ selectedSocialProfile: profile }, () => {
      this.updateMainPageWidth(true);
    });
  };

  handleBackToFeeds = () => {
    this.setState({ selectedSocialProfile: null }, () => {
      this.updateMainPageWidth(false);
    });
  };

  handleResetSocialProfile = () => {
    this.setState({ selectedSocialProfile: null }, () => {
      this.updateMainPageWidth(false);
    });
  };

  render() {
    const {
      isOpen,
      selected,
      selectedSocialProfile,
      collections,
      loadingCollections,
      collectionsError,
      searchTerm
    } = this.state;

    return (
      <>
        <section
          onClick={this.handleSelectedUpdate}
          className={`navbar ${isOpen ? '' : 'collapsed'}`}
        >
          <div className="navbar-header"></div>

          {isOpen ? (
            <div className="navbar-content">
              <div className="navbar-search">
                <i className="fa fa-search" aria-hidden />
                <input
                  type="text"
                  placeholder="Search folders, feeds, and profiles..."
                  value={searchTerm}
                  onChange={(e) => this.setState({ searchTerm: e.target.value })}
                  aria-label="Search folders, feeds, and profiles"
                />
              </div>

              {loadingCollections ? (
                <div className="loading-indicator">
                  <div className="spinner" aria-hidden />
                  <span>Loading folders...</span>
                </div>
              ) : collectionsError ? (
                <div className="error-indicator">
                  <i className="fa fa-exclamation-triangle" aria-hidden />
                  <span>Error: {collectionsError}</span>
                </div>
                
              ) : (
                
                <NavBarLinks
                  selected={selected}
                  closeNavBar={this.closeNavBar}
                  onSocialProfileClick={this.handleSocialProfileClick}
                  onResetSocialProfile={this.handleResetSocialProfile}
                  collections={collections}
                  globalSearchTerm={searchTerm}
                />
              )}

              <NavBarAddContent closeNavBar={this.closeNavBar} />
            </div>
          ) : (
            <CollapsedIcons
              selected={selected}
              closeNavBar={this.closeNavBar}
              onResetSocialProfile={this.handleResetSocialProfile}
            />
          )}

          <button
            className={`collapse-button ${isOpen ? 'inside' : 'outside'}`}
            onClick={this.handleClick}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <i className="fa fa-chevron-left" aria-hidden />
            ) : (
              <i className="fa fa-chevron-right" aria-hidden />
            )}
          </button>
        </section>

        <main className="main-content">
          {selectedSocialProfile ? (
            <div className="social-media-container">
              {selectedSocialProfile.platform?.toLowerCase() === 'instagram' ? (
                <InstagramPost
                  profile={selectedSocialProfile}
                  onBack={this.handleBackToFeeds}
                />
              ) : selectedSocialProfile.platform?.toLowerCase() === 'facebook' ? (
                <FacebookPost
                  profile={selectedSocialProfile}
                  onBack={this.handleBackToFeeds}
                />
              ) : selectedSocialProfile.platform?.toLowerCase() === 'x' ? (
                <div className="coming-soon">
                  <h2>X (Twitter) integration coming soon!</h2>
                  <button className="back-btn" onClick={this.handleBackToFeeds}>
                    Back to Profiles
                  </button>
                </div>
              ) : (
                <div className="coming-soon">
                  <h2>Social media integration coming soon!</h2>
                  <button className="back-btn" onClick={this.handleBackToFeeds}>
                    Back to Profiles
                  </button>
                </div>
              )}
            </div>
          ) : (
            this.props.children
          )}
        </main>
      </>
    );
  }
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
  danger
}) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel} aria-label="Close dialog">
          <i className="fa fa-times" aria-hidden />
        </button>
        <div className="modal-title" style={{ color: danger ? '#dc2626' : '#166534' }}>
          {title}
        </div>
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`modal-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const NavBarMenu = (props) => (
  <div className="menu-container">
    {props.isOpen ?
      <div>
        <Link to="/i/feeds/" onClick={props.closeNavBar}>
          <div className="edit-button">Organize Feeds
            <i className="fa fa-cog" aria-hidden="true"></i>
          </div>
        </Link>
      </div>
      : null
    }
  </div>
);

const NavBarLinks = ({
  selected,
  closeNavBar,
  onSocialProfileClick,
  onResetSocialProfile,
  collections = [],
  globalSearchTerm = ''
}) => {
  if (!window._navbarFolderOpen) window._navbarFolderOpen = {};
  const [search, setSearch] = React.useState('');
  const [ignored, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const location = window.location.pathname;
  let initialFeedKey = null;
  const feedMatch = location.match(/\/i\/subscriptions\/(\d+)/);
  if (feedMatch) {
    const feedId = feedMatch[1];
    for (const col of collections) {
      if (col.feeds?.some((f) => String(f.id) === feedId)) {
        initialFeedKey = `${feedId}_${col.id}`;
        break;
      }
    }
  }
  const [selectedFeedKey, setSelectedFeedKey] = React.useState(initialFeedKey);

  React.useEffect(() => {
    const calculateHeight = () => {
      const navbar = document.querySelector('.navbar');
      if (!navbar) return;
      
      const headerHeight = navbar.querySelector('.navbar-header')?.offsetHeight || 0;
      const searchHeight = navbar.querySelector('.navbar-search')?.offsetHeight || 0;
      const mainLinksHeight = navbar.querySelector('.main-links')?.offsetHeight || 0;
      const addContentHeight = navbar.querySelector('.add-content-container')?.offsetHeight || 0;
      const sectionHeaderHeight = navbar.querySelector('.section-header')?.offsetHeight || 0;
      
      document.documentElement.style.setProperty('--navbar-header-height', `${headerHeight}px`);
      document.documentElement.style.setProperty('--navbar-search-height', `${searchHeight}px`);
      document.documentElement.style.setProperty('--main-links-height', `${mainLinksHeight}px`);
      document.documentElement.style.setProperty('--add-content-height', `${addContentHeight}px`);
      document.documentElement.style.setProperty('--section-header-height', `${sectionHeaderHeight}px`);
    };

    calculateHeight();
    const resizeListener = () => calculateHeight();
    window.addEventListener('resize', resizeListener);
    
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  React.useEffect(() => {
    let newFeedKey = null;
    const match = window.location.pathname.match(/\/i\/subscriptions\/(\d+)/);
    if (match) {
      const feedId = match[1];
      for (const col of collections) {
        if (col.feeds?.some((f) => String(f.id) === feedId)) {
          newFeedKey = `${feedId}_${col.id}`;
          break;
        }
      }
    }
    setSelectedFeedKey(newFeedKey);
  }, [window.location.pathname, collections]);

  const [removeFeedState, setRemoveFeedState] = React.useState({
    open: false,
    feed: null,
    folder: null
  });

  const handleSocialProfileClick = (profile) => {
    setSelectedFeedKey(null);
    if (onSocialProfileClick) onSocialProfileClick(profile);
  };

  const toggleFolder = (id) => {
    window._navbarFolderOpen[id] = !window._navbarFolderOpen[id];
    window.dispatchEvent(new Event('navbar-folder-toggle'));
  };
  
  const expandAll = () => {
    collections.forEach((col) => {
      window._navbarFolderOpen[col.id] = true;
    });
    window.dispatchEvent(new Event('navbar-folder-toggle'));
  };
  
  const collapseAll = () => {
    collections.forEach((col) => {
      window._navbarFolderOpen[col.id] = false;
    });
    window.dispatchEvent(new Event('navbar-folder-toggle'));
  };
  
  React.useEffect(() => {
    const handler = () => forceUpdate();
    window.addEventListener('navbar-folder-toggle', handler);
    return () => window.removeEventListener('navbar-folder-toggle', handler);
  }, []);

  const getAvatarUrl = (profile) => {
    if (profile.avatar_url && !profile.avatar_url.startsWith('/api/')) {
      return profile.avatar_url;
    }
    const platform = (profile.platform || '').toLowerCase();
    switch (platform) {
      case 'twitter':
        return 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      case 'facebook':
        return 'https://static.xx.fbcdn.net/rsrc.php/v3/yi/r/8OasGoQgQgF.png';
      case 'instagram':
        return 'https://instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png';
      case 'linkedin':
        return 'https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico';
      case 'youtube':
        return 'https://www.youtube.com/s/desktop/6e2e6e7d/img/favicon_144x144.png';
      default:
        return '/default-avatar.png';
    }
  };

  const q = (globalSearchTerm || search).trim().toLowerCase();

  React.useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setSearch(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  const filteredCollections = q
    ? collections
        .map((col) => {
          const nameMatch = col.name?.toLowerCase().includes(q);

          const matchedFeeds = (col.feeds || []).filter((f) =>
            (f.title || '').toLowerCase().includes(q)
          );

          const matchedProfiles = (col.socialProfiles || []).filter((p) => {
            const disp = (p.display_name || p.username || '').toLowerCase();
            const plat = (p.platform || '').toLowerCase();
            return disp.includes(q) || plat.includes(q);
          });

          if (nameMatch || matchedFeeds.length || matchedProfiles.length) {
            return {
              ...col,
              feeds: nameMatch ? col.feeds : matchedFeeds,
              socialProfiles: nameMatch ? col.socialProfiles : matchedProfiles
            };
          }
          return null;
        })
        .filter(Boolean)
    : collections;

  return (
    <>
      <nav className="navbar-links">
        <div className="main-links">
         <Link
            to="/i/feeds"
            onClick={() => {
              closeNavBar();
              if (onResetSocialProfile) onResetSocialProfile();
            }}
            className={`nav-link ${selected === 'feeds' ? 'active' : ''}`}
          >
            <i className="fa fa-cog" aria-hidden />
            <span>Organize Feeds</span>
          </Link>

          <Link
            to="/i/latest"
            onClick={() => {
              closeNavBar();
              if (onResetSocialProfile) onResetSocialProfile();
            }}
            className={`nav-link ${selected === 'latest' ? 'active' : ''}`}
          >
            <i className="fa fa-bars" aria-hidden />
            <span>Latest</span>
          </Link>

          <Link
            to="/i/reads"
            onClick={() => {
              closeNavBar();
              if (onResetSocialProfile) onResetSocialProfile();
            }}
            className={`nav-link ${selected === 'reads' ? 'active' : ''}`}
          >
            <i className="fa fa-book" aria-hidden />
            <span>Recently Read</span>
          </Link>
        </div>

        <div className="folders-section">
          <div className="section-header">
            <h3>Folders</h3>
            <div className="folder-controls">
              <button onClick={expandAll} title="Expand all">
                <i className="fa fa-plus-square" aria-hidden />
              </button>
              <button onClick={collapseAll} title="Collapse all">
                <i className="fa fa-minus-square" aria-hidden />
              </button>
            </div>
          </div>

          <div className="folders-list">
            {filteredCollections.map((col) => {
              const isOpen = window._navbarFolderOpen[col.id] !== false;
              return (
                <div key={col.id} className="folder-group">
                  <div
                    className="folder-header"
                    onClick={() => toggleFolder(col.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') toggleFolder(col.id);
                    }}
                    aria-expanded={isOpen}
                    aria-controls={`folder-content-${col.id}`}
                  >
                    <i
                      className={`fa ${isOpen ? 'fa-folder-open' : 'fa-folder'}`}
                      aria-hidden
                    />
                    <span className="folder-name">{col.name}</span>
                    <span className="folder-count">
                      {(col.feeds?.length || 0) + (col.socialProfiles?.length || 0)}
                    </span>
                    <i
                      className={`fa ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}
                      aria-hidden
                    />
                  </div>

                  {isOpen && (
                    <div className="folder-content" id={`folder-content-${col.id}`}>
                      {col.feeds?.length > 0 && (
                        <div className="folder-subsection">
                          <div className="subsection-label">Feeds</div>
                          {col.feeds.map((feed) => {
                            const feedKey = `${feed.id}_${col.id}`;
                            return (
                              <div key={feedKey} className="feed-item">
                                <Link
                                  className={`feed-link ${
                                    selectedFeedKey === feedKey ? 'active' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedFeedKey(feedKey);
                                    closeNavBar();
                                    if (onResetSocialProfile) onResetSocialProfile();
                                  }}
                                  to={`/i/subscriptions/${feed.id}`}
                                >
                                  {feed.favicon_url ? (
                                    <img
                                      src={feed.favicon_url}
                                      alt=""
                                      className="favicon"
                                    />
                                  ) : (
                                    <i
                                      className="fa fa-rss favicon-placeholder"
                                      aria-hidden
                                    />
                                  )}
                                  <span className="feed-title">{feed.title}</span>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {col.socialProfiles?.length > 0 && (
                        <div className="folder-subsection">
                          <div className="subsection-label">Social Profiles</div>
                          {col.socialProfiles.map((profile) => (
                            <div
                              key={profile.id}
                              className="social-item"
                              onClick={() => handleSocialProfileClick(profile)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                  handleSocialProfileClick(profile);
                              }}
                            >
                              <div className="social-avatar">
                                <img
                                  src={getAvatarUrl(profile)}
                                  alt={profile.display_name || profile.username}
                                />
                                <div className="platform-badge" aria-hidden>
                                  {profile.platform?.toLowerCase() === 'instagram' && (
                                    <i className="fa fa-instagram" />
                                  )}
                                  {profile.platform?.toLowerCase() === 'facebook' && (
                                    <i className="fa fa-facebook" />
                                  )}
                                  {profile.platform?.toLowerCase() === 'x' && (
                                    <i className="fa fa-twitter" />
                                  )}
                                </div>
                              </div>
                              <div className="social-info">
                                <span className="social-name">
                                  {profile.display_name || profile.username}
                                </span>
                                <span className="social-handle">
                                  @{profile.platform}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <ConfirmDialog
        open={removeFeedState.open}
        title="Remove Feed"
        message={
          removeFeedState.feed && removeFeedState.folder ? (
            <span>
              Are you sure you want to remove{' '}
              <b>{removeFeedState.feed.title}</b> from folder{' '}
              <b>{removeFeedState.folder.name}</b>?
            </span>
          ) : (
            ''
          )
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        danger
        onCancel={() =>
          setRemoveFeedState({ open: false, feed: null, folder: null })
        }
        onConfirm={async () => {
          const { feed, folder } = removeFeedState;
          setRemoveFeedState({ open: false, feed: null, folder: null });
          try {
            await removeCollectionItem(folder.id, 'feed', feed.id);
            const folderIdx = collections.findIndex((c) => c.id === folder.id);
            if (folderIdx !== -1) {
              collections[folderIdx] = {
                ...collections[folderIdx],
                feeds: collections[folderIdx].feeds.filter((f) => f.id !== feed.id)
              };
              forceUpdate();
            }
          } catch (err) {
            alert('Error: ' + err.message);
          }
        }}
      />
    </>
  );
};

const NavBarAddContent = ({ closeNavBar }) => (
  <div className="add-content-container">
    <Link to="/i/discover" className="add-content-button" onClick={closeNavBar}>
      <i className="fa fa-plus-circle" aria-hidden />
      <span>Add Content</span>
    </Link>
  </div>
);

export default NavBar;