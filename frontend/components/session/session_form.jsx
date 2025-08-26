import React from 'react';
import { Component } from 'react';
import { Link } from 'react-router-dom';
import './session_form.css';

class SessionForm extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      email: "", 
      password: "", 
      first_name: "", 
      last_name: "",
      showPassword: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
  }

  togglePasswordVisibility() {
    this.setState(prevState => ({ showPassword: !prevState.showPassword }));
  }

  update(field) {
    return e => this.setState({ [field]: e.target.value });
  }

handleSubmit(e) {
  e.preventDefault();
  const { processForm } = this.props;
  const credentials = Object.assign({}, this.state);
  delete credentials.showPassword;

  processForm(credentials)
    .then(() => this.props.history.push("/i/latest"))
    .catch(() => {
      // Do not close dialog, just clear password if login failed
      if (this.props.formType === 'login') {
        this.setState({ password: "" });
      }
      // Do NOT redirect or close modal here
    });
}

  handleXClick(e) {
    e.preventDefault();
    this.props.clearSessionErrors();
    this.props.history.push("/");
  }

  render() {
    const { formType, errors } = this.props;
    const { showPassword } = this.state;
    const headerText = formType === 'signup' ? "Create Your Account" : "Welcome Back";
    const buttonText = formType === 'signup' ? "Sign Up" : "Login";
    const otherText = formType === 'signup' ? "Already have an account? Login" : "Don't have an account? Sign up";
    const otherLink = formType === 'signup' ? '/login' : '/signup';

    return(
      <div className="session-modal">
        <div className="session-modal-backdrop" onClick={e => this.handleXClick(e)}></div>

        <div className="session-form-container">
          <div className="form-header">
            <h2>{headerText}</h2>
            <button className="close-button" onClick={e => this.handleXClick(e)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          {errors.length > 0 && (
            <div className="error-banner">
              <ul>
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
            {formType === 'signup' && (
              <div className="name-fields">
                <div className="input-group">
                  <label htmlFor="first_name">First Name</label>
                  <input 
                    id="first_name"
                    type="text"
                    placeholder="John"
                    onChange={this.update('first_name')}
                    value={this.state.first_name}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="last_name">Last Name (optional)</label>
                  <input 
                    id="last_name"
                    type="text"
                    placeholder="Doe"
                    onChange={this.update('last_name')}
                    value={this.state.last_name}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email"
                placeholder="you@example.com"
                onChange={this.update('email')}
                value={this.state.email}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">
                Password 
                {formType === 'signup' && <span> (min 6 characters)</span>}
              </label>
              <div className="password-input">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={this.update('password')}
                  value={this.state.password}
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={this.togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 9a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3zm0 8a5 5 0 01-5-5 5 5 0 015-5 5 5 0 015 5 5 5 0 01-5 5zm0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="submit-button">
              {buttonText}
            </button>
          </form>

          <div className="form-footer">
            <Link 
              to={otherLink} 
              onClick={this.props.clearSessionErrors}
              className="switch-form-link"
            >
              {otherText}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default SessionForm;