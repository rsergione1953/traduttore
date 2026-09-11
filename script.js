let linguaIn = 'it-IT';
let linguaOut = 'en-US';

// Caricamento preventivo delle voci per iOS / Android / Chrome
let vociDisponibili = [];
function caricaVoci() {
  if (typeof speechSynthesis !== 'undefined') {
    vociDisponibili = speechSynthesis.getVoices();
  }
}
caricaVoci();
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = caricaVoci;
}

function selectLang(type, code, btn) {
  const containerId = type === 'in' ? 'input-flags' : 'output-flags';
  document.querySelectorAll(`#${containerId} .flag-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (type === 'in') linguaIn = code;
  else linguaOut = code;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function avviaAscolto() {
  const statusLbl = document.getElementById('status');

  if (!SpeechRecognition) {
    alert("Riconoscimento vocale non supportato dal browser.");
    return;
  }

  // Sblocca il motore vocale al tocco dell'utente (necessario per Safari/Chrome Mobile)
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }

  const recognition = new SpeechRecognition();
  recognition.lang = linguaIn;
  
  statusLbl.innerText = "Ascolto...";
  recognition.start();

  recognition.onresult = async function(event) {
    const testoParlato = event.results[0][0].transcript;
    document.getElementById('testo-originale').innerText = testoParlato;
    statusLbl.innerText = "Traduzione in corso...";

    const langSrc = linguaIn.slice(0, 2);
    const langTarget = linguaOut.slice(0, 2);

    const traduzione = await traduciTesto(testoParlato, langSrc, langTarget);
    document.getElementById('testo-tradotto').innerText = traduzione;

    pronunciaTesto(traduzione, linguaOut);
    statusLbl.innerText = "Completato!";
  };

  recognition.onerror = function() {
    statusLbl.innerText = "Errore microfono o connessione.";
  };
}

async function traduciTesto(testo, da, a) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${da}&tl=${a}&dt=t&q=${encodeURIComponent(testo)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return testo;
  } catch (err) {
    return testo;
  }
}

function pronunciaTesto(testo, codiceLingua) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // Pulisce la coda precedente

  const utterance = new SpeechSynthesisUtterance(testo);
  const langBreve = codiceLingua.slice(0, 2); // es. "es", "fr"

  // Cerca la voce corrispondente (prima esatta, poi per lingua generale)
  if (vociDisponibili.length === 0) {
    vociDisponibili = speechSynthesis.getVoices();
  }

  const voceTrovata = vociDisponibili.find(v => v.lang === codiceLingua) || 
                      vociDisponibili.find(v => v.lang.startsWith(langBreve));

  if (voceTrovata) {
    utterance.voice = voceTrovata;
    utterance.lang = voceTrovata.lang;
  } else {
    utterance.lang = codiceLingua;
  }

  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}