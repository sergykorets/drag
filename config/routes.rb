Rails.application.routes.draw do
  root 'hotels#index'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

  devise_for :users, :controllers => { registrations: 'registrations',
                                       sessions: 'sessions',
                                       omniauth_callbacks: 'omniauth_callbacks' }
  resources :hotels do
    resources :reviews, only: [:create, :destroy]
    resources :rooms do
      collection do
        get :pending_reservations
        get :calendar
        get :reservation_list
      end
    end
    resources :reservations do
      get :dates, on: :collection
    end
    member do
      get :booked_dates
      get :get_available_rooms
    end
  end
  resources :restaurants, only: :index
  resources :suggests, only: :create
  get 'reactivate/edit', 'reactivate#edit'
  put 'reactivate/update', 'reactivate#update'
  get '/sitemap.xml.gz', to: redirect("https://#{ENV['S3_BUCKET_NAME']}.s3.amazonaws.com/sitemaps/sitemap.xml.gz", status: 301)
  get '/schema', to: 'schemas#index'
  get '/skipass', to: 'schemas#skipass'
  get '/reservations', to: 'reservations#user_reservations'
end