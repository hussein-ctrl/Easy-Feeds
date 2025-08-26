import React, { useEffect } from 'react';


const SocialProfilePosts = ({ profile, posts, loading, error, onBack }) => {
  if (!profile) return <div style={{ padding: 32, color: '#888' }}>Select a social media profile to view posts.</div>;
  if (loading) return <div style={{ padding: 32 }}>Loading posts...</div>;
  if (error) return <div style={{ padding: 32, color: '#d32f2f' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 32 }}>
      <button onClick={onBack} style={{ marginBottom: 24, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
        ← Back to EasyFeeds
      </button>
      <h2 style={{ marginBottom: 16 }}>{profile.display_name || profile.username}'s Instagram Posts</h2>
      {Array.isArray(posts) && posts.length === 0 ? (
        <div>No posts found for this profile.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {Array.isArray(posts) && posts.map((url, idx) => (
            <li key={idx} style={{ marginBottom: 18, background: '#f7f8fa', borderRadius: 8, padding: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <img src={url} alt="Instagram post" style={{ width: 220, borderRadius: 8, objectFit: 'cover' }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SocialProfilePosts;
