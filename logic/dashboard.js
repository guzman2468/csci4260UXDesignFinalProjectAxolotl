const createBtn = document.getElementById("createBtn");
const recordingsBtn = document.getElementById("recordingsBtn");
const shareButtons = document.querySelectorAll(".share-btn");

createBtn.addEventListener("click", function () {
  alert("Create button clicked.");
});

recordingsBtn.addEventListener("click", function () {
  alert("Recordings button clicked.");
});

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    alert("Share button clicked.");
  });
});