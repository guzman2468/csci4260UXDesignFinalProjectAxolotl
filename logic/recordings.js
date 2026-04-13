const shareButtons = document.querySelectorAll(".share-btn");
const closeBtn = document.getElementById("closeBtn");

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const row = button.closest(".table-row");
    const title = row.querySelector(".col-title").textContent.trim();

    window.location.href = "sharePage.html?title=" + encodeURIComponent(title);
  });
});

closeBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});