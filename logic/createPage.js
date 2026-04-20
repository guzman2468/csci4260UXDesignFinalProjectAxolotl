const recordBtn = document.getElementById("recordBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const menuButton = document.getElementById("menuButton");

menuButton.addEventListener("click", function () {
  alert("Menu button clicked.");
});

recordBtn.addEventListener("click", function () {
  const isRecording = recordBtn.classList.toggle("recording-active");
  recordBtn.textContent = isRecording ? "Recording" : "Record";
});

settingsBtn.addEventListener("click", function () {
  window.location.href = "settings.html";
});

exitBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});