import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import moment from 'moment';

class StoriesIndexItem extends React.Component {

  state = {
    hidden: false,
    read: Boolean(this.props.story.read),
    isMouseInside: false
  };

  handleRedirect = (e, id) => {
    const target = e.target.parentElement;

    if (!target.className.includes("read-story") && !target.className.includes("hide-story")) {
      const originPath = this.props.history.location.pathname;

      if (e.target.tagName.toLowerCase() !== 'a') {
        this.props.history.push(`${originPath}/stories/${id}`);
        this.handleReadClick(e);
      } else if (e.target.href.includes("stories")) {
        this.handleReadClick(e);
      }
    }
  }

  handleXClick = (e) => {
    e.preventDefault();
    this.setState({ hidden: true });
    this.handleReadClick(e);
  }

  handleReadClick = (e) => {
    if (this.props.previewView) { return; }
    e.preventDefault();
    if (this.state.read &&
        e.target.parentElement.className.includes("read-story")
      ) {
      this.props.unreadStory(this.props.story.id);
      this.setState({ read: false });
    } else if (!this.state.read) {
      this.props.readStory(this.props.story.id);
      this.setState({ read: true });
    }
  }

  render() {
    const { story, feed } = this.props;
    let pubDateTime = moment(story.pub_datetime).fromNow();
    pubDateTime = pubDateTime.split(" ")[0] === "in" ? "Just now" : pubDateTime;

    const summary = story.teaser ? story.teaser.slice(0,250).split(" ").slice(0, -1).join(" ") + "..." : null;
    const summaryText = {__html: summary};
    const imageStyle = {
      backgroundImage: `url(${story.image_url || feed.favicon_url})`
    };

    const originPath = this.props.history.location.pathname;

    const storyIndexItemClass = "story-index-item"
       + (this.state.hidden ? " hidden" : "")
       + (this.state.read && !this.props.readView ? " read" : "")
       + (this.props.condensedView ? " condensed" : "");

    return (
      <div className={`${storyIndexItemClass}`}
        onMouseEnter={e => this.setState({ isMouseInside: true })}
        onMouseLeave={e => this.setState({ isMouseInside: false })}
        onClick={e => this.handleRedirect(e, story.id)}
      >
        <div className="story-item-image" style={imageStyle} />
        <div className="story-details">
          <div className="story-title">
            <h4>
              <Link to={`${originPath}/stories/${story.id}`}>
                {story.title}
              </Link>
            </h4>
            { this.props.previewView ? null :
              <ReadControls
                handleReadClick={this.handleReadClick}
                handleXClick={this.handleXClick}
                {...this.props}
                {...this.state}
              />
            }
          </div>
          <div>
            <h5>
              { !this.props.titleLink ?
                <Link to={`/i/subscriptions/${story.feed_id}`}>
                  {feed.subscription_title}
                </Link> : null
              }
              {` by ${story.author} / ${pubDateTime}`}
            </h5>
            <p dangerouslySetInnerHTML={summaryText} />
          </div>
          {/* Social Media Links Section - moved to main social media panel */}
        </div>
      </div>
    );
  }
}

const ReadControls = ({ isMouseInside, read, readView, handleReadClick, handleXClick }) => (
  <div className="read-controls">
    <div className={`noselect read-story${isMouseInside ? "" : " hidden"}`}
      onClick={handleReadClick}>
      { read ?
        <i className="fa fa-check-square" aria-hidden="true"></i>
        : <i className="fa fa-check-square-o" aria-hidden="true"></i> }
      </div>
      { readView ? null :
        <div className={`noselect hide-story${isMouseInside ? "" : " hidden"}`}
          onClick={handleXClick}>
          <i className="fa fa-times" aria-hidden="true"></i>
        </div>
      }
    </div>
);

export default StoriesIndexItem;
