require "test_helper"

# Lab 3: the staff inbox reads storage/feedback_test.txt in the test environment
class AdminControllerTest < ActionDispatch::IntegrationTest
  setup do
    @store = FeedbackStore.new
    @store.clear!
    @store.save("name" => "Aina", "email" => "aina@example.com", "topic" => "Accessibility",
                "reply_date" => "", "message" => "Bigger text please")
  end

  teardown { @store.clear! }

  test "visitors are sent to the login page" do
    get admin_feedback_url
    assert_redirected_to login_path
  end

  test "admin sees the saved feedback with the email" do
    post login_url, params: { username: "admin", password: "SafeSpace@2026" }
    get admin_feedback_url
    assert_response :success
    assert_select ".inbox-table tbody tr", count: 1
    assert_select ".inbox-email", "aina@example.com"
  end

  test "volunteer sees a masked email" do
    post login_url, params: { username: "volunteer", password: "Kasih#15999" }
    get admin_feedback_url
    assert_select ".inbox-email", "a***@example.com"
  end
end
