let linguaIn = 'it-IT';
let linguaOut = 'en';

// Gestione selezione lingua tramite i pulsanti
function selectLang(type, code, btn) {
  const containerId = type === 'in' ? 'input-flags' : 'output-flags';
  document.querySelectorAll(`#${containerId} .flag-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (type === 'in') linguaIn = code;
  else linguaOut = code;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Ascolto e Traduzione
function avviaAscolto() {
  const statusLbl = document.getElementById('status');

  if (!SpeechRecognition) {
    alert("Il riconoscimento vocale non è supportato da questo browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = linguaIn; // Ascolta nella lingua selezionata in alto (es. Italiano)
  
  statusLbl.innerText = "Ascolto...";
  recognition.start();

  recognition.onresult = async function(event) {
    const testoParlato = event.results[0][0].transcript;
    document.getElementById('testo-originale').innerText = testoParlato;
    statusLbl.innerText = "Traduzione in corso...";

    // Estraiamo i codici brevi a 2 lettere (es. 'it', 'en', 'de')
    const langSrc = linguaIn.slice(0, 2);
    const langTarget = linguaOut.slice(0, 2);

    // Chiamata di traduzione
    const traduzione = await traduciTesto(testoParlato, langSrc, langTarget);
    document.getElementById('testo-tradotto').innerText = traduzione;

    // Pronuncia la risposta nella LINGUA DI DESTINAZIONE (linguaOut)
    pronunciaTesto(traduzione, linguaOut);
    statusLbl.innerText = "Completato!";
  };

  recognition.onerror = function(e) {
    statusLbl.innerText = "Errore microfono o connessione.";
  };
}

// Servizio di Traduzione Affidabile (Google API)
async function traduciTesto(testo, da, a) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${da}&tl=${a}&dt=t&q=${encodeURIComponent(testo)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Ricompone il testo tradotto
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return testo;
  } catch (err) {
    console.error("Errore traduzione:", err);
    return testo;
  }
}

// Sintesi Vocale (Riproduzione Audio)
function pronunciaTesto(testo, lingua) {
  // Ferma eventuali riproduzioni precedenti
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(testo);
  utterance.lang = lingua; // Forza la voce nella lingua tradotta (es. Inglese, Tedesco)
  utterance.rate = 0.9;   // Velocità di lettura leggermente più naturale

  window.speechSynthesis.speak(utterance);
}