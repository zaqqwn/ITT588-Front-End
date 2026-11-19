# Lab 3: reads the staff accounts from Password.txt in the project folder.
#
# Each line looks like:  username | password | display name | role
# Comment lines (starting with #) and blank lines are skipped.
class PasswordFile
  Account = Struct.new(:username, :password, :name, :role, keyword_init: true) do
    def admin?
      role == "admin"
    end
  end

  class MissingFile < StandardError; end

  DEFAULT_PATH = Rails.root.join("Password.txt")
  FIELDS_PER_LINE = 4

  def initialize(path = DEFAULT_PATH)
    @path = Pathname.new(path)
  end

  # Reads the file line by line and returns every valid account.
  def accounts
    File.foreach(@path, chomp: true).with_index(1).filter_map do |line, line_number|
      next if line.strip.empty? || line.lstrip.start_with?("#")

      fields = line.split("|").map(&:strip)
      if fields.size != FIELDS_PER_LINE || fields.any?(&:empty?)
        Rails.logger.warn("Password.txt line #{line_number} skipped: expected #{FIELDS_PER_LINE} fields")
        next
      end

      Account.new(username: fields[0], password: fields[1], name: fields[2], role: fields[3])
    end
  rescue Errno::ENOENT
    raise MissingFile, "Password.txt was not found at #{@path}"
  end

  # Returns the account when the username and password match, otherwise nil.
  # The same nil is returned for an unknown username and a wrong password,
  # so the login page never reveals which usernames exist.
  def authenticate(username, password)
    account = find(username.to_s.strip)
    return nil if account.nil?

    ActiveSupport::SecurityUtils.secure_compare(account.password, password.to_s) ? account : nil
  end

  def find(username)
    accounts.find { |account| account.username.casecmp?(username.to_s) }
  end
end
