require 'appmap/middleware/remote_recording'

unless Rails.env.test?
  Rails.application.config.middleware.insert_after \
    Rails::Rack::Logger,
    AppMap::Middleware::RemoteRecording
end