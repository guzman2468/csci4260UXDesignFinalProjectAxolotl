const createBtn = document.getElementById("createBtn");
const recordingsBtn = document.getElementById("recordingsBtn");
const shareButtons = document.querySelectorAll(".share-btn");
const signInBtn = document.querySelector(".sign-in");
const signUpBtn = document.querySelector(".sign-up");

signInBtn.addEventListener("click", function () {
  window.location.href = "login.html";
});

signUpBtn.addEventListener("click", function () {
  window.location.href = "signup.html";
});

createBtn.addEventListener("click", function () {
  window.location.href = "createPage.html";
});

recordingsBtn.addEventListener("click", function () {
  window.location.href = "recordings.html";
}); 

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const row = button.closest(".table-row");
    const title = row.querySelector(".col-title").textContent.trim();

    window.location.href = "sharePage.html?title=" + encodeURIComponent(title);
  });
});