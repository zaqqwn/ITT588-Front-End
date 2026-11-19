# Lab 3: staff-only inbox that reads the saved feedback file.
class AdminController < ApplicationController
  before_action :require_login

  # GET /admin/feedback
  def feedback
    @entries = FeedbackStore.new.all
    @topic_counts = @entries.map { |entry| entry["topic"] }.tally.sort_by { |_topic, count| -count }
    @logged_in_at = Time.zone.parse(session[:logged_in_at].to_s)
  end
end
