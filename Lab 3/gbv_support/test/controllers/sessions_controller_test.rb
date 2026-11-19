require "test_helper"

# Lab 3: login with Password.txt, lockout and logout
class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "login page loads" do
    get login_url
    assert_response :success
    assert_select "form[action='/login'] input[type=password]"
  end

  test "correct details from Password.txt log the user in" do
    post login_url, params: { username: "admin", password: "SafeSpace@2026" }
    assert_redirected_to admin_feedback_path
    follow_redirect!
    assert_select ".flash--notice", /Welcome back, Site Administrator/
  end

  test "wrong password shows how many attempts are left" do
    post login_url, params: { username: "admin", password: "wrong" }
    assert_response :unprocessable_entity
    assert_select ".flash--alert", /2 attempts left/
  end

  test "empty fields are rejected" do
    post login_url, params: { username: "", password: "" }
    assert_response :unprocessable_entity
    assert_select ".flash--alert", /Enter both/
  end

  test "three wrong attempts lock the login" do
    3.times { post login_url, params: { username: "admin", password: "wrong" } }
    assert_select ".flash--alert", /locked for 60 seconds/

    post login_url, params: { username: "admin", password: "SafeSpace@2026" }
    assert_response :too_many_requests
  end

  test "logout clears the session" do
    post login_url, params: { username: "volunteer", password: "Kasih#15999" }
    delete logout_url
    assert_redirected_to root_path
    get admin_feedback_url
    assert_redirected_to login_path
  end
end
