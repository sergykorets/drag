Rails.application.routes.draw do
  root 'hotels#index'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

  devise_for :users, :controllers => { registrations: 'registrations',
                                       sessions: 'sessions',
                                       omniauth_callbacks: 'omniauth_callbacks' }
  resources :hotels do
    resources :rooms do
      get :calendar, on: :collection
    end
    resources :reservations do
      get :dates, on: :collection
    end
    get :reservation_list, on: :member
  end
  resources :restaurants, only: :index
  get 'reactivate/edit', 'reactivate#edit'
  put 'reactivate/update', 'reactivate#update'
  get '/sitemap.xml.gz', to: redirect("https://#{ENV['S3_BUCKET_NAME']}.s3.amazonaws.com/sitemaps/sitemap.xml.gz", status: 301)
  get '/schema', to: 'schemas#index'
  get '/skipass', to: 'schemas#skipass'
end