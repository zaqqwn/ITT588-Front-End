require "test_helper"

class PagesControllerTest < ActionDispatch::IntegrationTest
  test "home page loads" do
    get root_url
    assert_response :success
    assert_select "h1", /Support starts/
  end

  test "what is page loads" do
    get what_is_url
    assert_response :success
  end

  test "contact page loads" do
    get contact_url
    assert_response :success
  end

  test "law enforcement page loads" do
    get law_enforcement_url
    assert_response :success
  end

  test "enforcer page loads" do
    get enforcer_url
    assert_response :success
  end

  test "hotline page loads" do
    get hotline_url
    assert_response :success
  end
  # ---------- Lab 3: feedback form (server-side checks and file saving) ----------

  setup { FeedbackStore.new.clear! }
  teardown { FeedbackStore.new.clear! }

  def valid_feedback(changes = {})
    { name: "Demo Student", email: "student@example.com", topic: "Accessibility",
      reply_date: "", message: "Please make the text a little bigger.", consent: "1" }.merge(changes)
  end

  test "contact page has the feedback form and the review dialog" do
    get contact_url
    assert_select "[data-controller=feedback-form] form[data-action='submit->feedback-form#submit']"
    assert_select "dialog.review-dialog"
    assert_select "select#topic option", count: PagesController::FEEDBACK_TOPICS.size + 1
  end

  test "empty feedback returns every validation error" do
    post send_feedback_url, params: { name: "", email: "", topic: "", message: "", consent: "0" }
    assert_response :unprocessable_entity
    assert_select ".form-errors li", count: 5
  end

  test "invalid email is rejected and entered text stays escaped" do
    post send_feedback_url, params: valid_feedback(name: "<script>alert(1)</script>", email: "wrong")
    assert_response :unprocessable_entity
    assert_select ".form-errors", /valid email/
    assert_select "script", text: "alert(1)", count: 0
  end

  test "reply date must be a future weekday within 30 days" do
    today = Time.zone.today
    next_saturday = today + ((6 - today.wday) % 7)
    next_saturday += 7 if next_saturday <= today

    post send_feedback_url, params: valid_feedback(reply_date: today.iso8601)
    assert_select ".form-errors", /from tomorrow/
    post send_feedback_url, params: valid_feedback(reply_date: (today + 45).iso8601)
    assert_select ".form-errors", /within the next 30 days/
    post send_feedback_url, params: valid_feedback(reply_date: next_saturday.iso8601)
    assert_select ".form-errors", /weekday/
  end

  test "long feedback is rejected" do
    post send_feedback_url, params: valid_feedback(message: "x" * 1001)
    assert_response :unprocessable_entity
    assert_select ".form-errors", /within 1000 characters/
  end

  test "valid feedback is saved to the text file" do
    post send_feedback_url, params: valid_feedback
    assert_redirected_to contact_path(anchor: "feedback")
    follow_redirect!
    assert_select ".form-notice", /Thank you, Demo Student/

    saved = FeedbackStore.new.all
    assert_equal 1, saved.size
    assert_equal "Accessibility", saved.first["topic"]
    assert saved.first["received_at"].present?
  end

  test "what is page shows the myth or fact quiz" do
    get what_is_url
    assert_select "[data-controller=myth-quiz] fieldset.quiz-question", count: PagesController::QUIZ_QUESTIONS.size
  end

  test "required law and agency information is present" do
    get law_enforcement_url
    assert_select "#protection-orders h2", /Act 521/
    get enforcer_url
    assert_select ".agency-table tbody tr", count: 5
  end
end
