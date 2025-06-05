let selectedDesign = "";

function selectDesign(designId) {
  selectedDesign = designId;
  localStorage.setItem("playerDesign", selectedDesign);
  alert("Selection saved: " + selectedDesign);
}
