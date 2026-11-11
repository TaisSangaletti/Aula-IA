const themeStorageKey = "theme";
const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const themeButtons = document.querySelectorAll("[data-theme-toggle]");

function getSavedTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
}

function getPreferredTheme() {
  return getSavedTheme() || (themeQuery.matches ? "dark" : "light");
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    isDark ? "#17212f" : "#f4f6f8"
  );

  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", `Ativar modo ${isDark ? "claro" : "escuro"}`);
    const label = button.querySelector("[data-theme-label]");
    if (label) {
      label.textContent = `Modo ${isDark ? "claro" : "escuro"}`;
    }
  });
}

applyTheme(getPreferredTheme());

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
  });
});

themeQuery.addEventListener("change", (event) => {
  if (!getSavedTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});
