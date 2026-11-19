// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"

// Rebind after Turbo visits because the shared layout replaces the navigation.
document.addEventListener("turbo:load", () => {
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.getElementById("main-navigation");
  if (!toggle || !navigation) return;
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    navigation.classList.toggle("is-open", !expanded);
  });
});
