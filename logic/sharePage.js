const recordingTitle = document.getElementById("recordingTitle");
const shareLink = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusText = document.getElementById("statusText");

const params = new URLSearchParams(window.location.search);
const titleFromUrl = params.get("title");

if (titleFromUrl) {
  recordingTitle.textContent = titleFromUrl;
  const slug = titleFromUrl
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  shareLink.value = "https://axolotl.app/share/" + slug;
}

copyBtn.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    statusText.textContent = "Link copied.";
  } catch (error) {
    statusText.textContent = "Copy failed.";
  }
});

downloadBtn.addEventListener("click", function () {
  statusText.textContent = "Download started.";
});

closeBtn.addEventListener("click", function () {
  // go back to previous page
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // fallback if user opened page directly
    window.location.href = "dashboard.html";
  }
});