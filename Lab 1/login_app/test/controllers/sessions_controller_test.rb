require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "shows the login page" do
    get login_path
    assert_response :success
    assert_select "form"
  end

  test "logs in with valid credentials" do
    post login_path, params: { username: "admin", password: "admin123" }
    assert_redirected_to dashboard_path

    follow_redirect!
    assert_select "h1", text: /Hello, admin!/
  end

  test "rejects invalid credentials" do
    post login_path, params: { username: "admin", password: "wrong" }
    assert_response :unprocessable_entity
    assert_select "[role='alert']", text: /Invalid username or password/
  end

  test "protects the dashboard" do
    get dashboard_path
    assert_redirected_to login_path
  end

  test "logs out" do
    post login_path, params: { username: "user1", password: "user123" }
    delete logout_path
    assert_redirected_to login_path

    get dashboard_path
    assert_redirected_to login_path
  end
end
