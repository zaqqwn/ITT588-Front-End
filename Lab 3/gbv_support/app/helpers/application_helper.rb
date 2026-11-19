module ApplicationHelper
  # Lab 3: volunteers see a masked email, e.g. "s*****@example.com".
  def mask_email(email)
    name, domain = email.to_s.split("@", 2)
    return "hidden" if name.blank? || domain.blank?

    "#{name[0]}#{'*' * [ name.length - 1, 3 ].max}@#{domain}"
  end

  # "Thu, 30 Oct" for a saved reply date, or "Any time" when none was chosen.
  def reply_date_label(value)
    return "Any time" if value.blank?

    l(Date.iso8601(value), format: "%a, %-d %b")
  rescue Date::Error
    "Any time"
  end

  def nav_link(label, path)
    link_to label, path, class: current_page?(path) ? "is-active" : nil
  end
end
