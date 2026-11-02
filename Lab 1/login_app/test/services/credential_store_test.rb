require "test_helper"

class CredentialStoreTest < ActiveSupport::TestCase
  test "returns the user and role for valid credentials" do
    user = CredentialStore.authenticate(username: "admin", password: "admin123")

    assert_equal "admin", user[:username]
    assert_equal "administrator", user[:role]
    assert_not user.key?(:password)
  end

  test "rejects an invalid password" do
    assert_nil CredentialStore.authenticate(username: "admin", password: "wrong")
  end

  test "rejects blank credentials" do
    assert_nil CredentialStore.authenticate(username: "", password: "")
  end
end
