let linguaIn = 'it-IT';
let linguaOut = 'en';

// Gestione selezione lingua tramite le bandiere
function selectLang(type, code, btn) {
  const containerId = type === 'in' ? 'input-flags' : 'output-flags';
  document.querySelectorAll(`#${containerId} .flag-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (type === 'in') linguaIn = code;
  else linguaOut = code;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Funzione principale per l'ascolto dal microfono
function avviaAscolto() {
  const statusLbl = document.getElementById('status');

  if (!SpeechRecognition) {
    alert("Il riconoscimento vocale non è supportato da questo browser. Usa Google Chrome o Safari.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = linguaIn;
  
  statusLbl.innerText = "Ascolto la tua voce...";
  recognition.start();

  recognition.onresult = async function(event) {
    const testoParlato = event.results[0][0].transcript;
    document.getElementById('testo-originale').innerText = testoParlato;
    statusLbl.innerText = "Traduzione in corso...";

    const traduzione = await traduciTesto(testoParlato, linguaIn.slice(0, 2), linguaOut);
    document.getElementById('testo-tradotto').innerText = traduzione;

    pronunciaTesto(traduzione, linguaOut);
    statusLbl.innerText = "Completato!";
  };

  recognition.onerror = function(e) {
    statusLbl.innerText = "Errore microfono o connessione.";
  };
}

// Chiamata all'API per la traduzione del testo
async function traduciTesto(testo, da, a) {
  try {
    const res = await fetch("https://libretranslate.org/translate", {
      method: "POST",
      body: JSON.stringify({ q: testo, source: da, target: a, format: "text" }),
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    return data.translatedText || testo;
  } catch (err) {
    return testo;
  }
}

// Sintesi vocale (lettura del testo)
function pronunciaTesto(testo, lingua) {
  const utterance = new SpeechSynthesisUtterance(testo);
  utterance.lang = lingua;
  window.speechSynthesis.speak(utterance);
}