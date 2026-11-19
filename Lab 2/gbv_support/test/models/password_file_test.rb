require "test_helper"

# Lab 3: reading Password.txt
class PasswordFileTest < ActiveSupport::TestCase
  test "reads accounts and skips comments" do
    accounts = PasswordFile.new.accounts
    assert_equal %w[admin volunteer], accounts.map(&:username)
    assert accounts.first.admin?
  end

  test "authenticate returns nil for a wrong password or unknown user" do
    file = PasswordFile.new
    assert_nil file.authenticate("admin", "safespace@2026")
    assert_nil file.authenticate("nobody", "SafeSpace@2026")
    assert_equal "Site Administrator", file.authenticate("admin", "SafeSpace@2026").name
  end

  test "a missing file raises a clear error" do
    assert_raises(PasswordFile::MissingFile) { PasswordFile.new(Rails.root.join("tmp", "no_such_file.txt")).accounts }
  end
end
