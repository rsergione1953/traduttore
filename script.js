let linguaIn = 'it-IT';
let linguaOut = 'en-US';

// Cambia la lingua attiva quando si clicca su una bandiera
function selectLang(type, code, btn) {
  const containerId = type === 'in' ? 'input-flags' : 'output-flags';
  document.querySelectorAll(`#${containerId} .flag-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (type === 'in') {
    linguaIn = code;
  } else {
    linguaOut = code;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function avviaAscolto() {
  const statusLbl = document.getElementById('status');

  if (!SpeechRecognition) {
    alert("Riconoscimento vocale non supportato da questo browser.");
    return;
  }

  // Interrompe e sblocca subito la sintesi vocale se sta ancora parlando
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
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

    // Codici a 2 lettere per Google Translate (es. "it", "en", "es")
    const langSrc = linguaIn.slice(0, 2);
    const langTarget = linguaOut.slice(0, 2);

    const traduzione = await traduciTesto(testoParlato, langSrc, langTarget);
    document.getElementById('testo-tradotto').innerText = traduzione;

    // Pronuncia con ritardo per dare tempo al sistema di resettare l'audio
    setTimeout(() => {
      pronunciaTesto(traduzione, linguaOut);
    }, 150);

    statusLbl.innerText = "Completato!";
  };

  recognition.onerror = function() {
    statusLbl.innerText = "Errore microfono o connessione.";
  };
}

// Chiamata all'API di traduzione
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

// Pronuncia audio guidata e forzata sulla lingua corretta
function pronunciaTesto(testo, codiceLingua) {
  if (!('speechSynthesis' in window)) return;

  // Svuota forzatamente la coda audio
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(testo);
  
  // Assegna PRIMA la lingua obbligatoria
  utterance.lang = codiceLingua;

  // Recupera le voci disponibili sul dispositivo al momento
  const voci = window.speechSynthesis.getVoices();
  const langBreve = codiceLingua.slice(0, 2);

  if (voci && voci.length > 0) {
    // Cerca prima la voce esatta (es. es-ES), altrimenti qualsiasi voce della stessa lingua (es. es-MX)
    const voceTrovata = voci.find(v => v.lang === codiceLingua) || 
                        voci.find(v => v.lang.startsWith(langBreve));

    if (voceTrovata) {
      utterance.voice = voceTrovata;
      utterance.lang = voceTrovata.lang;
    }
  }

  utterance.rate = 0.9; // Velocità naturale
  window.speechSynthesis.speak(utterance);
}

// Inizializza l'elenco voci all'apertura del browser
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}