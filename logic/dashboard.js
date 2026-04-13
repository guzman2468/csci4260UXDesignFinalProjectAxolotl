const createBtn = document.getElementById("createBtn");
const recordingsBtn = document.getElementById("recordingsBtn");
const shareButtons = document.querySelectorAll(".share-btn");

createBtn.addEventListener("click", function () {
  window.location.href = "createPage.html";
});

recordingsBtn.addEventListener("click", function () {
  window.location.href = "recordings.html";
});

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    alert("Share button clicked.");
  });
});