import React, { useEffect, useState, useCallback, useRef } from "react";
import "./InstagramPost.css";
import { fetchSocialMediaPosts } from '../../../util/social_media_api_util';

const InstagramPost = ({ profile, onBack }) => {
  const [allPosts, setAllPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(6);
  const [error, setError] = useState("");
  const [hasMoreFromAPI, setHasMoreFromAPI] = useState(true);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState(null);
  const [minDate, setMinDate] = useState("");
  const [maxPosts, setMaxPosts] = useState(12);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const videoRefs = useRef([]);

  const username = profile?.username;

  // Helper function to map API data to our component structure
  const mapPostData = (apiPost) => {
    const childVideo = apiPost.childPosts?.find(p => p.videoUrl)?.videoUrl;
    
    return {
      id: apiPost.id,
      type: apiPost.type,
      displayUrl: apiPost.displayUrl,
      videoUrl: apiPost.videoUrl || childVideo,
      caption: apiPost.caption || apiPost.alt || "",
      likesCount: apiPost.likesCount || 0,
      commentsCount: apiPost.commentsCount || 0,
      url: apiPost.url,
      hashtags: apiPost.hashtags || [],
      timestamp: apiPost.timestamp,
      childPosts: apiPost.childPosts || [],
      videoViewCount: apiPost.videoViewCount || 0,
      videoPlayCount: apiPost.videoPlayCount || 0
    };
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
        skipPinnedPosts: "false",
      };
      if (minDate) {
        params.onlyPostsNewerThan = minDate;
      }
      const data = await fetchSocialMediaPosts('instagram', params);
      const newPosts = (data.posts || []).map(mapPostData);
      setAllPosts(prev => [...prev, ...newPosts]);
      if (newPosts.length < 100) setHasMoreFromAPI(false);
      setInitialLoadDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingAPI(false);
    }
  }, [username, minDate, maxPosts, hasMoreFromAPI, fetchingAPI]);

  const loadMoreVisiblePosts = () => {
    const next = allPosts
      .filter(post => !minDate || new Date(post.timestamp) >= new Date(minDate))
      .slice(offset, offset + limit);
      
    setVisiblePosts(prev => [...prev, ...next]);
    setOffset(prev => prev + limit);

    if (allPosts.length - offset < limit * 2 && hasMoreFromAPI) {
      fetchFromAPI();
    }
  };

  // Apply filters when minDate or maxPosts changes
  useEffect(() => {
    if (allPosts.length > 0) {
      const filtered = allPosts
        .filter(post => !minDate || new Date(post.timestamp) >= new Date(minDate))
        .slice(0, maxPosts);
      
      setVisiblePosts(filtered);
      setOffset(filtered.length);
    }
  }, [minDate, maxPosts, allPosts]);

  // Reset state when profile changes
  useEffect(() => {
    if (!username) return;
    setAllPosts([]);
    setVisiblePosts([]);
    setOffset(0);
    setHasMoreFromAPI(true);
    setMinDate("");
    setMaxPosts(12);
    setInitialLoadDone(false);
  }, [username]);

  const handleViewPosts = () => {
    if (!initialLoadDone) {
      fetchFromAPI(true);
    }
  };

  const handlePostHover = (index) => {
    setActivePostIndex(index);
    if (videoRefs.current[index] && visiblePosts[index].videoUrl) {
      videoRefs.current[index].play().catch(e => console.log("Autoplay prevented", e));
    }
  };

  const handlePostLeave = () => {
    setActivePostIndex(null);
    videoRefs.current.forEach(video => video && video.pause());
  };

  if (!profile) return <div className="empty-state">📱 Select a profile</div>;
  
  // Show message when posts haven't been loaded yet
  if (!initialLoadDone && visiblePosts.length === 0) {
    return (
      <div className="instagram-container">
        <div className="instagram-header">
          <button className="back-button" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Profiles
          </button>
          <div className="profile-header">
            {profile.avatarUrl && <img src={profile.avatarUrl} alt={profile.username} className="profile-avatar" />}
            <h2>{profile.display_name || profile.username}'s Posts</h2>
          </div>
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="minDate">Newer than:</label>
            <input
              type="date"
              id="minDate"
              value={minDate}
              onChange={(e) => setMinDate(e.target.value)}
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
              onChange={(e) => setMaxPosts(Math.min(100, Math.max(1, parseInt(e.target.value) || 12)))}
            />
          </div>
          
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
              setMaxPosts(12);
            }}
          >
            Reset Filters
          </button>
        </div>
        
        <div className="empty-posts-state">
          <div className="empty-icon">📸</div>
          <h3>No Posts Loaded Yet</h3>
          <p>Click "View Posts" to load Instagram content</p>
        </div>
      </div>
    );
  }

  if (error && visiblePosts.length === 0) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="instagram-container">
      <div className="instagram-header">
        <button className="back-button" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Profiles
        </button>
        <div className="profile-header">
          {profile.avatarUrl && <img src={profile.avatarUrl} alt={profile.username} className="profile-avatar" />}
          <h2>{profile.display_name || profile.username}'s Posts</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="minDate">Newer than:</label>
          <input
            type="date"
            id="minDate"
            value={minDate}
            onChange={(e) => setMinDate(e.target.value)}
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
            onChange={(e) => setMaxPosts(Math.min(100, Math.max(1, parseInt(e.target.value) || 12)))}
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
              setMaxPosts(12);
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {visiblePosts.length > 0 && (
        <>
          <div className="instagram-grid">
            {visiblePosts.map((post, idx) => (
              <div
                key={post.id || idx}
                className={`insta-post-card ${post.type.toLowerCase()} ${activePostIndex === idx ? 'active' : ''}`}
                onMouseEnter={() => handlePostHover(idx)}
                onMouseLeave={handlePostLeave}
              >
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="post-link">
                  <div className="media-container">
                    {(post.type === "Video" || post.type === "Sidecar") && (
                      <div className="post-type-indicator">
                        {post.type === "Video" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
                          </svg>
                        )}
                      </div>
                    )}

                    {post.type === "Sidecar" && post.childPosts.length > 0 && (
                      <div className="sidecar-indicator">
                        <span>+{post.childPosts.length}</span>
                      </div>
                    )}

                    {post.type === "Video" ? (
                      <video
                        ref={el => videoRefs.current[idx] = el}
                        loop
                        src={post.videoUrl}
                        poster={post.displayUrl}
                        className="post-media"
                      />
                    ) : post.type === "Sidecar" ? (
                      <div className="sidecar-container">
                        <img 
                          src={post.displayUrl} 
                          alt={post.caption.slice(0, 100) || "Instagram post"} 
                          className="post-media" 
                        />
                      </div>
                    ) : (
                      <img 
                        src={post.displayUrl} 
                        alt={post.caption.slice(0, 100) || "Instagram post"} 
                        className="post-media" 
                        loading="lazy" 
                      />
                    )}
                    
                    <div className="post-hover-overlay">
                      <span>❤️ {post.likesCount.toLocaleString()}</span>
                      <span>💬 {post.commentsCount.toLocaleString()}</span>
                      {post.videoViewCount > 0 && (
                        <span>👀 {post.videoViewCount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </a>
                
                <div className="post-info">
                  <p className="caption-text">{post.caption || 'No caption available'}</p>
                  <div className="post-meta">
                    <span className="post-date">
                      {new Date(post.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {post.hashtags.length > 0 && (
                      <div className="hashtags-container">
                        {post.hashtags.map((tag, i) => (
                          <span key={i} className="hashtag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
        </>
      )}
    </div>
  );
};

export default InstagramPost;