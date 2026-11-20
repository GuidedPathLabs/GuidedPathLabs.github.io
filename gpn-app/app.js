
let installPrompt = null;
const installBtn = document.getElementById("installBtn");
const toast = document.getElementById("toast");
function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(()=>toast.style.display="none",4200);
}
window.addEventListener("beforeinstallprompt", event=>{
  event.preventDefault();
  installPrompt = event;
  if(installBtn) installBtn.style.display = "inline-block";
});
if(installBtn){
  installBtn.addEventListener("click", async ()=>{
    if(installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
    }else{
      showToast("If installation is available, open your browser menu and choose Install app or Add to Home screen.");
    }
  });
}
window.addEventListener("appinstalled",()=>showToast("GPN Central has been installed."));
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
