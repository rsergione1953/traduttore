let linguaIn = 'it-IT';
let linguaOut = 'en-US';

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

  const recognition = new SpeechRecognition();
  recognition.lang = linguaIn;
  
  statusLbl.innerText = "Ascolto...";
  recognition.start();

  recognition.onresult = async function(event) {
    const testoParlato = event.results[0][0].transcript;
    document.getElementById('testo-originale').innerText = testoParlato;
    statusLbl.innerText = "Traduzione in corso...";

    // Estraiamo i codici a 2 lettere per la traduzione (es. 'it', 'en')
    const langSrc = linguaIn.slice(0, 2);
    const langTarget = linguaOut.slice(0, 2);

    const traduzione = await traduciTesto(testoParlato, langSrc, langTarget);
    document.getElementById('testo-tradotto').innerText = traduzione;

    // Pronuncia con il codice completo (es. 'en-US')
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
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(testo);
  utterance.lang = codiceLingua;

  // Ricerca forzata della voce corrispondente tra quelle installate nel sistema
  const voices = window.speechSynthesis.getVoices();
  const voceTrovata = voices.find(v => v.lang === codiceLingua || v.lang.startsWith(codiceLingua.slice(0, 2)));
  if (voceTrovata) {
    utterance.voice = voceTrovata;
  }

  window.speechSynthesis.speak(utterance);
}

// Inizializza l'elenco delle voci nel browser
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}