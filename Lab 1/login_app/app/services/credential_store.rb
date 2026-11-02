require "csv"
require "digest"

class CredentialStore
  CredentialFileError = Class.new(StandardError)
  PASSWORD_FILE = Rails.root.join("Password.txt")

  def self.authenticate(username:, password:)
    candidate_username = username.to_s.strip
    candidate_password = password.to_s
    return nil if candidate_username.blank? || candidate_password.blank?

    users.find do |user|
      secure_match?(user[:username], candidate_username) &&
        secure_match?(user[:password], candidate_password)
    end&.except(:password)
  end

  def self.users
    CSV.foreach(PASSWORD_FILE, headers: false, skip_blanks: true).filter_map do |row|
      next if row[0].to_s.strip.start_with?("#")

      username, password, role = row.map { |field| field.to_s.strip }
      next if username.blank? || password.blank?

      { username: username, password: password, role: role.presence || "user" }
    end
  rescue Errno::ENOENT, Errno::EACCES, CSV::MalformedCSVError => e
    raise CredentialFileError, "Unable to read #{PASSWORD_FILE}: #{e.message}"
  end

  def self.secure_match?(stored_value, candidate_value)
    stored_digest = Digest::SHA256.hexdigest(stored_value)
    candidate_digest = Digest::SHA256.hexdigest(candidate_value)
    ActiveSupport::SecurityUtils.secure_compare(stored_digest, candidate_digest)
  end

  private_class_method :users, :secure_match?
end
