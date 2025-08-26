import React from 'react';
import { Route, withRouter } from 'react-router-dom';
import SessionFormContainer from '../session/session_form_container';
import { connect } from 'react-redux';
import { createDemoUser } from '../../actions/session_actions';
import './landing.css';

class Landing extends React.Component {

    componentDidMount() {
    this.toggleBodyScroll();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.toggleBodyScroll();
    }
  }

  componentWillUnmount() {
    document.body.style.overflow = '';
  }

  toggleBodyScroll() {
    const isAuthPage = this.props.location.pathname === '/login' || 
                      this.props.location.pathname === '/signup';
    document.body.style.overflow = isAuthPage ? 'hidden' : '';
  }

  renderAuthModal() {
    return (
      <div className="auth-modal">
          <button 
            className="close-button"
            onClick={() => this.props.history.push('/')}
          >
            &times;
          </button>
          <Route path="/login" component={SessionFormContainer} />
          <Route path="/signup" component={SessionFormContainer} />
      </div>
    );
  }

  render() {
    const { location } = this.props;
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    return (
      <div className={`landing ${isAuthPage ? 'auth-active' : ''}`}>
        {/* Hero Section */}
        <div className="hero">
          <div className="hero-content">
            <h1>Stay Updated with <span>Doova</span></h1>
            <p>Your personalized content aggregator that brings the web to you</p>
            
            <div className="cta-buttons">
              <button 
                className="primary-btn"
                onClick={() => this.props.history.push("/signup")}
              >
                Get Started
              </button>
              <button 
                className="secondary-btn"
                onClick={() => this.props.history.push("/login")}
              >
                Sign In
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="dashboard-mockup" />
          </div>
        </div>

        {/* Features Section */}
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">📰</div>
            <h3>Curated Content</h3>
            <p>Aggregate articles from your favorite sources</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Get alerted when new content matches your interests</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Any Device</h3>
            <p>Access your feeds anywhere on any device</p>
          </div>
        </div>

        {/* Testimonial */}
        

        {/* Footer */}
        <footer>
          <p>© {new Date().getFullYear()} EasyFeeds. All rights reserved.</p>
        </footer>

        {/* Auth Modal */}
        {isAuthPage && this.renderAuthModal()}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createDemoUser: () => dispatch(createDemoUser())
});

export default withRouter(connect(null, mapDispatchToProps)(Landing));