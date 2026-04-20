const recordBtn = document.getElementById("recordBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const menuButton = document.getElementById("menuButton");
const recordModal = document.getElementById("recordModal");
const sideMenu = document.getElementById("sideMenu");

menuButton.addEventListener("click", function () {
  sideMenu.classList.toggle("show");
});

recordBtn.addEventListener("click", () => sideMenu.classList.remove("show"));
settingsBtn.addEventListener("click", () => sideMenu.classList.remove("show"));
exitBtn.addEventListener("click", () => sideMenu.classList.remove("show"));

recordBtn.addEventListener("click", function () {
  recordModal.classList.toggle("show");
});

settingsBtn.addEventListener("click", function () {
  window.location.href = "settings.html";
});

exitBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});