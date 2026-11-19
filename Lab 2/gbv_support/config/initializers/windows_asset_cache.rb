# Windows may hold Sprockets cache files open while another thread replaces them.
# An in-memory development cache avoids intermittent file-rename errors.
if Gem.win_platform? && (Rails.env.development? || Rails.env.test?)
  Rails.application.config.assets.configure do |environment|
    environment.cache = ActiveSupport::Cache::MemoryStore.new(size: 64.megabytes)
  end
end
