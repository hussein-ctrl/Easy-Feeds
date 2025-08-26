
Rails.application.routes.draw do

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'static_pages#root'

  namespace :api, defaults: { format: :json } do
    get 'social_media/:platform', to: 'social_media_posts#index'
    resources :users, only: [:create, :show]
    resource :session, only: [:create, :destroy]
    resources :subscriptions, only: [:create, :index, :show, :update] do
      collection do
        post 'subscribe_existing_feed', to: 'subscriptions#subscribe_existing_feed'
      end
    end
    delete 'subscriptions/:id', to: 'subscriptions#destroy'
    resources :feeds, only: [:index, :show, :create] do
      member do
        delete 'remove_from_collections', to: 'feeds#remove_from_collections'
      end
    end
    resources :stories, only: [:index, :show]
    resources :collections, only: [:create, :update, :destroy, :index] do
      post 'add_items', on: :member
      delete 'remove_item', on: :member
      collection do
        get 'with_feeds_and_social_media_profiles', to: 'collections#with_feeds_and_social_media_profiles'
      end
    end
    resources :reads, only: [:create, :destroy, :index]
    get 'instagram_avatar/:username', to: 'instagram_avatar#show'
    get 'instagram_posts', to: 'instagram_posts#show'           # supports query param
    get 'instagram_posts/:username', to: 'instagram_posts#show' # supports URL param
    resources :social_media_markeds, only: [:index, :create]
    delete 'social_media_markeds', to: 'social_media_markeds#destroy'
  end


  # Ignore Chrome DevTools and other .well-known requests
  match "/.well-known/*path", to: proc { [204, {}, ['']] }, via: :all
  
  # Catch-all for OPTIONS requests (CORS preflight)
  match '*path', to: 'application#options', via: :options
end
