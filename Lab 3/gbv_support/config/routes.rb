Rails.application.routes.draw do
  root "pages#home"
  get "/what-is", to: "pages#what_is", as: :what_is
  get "/contact", to: "pages#contact", as: :contact
  post "/contact", to: "pages#send_feedback", as: :send_feedback
  get "/law-enforcement", to: "pages#law_enforcement", as: :law_enforcement
  get "/enforcer", to: "pages#enforcer", as: :enforcer
  get "/hotline", to: "pages#hotline", as: :hotline

  # Lab 3: staff login (accounts are read from Password.txt) and the feedback inbox
  get "/login", to: "sessions#new", as: :login
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy", as: :logout
  get "/admin/feedback", to: "admin#feedback", as: :admin_feedback

  get "up" => "rails/health#show", as: :rails_health_check

  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
