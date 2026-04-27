const closeBtn = document.getElementById("closeBtn");
const soundPresetEl = document.getElementById("soundPreset");
const volumeEl      = document.getElementById("volume");
const lengthEl       = document.getElementById("length");
const reverbEl      = document.getElementById("reverb");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const saveMessage = document.getElementById("saveMessage");


const VOLUME_MAP = {
  "Low":    0.3,
  "Medium": 0.6,
  "High":   0.8,
  "Max":    1.0
};



const saved = JSON.parse(sessionStorage.getItem("axolotlSettings") || "{}");
if (saved.soundPreset) soundPresetEl.value = saved.soundPreset;
if (saved.volume)      volumeEl.value      = saved.volume;
if (saved.length)      lengthEl.value       = saved.length;
if (saved.reverb)      reverbEl.value      = saved.reverb;

closeBtn.addEventListener("click", function () {
  window.location.href = "createPage.html";
});

const savedEmail = localStorage.getItem("loggedInEmail");
const profileLetter = document.getElementById("profileLetter");

if (savedEmail && profileLetter) {
  profileLetter.textContent = savedEmail.charAt(0).toUpperCase();
}

profileIcon.addEventListener("click", function (event) {
  event.stopPropagation();
  profileDropdown.classList.toggle("hidden");
});

logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("loggedInEmail");
  sessionStorage.removeItem("axolotlSettings");
  window.location.href = "login.html";
});

document.addEventListener("click", function (event) {
  if (!profileIcon.contains(event.target) && !profileDropdown.contains(event.target)) {
    profileDropdown.classList.add("hidden");
  }
});

saveSettingsBtn.addEventListener("click", function () {
  const settings = {
    soundPreset: soundPresetEl.value,
    volume: volumeEl.value,
    volumeValue: VOLUME_MAP[volumeEl.value],
    length: lengthEl.value,
    reverb: reverbEl.value
  };

  sessionStorage.setItem("axolotlSettings", JSON.stringify(settings));

  saveMessage.textContent = "Settings saved.";

  setTimeout(function () {
    saveMessage.textContent = "";
  }, 2500);
});