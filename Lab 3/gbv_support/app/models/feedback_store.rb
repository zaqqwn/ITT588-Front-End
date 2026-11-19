require "json"

# Lab 3: file handling for website feedback.
# Each message is saved as one line of JSON in storage/feedback.txt,
# and the staff inbox reads the lines back.
class FeedbackStore
  FILE_NAME = Rails.env.test? ? "feedback_test.txt" : "feedback.txt"
  DEFAULT_PATH = Rails.root.join("storage", FILE_NAME)

  def initialize(path = DEFAULT_PATH)
    @path = Pathname.new(path)
  end

  # Appends one message ("a" = append mode, so older messages are kept).
  def save(entry)
    FileUtils.mkdir_p(@path.dirname)
    record = entry.merge("received_at" => Time.current.iso8601)
    File.open(@path, "a") { |file| file.puts(record.to_json) }
    record
  end

  # Returns all messages, newest first. A broken line is skipped
  # instead of crashing the inbox page.
  def all
    return [] unless @path.exist?

    entries = File.readlines(@path, chomp: true).filter_map do |line|
      next if line.strip.empty?

      JSON.parse(line)
    rescue JSON::ParserError
      Rails.logger.warn("Skipped a broken line in #{@path.basename}")
      nil
    end
    entries.reverse
  end

  def clear!
    File.delete(@path) if @path.exist?
  end
end
