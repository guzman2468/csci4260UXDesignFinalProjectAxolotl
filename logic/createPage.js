const recordBtn = document.getElementById("recordBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const menuButton = document.getElementById("menuButton");

menuButton.addEventListener("click", function () {
  alert("Menu button clicked.");
});

recordBtn.addEventListener("click", function () {
  alert("Record clicked.");
});

settingsBtn.addEventListener("click", function () {
  alert("Settings clicked.");
});

exitBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});