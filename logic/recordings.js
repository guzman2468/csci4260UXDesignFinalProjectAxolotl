const shareButtons = document.querySelectorAll(".share-btn");
const closeBtn = document.getElementById("closeBtn");

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    alert("Share button clicked.");
  });
});

closeBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});