import React from 'react';

export default ({ loggedIn, title, logout, history, ...otherProps }) => {
  const buttonText = loggedIn ? "Log Out" : "Login";
  const buttonAction = loggedIn ? logout : e => history.push("/login");

  return (
    <header 
      className={`session-bar${ title ? " with-title" : ""}`}
      style={{
        backgroundColor: '#ffffff',
        padding: '0.5rem 1rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'relative'
      }}
    >
      <div 
        className={"session-bar-contents" + (loggedIn ? " logged-in" : "")}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          position: 'relative',
          top: '-80px',
          margin: '0 auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src="logo.png"
                alt="EasyFeeds"
                style={{ 
                  height: "200px",
                  objectFit: 'contain'
                }}
              />
        </div>
        
        <button 
          onClick={buttonAction}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: loggedIn ? '#f0f2f5' : '#1877f2',
            color: loggedIn ? '#1877f2' : 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontSize: '0.9rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
          onMouseOut={(e) => e.currentTarget.style.opacity = 1}
        >
          {buttonText}
        </button>
      </div>
    </header>
  );
}