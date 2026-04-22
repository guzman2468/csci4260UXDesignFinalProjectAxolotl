const closeBtn = document.getElementById("closeBtn");
const soundPresetEl = document.getElementById("soundPreset");
const volumeEl      = document.getElementById("volume");
const lengthEl       = document.getElementById("length");
const reverbEl      = document.getElementById("reverb");

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
  sessionStorage.setItem("axolotlSettings", JSON.stringify({
    soundPreset: soundPresetEl.value,
    volume:      volumeEl.value,
    length:       lengthEl.value,
    reverb:      reverbEl.value
  }));
  window.location.href = "createPage.html";
});