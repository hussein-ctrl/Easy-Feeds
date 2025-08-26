import React from 'react';

export class AddFeedForm extends React.Component {
  state = {rss_url: ""};

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.createFeedOnly(this.state)
      .then(() => {
        // Clear input and refresh popular feeds after successful add
        this.setState({ rss_url: "" });
        if (this.props.fetchFeedResults) {
          this.props.fetchFeedResults("");
        }
      });
  }

  render() {
    const errors = this.props.errors.map((err, idx) => <li key={idx}>{err}</li>);
    const loadingMessages = this.props.loadingMessages.map((msg, idx) =>
      <li key={idx}>{msg}</li>
    );

    return(
      <div>
        <h1>Have your own feed URL?</h1>
        <form className="add-feed-form" onSubmit={this.handleSubmit}>
          <div className="add-feed-input-container">
            <input placeholder="Add a feed URL..."
              value={this.state.rss_url}
              onChange={e => this.setState({rss_url: e.target.value})}
              />
            <i className="fa fa-search" aria-hidden="true"></i>
            <button className="green-button">Add Feed</button>
            <ul className="add-feed-errors">{errors}</ul>
          </div>
        </form>
      </div>
    );
  }
}

export default AddFeedForm;
