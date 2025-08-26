import React, { useEffect, useState, useCallback } from "react";
import { fetchSocialMediaPosts } from '../../../util/social_media_api_util';
import "./FacebookPost.css";

const FacebookPost = ({ profile, onBack }) => {
  const [allPosts, setAllPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(6);
  const [error, setError] = useState("");
  const [hasMoreFromAPI, setHasMoreFromAPI] = useState(true);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [maxPosts, setMaxPosts] = useState(10);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const username = profile?.username;

  // Map API data to UI structure, including carousel support
  const mapPostData = (apiPost) => {
    let picture = "";
    let carousel = [];
    if (apiPost.media && apiPost.media.length > 0) {
      picture = apiPost.media[0]?.thumbnail ||
        apiPost.media[0]?.photo_image?.uri ||
        apiPost.media[0]?.image?.uri ||
        "";
      carousel = apiPost.media
        .map(
          m =>
            m?.thumbnail ||
            m?.photo_image?.uri ||
            m?.image?.uri ||
            ""
        )
        .filter(Boolean);
    }

    // Video detection
    const isVideo = apiPost.isVideo || apiPost.media?.[0]?.__typename === "Video";
    const videoUrl = apiPost.url && isVideo ? apiPost.url : "";

    return {
      id: apiPost.postId || apiPost.id,
      message: apiPost.text || apiPost.message || apiPost.caption || "",
      createdTime: apiPost.time || apiPost.createdTime || apiPost.timestamp,
      likesCount: apiPost.likes || apiPost.likesCount || 0,
      commentsCount: apiPost.comments || apiPost.commentsCount || 0,
      shares: apiPost.shares || 0,
      url: apiPost.url || apiPost.topLevelUrl || "",
      hashtags: apiPost.hashtags || [],
      picture,
      carousel,
      attachments: apiPost.attachments || [],
      isVideo,
      videoUrl,
    };
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fetchFromAPI = useCallback(async (isRefresh = false) => {
    if (!username) return;
    if (isRefresh) {
      setAllPosts([]);
      setVisiblePosts([]);
      setOffset(0);
      setHasMoreFromAPI(true);
      setError("");
    }
    if (!hasMoreFromAPI || fetchingAPI) return;
    setFetchingAPI(true);
    setError("");
    try {
      const params = {
        username,
        resultsLimit: maxPosts.toString(),
      };
      if (minDate) params.minDate = minDate;
      if (maxDate) params.maxDate = maxDate;
      const data = await fetchSocialMediaPosts('facebook', params);
      const newPosts = (data.posts || []).map(mapPostData);
      setAllPosts(prev => [...prev, ...newPosts]);
      if (newPosts.length < 100) setHasMoreFromAPI(false);
      setInitialLoadDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingAPI(false);
    }
  }, [username, minDate, maxDate, maxPosts, hasMoreFromAPI, fetchingAPI]);

  const loadMoreVisiblePosts = () => {
    const next = allPosts
      .filter(post =>
        (!minDate || new Date(post.createdTime) >= new Date(minDate)) &&
        (!maxDate || new Date(post.createdTime) <= new Date(maxDate))
      )
      .slice(offset, offset + limit);
    setVisiblePosts(prev => [...prev, ...next]);
    setOffset(prev => prev + limit);
    if (allPosts.length - offset < limit * 2 && hasMoreFromAPI) {
      fetchFromAPI();
    }
  };

  const handleVideoPlay = (postId) => {
    setPlayingVideo(postId);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setTimeout(() => setPlayingVideo(null), 300); // Delay to allow fade-out
  };

  useEffect(() => {
    if (allPosts.length > 0) {
      const filtered = allPosts
        .filter(post =>
          (!minDate || new Date(post.createdTime) >= new Date(minDate)) &&
          (!maxDate || new Date(post.createdTime) <= new Date(maxDate))
        )
        .slice(0, maxPosts);
      setVisiblePosts(filtered);
      setOffset(filtered.length);
    }
  }, [minDate, maxDate, maxPosts, allPosts]);

  useEffect(() => {
    if (!username) return;
    setAllPosts([]);
    setVisiblePosts([]);
    setOffset(0);
    setHasMoreFromAPI(true);
    setMinDate("");
    setMaxDate("");
    setMaxPosts(10);
    setInitialLoadDone(false);
  }, [username]);

  const handleViewPosts = () => {
      fetchFromAPI(true);
  };

  if (!profile) return <div className="empty-state">📘 Select a Facebook profile</div>;

  if (!initialLoadDone && visiblePosts.length === 0) {
    return (
      <div className="facebook-container">
        <div className="facebook-header">
          <button className="back-button" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Profiles
          </button>
          <div className="profile-header">
            {profile.avatarUrl && <img src={profile.avatarUrl} alt={profile.username} className="profile-avatar" />}
            <h2>{profile.display_name || profile.username}'s Facebook Posts</h2>
          </div>
        </div>
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="minDate">Newer than:</label>
            <input
              type="date"
              id="minDate"
              value={minDate}
              onChange={e => setMinDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="maxDate">Older than:</label>
            <input
              type="date"
              id="maxDate"
              value={maxDate}
              onChange={e => setMaxDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="maxPosts">Max posts:</label>
            <input
              type="number"
              id="maxPosts"
              min="1"
              max="100"
              value={maxPosts}
              onChange={e => setMaxPosts(Math.min(100, Math.max(1, parseInt(e.target.value) || 10)))}
            />
          </div>
          <div className="filter-buttons">
            <button
              className="view-posts-button"
              onClick={handleViewPosts}
              disabled={fetchingAPI}
            >
              {fetchingAPI ? 'Loading...' : 'View Posts'}
            </button>
            <button
              className="reset-filters"
              onClick={() => {
                setMinDate("");
                setMaxDate("");
                setMaxPosts(10);
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
        <div className="empty-posts-state">
          <div className="empty-icon">📘</div>
          <h3>No Posts Loaded Yet</h3>
          <p>Click "View Posts" to load Facebook content</p>
        </div>
      </div>
    );
  }

  if (error && visiblePosts.length === 0) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="facebook-container">
      <div className="facebook-header">
        <button className="back-button" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Profiles
        </button>
        <div className="profile-header">
          {profile.avatarUrl && <img src={profile.avatarUrl} alt={profile.username} className="profile-avatar" />}
          <h2>{profile.display_name || profile.username}'s Facebook Posts</h2>
        </div>
      </div>
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="minDate">Newer than:</label>
          <input
            type="date"
            id="minDate"
            value={minDate}
            onChange={e => setMinDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="maxDate">Older than:</label>
          <input
            type="date"
            id="maxDate"
            value={maxDate}
            onChange={e => setMaxDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="maxPosts">Max posts:</label>
          <input
            type="number"
            id="maxPosts"
            min="1"
            max="100"
            value={maxPosts}
            onChange={e => setMaxPosts(Math.min(100, Math.max(1, parseInt(e.target.value) || 10)))}
          />
        </div>
        <div className="filter-buttons">
          <button
            className="view-posts-button"
            onClick={handleViewPosts}
            disabled={fetchingAPI}
          >
            {fetchingAPI ? 'Refreshing...' : 'View Posts'}
          </button>
          <button
            className="reset-filters"
            onClick={() => {
              setMinDate("");
              setMaxDate("");
              setMaxPosts(10);
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>
      {visiblePosts.length > 0 && (
        <div className="facebook-posts-container">
          {visiblePosts.map((post, idx) => {
            const isVideoPlaying = playingVideo === post.id;
            
            return (
              <div
                className="post-container"
                key={post.id || idx}
              >
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="post-header-link"
                >
                  <div className="post-header">
                    <div className="profile-info">
                      {profile.avatarUrl && (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.username}
                          className="profile-pic"
                        />
                      )}
                      <div className="profile-details">
                        <div className="user-name-container">
                          <span className="user-name">
                            {profile.display_name || profile.username}
                          </span>
                          <span className="post-time">
                            {formatRelativeTime(post.createdTime)}
                            <span className="dot-separator">•</span>
                            <span className="privacy-icon">🌐</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="options-button">⋯</button>
                  </div>
                </a>

                <div className="post-text">
                  {post.message || 'No message available'}
                </div>

                {/* Carousel support */}
                {post.carousel && post.carousel.length > 1 ? (
                  <div className="post-carousel">
                    {post.carousel.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Carousel media ${i + 1}`}
                        className="media-content"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : post.picture || post.isVideo ? (
                  <div className="post-media">
                    {post.isVideo && post.videoUrl ? (
                      <div className="video-player-container">
                        <div 
                          className={`video-thumbnail ${isVideoPlaying ? 'playing' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVideoPlay(post.id);
                          }}
                        >
                          <img
                            src={post.picture || '/default-video-thumb.jpg'}
                            alt="Video thumbnail"
                            className="media-content"
                            loading="lazy"
                          />
                          {!isVideoPlaying && (
                            <div className="play-button-overlay">
                              <div className="play-icon">▶</div>
                            </div>
                          )}
                        </div>
                        
                        {isVideoPlaying && (
                          <div className="video-player">
                            <video
                              controls
                              autoPlay
                              src={post.videoUrl}
                              onError={() => window.open(post.url, "_blank")}
                              onEnded={closeVideoModal}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={post.picture}
                        alt={post.message.slice(0, 100) || "Facebook post"}
                        className="media-content"
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : null}

                <div className="engagement-stats">
                  <div className="reaction-summary">
                    <div className="reaction-icons">
                      <span className="reaction-icon">👍</span>
                      <span className="reaction-icon">❤️</span>
                    </div>
                    <span className="reaction-count">
                      {post.likesCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="comments-shares">
                    <span>{post.commentsCount.toLocaleString()} comments</span>
                    <span>{post.shares.toLocaleString()} shares</span>
                  </div>
                </div>
                {post.isVideo && post.videoUrl && !isVideoPlaying && (
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="post-video-link"
                  >
                    <span role="img" aria-label="video">🎬</span> Video Post
                  </a>
                )}
              </div>
            );
          })}

          {fetchingAPI ? (
            <div className="loading-posts">
              <div className="spinner"></div>
            </div>
          ) : offset < allPosts.length && visiblePosts.length < maxPosts ? (
            <button onClick={loadMoreVisiblePosts} className="load-more-button">
              Load More
            </button>
          ) : !hasMoreFromAPI ? (
            <div className="end-message">You've reached the end of posts</div>
          ) : null}
        </div>
      )}

      {/* Video Modal for Larger Screens */}
      {videoModalOpen && playingVideo && (
        <div className="video-modal" onClick={closeVideoModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeVideoModal}>
              &times;
            </button>
            <video
              controls
              autoPlay
              src={visiblePosts.find(p => p.id === playingVideo)?.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookPost;