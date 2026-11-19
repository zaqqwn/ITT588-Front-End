class PagesController < ApplicationController
  FEEDBACK_TOPICS = [ "Website content", "Hotline information", "Accessibility", "Something else" ].freeze
  MESSAGE_LIMIT = 1000

  # Statements for the Myth or Fact quiz on the What Is page (Lab 3).
  QUIZ_QUESTIONS = [
    { statement: "Abuse only counts as domestic violence when there are visible injuries.",
      answer: "myth",
      why: "Malaysia's Domestic Violence Act 1994 also covers psychological abuse, including emotional injury." },
    { statement: "Talian Kasih 15999 can be called at any time of the day or night.",
      answer: "fact",
      why: "Talian Kasih is open 24 hours a day, 7 days a week, by phone or WhatsApp." },
    { statement: "If a survivor stays in the relationship, the abuse is partly their fault.",
      answer: "myth",
      why: "Responsibility always belongs to the person causing harm. People stay for many reasons, such as safety, money or children." },
    { statement: "An authorised JKM welfare officer can issue an Emergency Protection Order (EPO).",
      answer: "fact",
      why: "An EPO is issued by an authorised welfare officer and is valid for seven days." },
    { statement: "Controlling a partner's money or stopping them from working can be a form of abuse.",
      answer: "fact",
      why: "Financial control is a recognised form of gender-based violence." },
    { statement: "Gender-based violence only happens inside the home.",
      answer: "myth",
      why: "GBV can also happen at work, online, in public or at school." }
  ].freeze

  def home
  end

  def what_is
    @quiz_questions = QUIZ_QUESTIONS
  end

  def contact
    @feedback = {}
  end

  # POST /contact
  # JavaScript checks the form first, but the server checks it again
  # because JavaScript can be turned off in the browser.
  def send_feedback
    @feedback = params.permit(:name, :email, :topic, :reply_date, :message, :consent)
                      .to_h.transform_values { |value| value.to_s.strip }
    @errors = feedback_errors(@feedback)

    if @errors.any?
      render :contact, status: :unprocessable_entity
    else
      FeedbackStore.new.save(@feedback.slice("name", "email", "topic", "reply_date", "message"))
      redirect_to contact_path(anchor: "feedback"), status: :see_other,
        notice: "Thank you, #{@feedback['name']}. Your feedback about \"#{@feedback['topic']}\" has been received."
    end
  end

  def law_enforcement
  end

  def enforcer
  end

  def hotline
  end

  private

  def feedback_errors(feedback)
    message = feedback["message"].to_s
    errors = []
    errors << "Enter your name." if feedback["name"].blank?
    errors << "Enter a valid email address." unless feedback["email"].to_s.match?(URI::MailTo::EMAIL_REGEXP)
    errors << "Choose a topic." unless FEEDBACK_TOPICS.include?(feedback["topic"])
    errors << reply_date_error(feedback["reply_date"])
    if message.length < 10
      errors << "Write at least 10 characters in your message."
    elsif message.length > MESSAGE_LIMIT
      errors << "Keep the message within #{MESSAGE_LIMIT} characters."
    end
    errors << "Tick the box to confirm you used sample details only." unless feedback["consent"] == "1"
    errors.compact
  end

  # The reply date is optional. When given, it must be a weekday from tomorrow up to 30 days ahead.
  def reply_date_error(value)
    return nil if value.blank?

    date = Date.iso8601(value)
    today = Time.zone.today
    return "Choose a reply date from tomorrow onwards." if date <= today
    return "Choose a reply date within the next 30 days." if date > today + 30
    return "Choose a weekday (Monday to Friday) for the reply date." if date.saturday? || date.sunday?

    nil
  rescue Date::Error
    "Enter a valid reply date."
  end
end
