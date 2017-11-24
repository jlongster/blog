
require('../css/theme/main.less');

document.querySelectorAll(".search input").forEach(function(input) {
  const match = location.href.match(/query=(.*)$/);
  if(match) {
    input.value = decodeURI(match[1]);
  }

  input.addEventListener("keyup", function(e) {
    if(e.keyCode === 13) {
      window.location.href = "/search?query=" + encodeURI(e.target.value);
    }
  });
});
