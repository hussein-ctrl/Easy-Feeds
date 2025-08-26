require 'json'

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_user, :logged_in?, :login, :asset_manifest

  def current_user
    @current_user ||= User.find_by(session_token: session[:session_token])
  end

  def login(user)
    session[:session_token] = user.reset_session_token!
    @current_user = user
  end

  def logout!
    @current_user.reset_session_token!
    session[:session_token] = nil
  end

  def logged_in?
    !!current_user
  end

  def require_login
    unless logged_in?
      redirect_to "/"
    end
  end

  def asset_manifest
    manifest_path = Rails.root.join('app', 'assets', 'static', 'dist', '.vite', 'manifest.json')
    unless File.exist?(manifest_path)
      Rails.logger.warn("Vite manifest not found at #{manifest_path}")
      return { entry_js: nil, css_files: [] }
    end
    manifest_file = File.read(manifest_path)
    manifest_json = JSON.parse(manifest_file)
    # Find main entry (index.html or main.js)
    main_entry = manifest_json["index.html"] || manifest_json.values.find { |v| v["isEntry"] }
    entry_js = main_entry["file"] if main_entry
    css_files = main_entry["css"] if main_entry && main_entry["css"]
    { entry_js: entry_js, css_files: css_files || [] }
  end

end
