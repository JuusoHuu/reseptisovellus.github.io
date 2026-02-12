import { addFavorite } from './users.js';

//luodaan muuttujia htmllän id-elementtiä käyttäen
const radioYes = document.getElementById("radioYes");
const radioNo = document.getElementById("radioNo");
const kSisalto = document.getElementById("Ksisalto");
const eSisalto = document.getElementById("Esisalto");
const otsikko = document.getElementById("otsikkoEsisalto")
const slidebar = document.getElementById("slidebar");
const allergiat = document.getElementById("allergiat");
const haku = document.getElementById("haku");

if (radioYes && radioNo && kSisalto && eSisalto && otsikko && slidebar && allergiat && haku) {
//jos sovelluksessa valitaan "kyllä" vaihtoehto tuodaan asiat pois piilosta poistamalla "hidden" class
  radioYes.addEventListener("change", () => {
    if (radioYes.checked) {
      kSisalto.classList.remove("hidden");
      eSisalto.classList.add("hidden");
      otsikko.classList.add("hidden");
      slidebar.classList.remove("hidden");
      allergiat.classList.remove("hidden");
      haku.classList.remove("hidden");
    }
  });

  //jos sovelluksessa valitaan "ei" vaihtoehto tuodaan asiat pois piilosta poistamalla "hidden" class
  radioNo.addEventListener("change", () => {
    if (radioNo.checked) {
      kSisalto.classList.add("hidden");
      eSisalto.classList.remove("hidden");
      otsikko.classList.remove("hidden");
      slidebar.classList.remove("hidden");
      allergiat.classList.remove("hidden");
      haku.classList.remove("hidden");
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {

  //luodaan muuttujia htmllän id-elementtiä käyttäen
  const aikaSlider = document.getElementById("aika");
  const aikaArvo = document.getElementById("aikaArvo");

  //päivittää sliderin etenemisen oranssina
  if (aikaSlider && aikaArvo) {
    function paivitaSliderVari() {
      const min = aikaSlider.min;
      const max = aikaSlider.max;
      const val = aikaSlider.value;
  
    //lasketaan valitun arvon prosentti osuus sliderin välillä
    const prosentti = ((val - min) / (max - min)) * 100;

    //asetetaan lineaarinen gradientti liukusäätimen taustalle
    aikaSlider.style.background = `linear-gradient(to right, #ffa500 0%, #ffa500 ${prosentti}%, #ccc ${prosentti}%, #ccc 100%)`;
  }

  //kun liukusäätimen arvo muuttuu päivitetään arvo ja väri
  aikaSlider.addEventListener("input", function () {
    aikaArvo.textContent = this.value;
    paivitaSliderVari();
  });

  //alustetaan arvo ja väri kun sivu latautuu
  aikaArvo.textContent = aikaSlider.value;
  paivitaSliderVari();
}
});


  //kun käyttäjä painaa "haku" nappia tulee reseptikysely
  const hakuButton = document.getElementById("haku");
  if (hakuButton) {
  hakuButton.addEventListener("click", async () => {
    const loadingMessage = document.getElementById("loading-message");
    loadingMessage.classList.remove("hidden");

    //tarkistetaan käyttääkö käyttäjä kaappien sisältöä
    const kaappiValinta = document.querySelector('input[name="jaakaappiSisalto"]:checked')?.value;
    let tuotteet = "";
    let vaihtoehto = "";

    //jos valinta on kyllä käytetään jääkaapin tuotteita
    if (kaappiValinta === "yes") {
      tuotteet = document.getElementById("tuote").value.trim();
    //jos valinta on ei käytetään käyttäjän antamaa vaihtoehtoa
    } else if (kaappiValinta === "no") {
      vaihtoehto = document.querySelector('input[name="vaihtoehto"]:checked')?.value || "";
    }

    //haetaan aikaraja ja mahdolliset allergiat
    const aikaraja = document.getElementById("aika").value;
    const allergiat = document.getElementById("allergia").value.trim();

    //kootaan kaikki  vastaukset yhdeksi objektiksi
    const vastaukset = {
      kaytaKaapinSisaltoa: kaappiValinta,
      tuotteet: tuotteet,
      ruokatyyppi: vaihtoehto,
      aikaraja: Number(aikaraja),
      allergiat: allergiat
    };

    //konsoliin tuleva viesti, että palvelimelle on lähetetty käyttäjän vastaukset
    console.log("Lähetetään palvelimelle:", vastaukset);
  
    try {
      //lähetetään tiedot palvelimelle
      const response = await fetch(`${window.ENV.API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vastaukset)
      });
      const data = await response.json();
      console.log("Palvelimen vastaus:", data);

      //otetaan vastaan ensimmäinen vastausteksti ehdotuksista
      const vastaus = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ei vastausta";
      const vastausElementti = document.getElementById("vastaus");
      
      //jaetaan vastaus eri riveille listaa varten
      const reseptiLista = vastaus.split("\n").filter(r => r.trim() !== "");
      
      //rakennetaan lista painikkeina käyttäen htmllää
      let reseptiHTML = "<h3>Reseptiehdotukset:</h3><ul>";
      reseptiLista.forEach((resepti, index) => {
        reseptiHTML += `<li><button class="resepti-valinta" data-valinta="${resepti}">${resepti}</button></li>`;
      });
      reseptiHTML += "</ul><div id='valittuResepti'></div>";
      
      //näytetään reseptit käyttöliittymässä
      vastausElementti.innerHTML = reseptiHTML;
      vastausElementti.classList.remove("hidden");
      
      //lisätään tapahtumakuuntelija jokaiselle napille
      document.querySelectorAll(".resepti-valinta").forEach(button => {
        button.addEventListener("click", (e) => {
          const valinta = e.target.getAttribute("data-valinta");
          console.log("Käyttäjä valitsi reseptin:", valinta);
          document.getElementById("valittuResepti").innerHTML = `<em id="loading-message">Haetaan reseptiä...</em>`;
          haeTarkempiResepti(valinta);
        });
      });

    } catch (e) {
      //jos tapahtuu virhe tuodaan error viesti consoleen
      console.error("Virhe haettaessa reseptejä:", e.message);
    }
      finally {
        //varmistaa että lataus viesti piilotetaan 
        loadingMessage.classList.add("hidden");
    }
  });


//funktio hakee tarkemman reseptin valitulle reseptille
  }
  async function haeTarkempiResepti(reseptiNimi) {
    if (!reseptiNimi || reseptiNimi === "Ei vastausta") {
      console.warn("Skipping invalid recipe request:", reseptiNimi);
      return;
    }
  
    try {
      const response = await fetch(`${window.ENV.API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Anna tarkka resepti ja ainesmäärät ruoalle: ${reseptiNimi}` })
      });
  
      const data = await response.json();
      const vastaus = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ei reseptiä saatavilla.";
  
      const valittuBox = document.getElementById("valittuResepti");
      valittuBox.innerHTML = `
        <h4>${reseptiNimi}</h4>
        <p>${vastaus.replace(/\n/g, "<br>")}</p>
        <button id="suosikkiNappi">Tallenna resepti</button>
      `;
  
      // Suosikkinappi ja visuaalinen palaute
      document.getElementById("suosikkiNappi").addEventListener("click", async () => {
        const nappi = document.getElementById("suosikkiNappi");
        nappi.disabled = true;
        nappi.innerHTML = "Tallennetaan...";
  
        try {
          await addFavorite({ title: reseptiNimi, content: vastaus });
          nappi.innerHTML = "Resepti tallennettu!";
          showToast("Resepti tallennettu!");
        } catch (err) {
          nappi.innerHTML = "Virhe lisättäessä!";
          console.error(err);
          showToast("Virhe tallentamisessa");
        }
        
        setTimeout(() => {
          nappi.disabled = false;
          nappi.innerHTML = "Tallenna resepti";
          nappi.classList.remove("blink");
        }, 2000);
      });
  
    } catch (e) {
      console.error("Virhe tarkemmassa reseptikyselyssä:", e.message);
    }
  }
  

  //odotetaan htmllän lataamista 
  document.addEventListener("DOMContentLoaded", () => {
    //funktio näyttää reset varmistuksen ja estää linkin oletustoiminnon
    function avaaResetVahvistus(event) {
      event.preventDefault();
      document.getElementById("resetModal").classList.remove("hidden");
    }
    
    //kun käyttäjä klikkaa "Kyllä" ladataan sivu uudelleen
    document.getElementById("vahvistaReset").addEventListener("click", () => {
      location.reload();
    });
  
    //kun käyttäjä klikkaa "Ei" piilotetaan modal
    document.getElementById("peruutaReset").addEventListener("click", () => {
      document.getElementById("resetModal").classList.add("hidden");
    });
  
    //jos käyttäjä klikkaa popupin taustaa katoaa myös
    document.getElementById("resetModal").addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.add("hidden");
      }
    });
  
    //tehdään reset funktiosta globaali jotta sitä voidaan kutsua htmllän onclickinä
    window.avaaResetVahvistus = avaaResetVahvistus;
  });


  window.toggleMenu = function () {
    const nav = document.getElementById("navMenu");
    const heroContent = document.querySelector(".hero-content");
    if (nav) nav.classList.toggle("active");
    if (heroContent) {
      heroContent.style.display = nav.classList.contains("active") ? "none" : "block";
    }
  };

  export function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
  
    toast.textContent = message;
    toast.classList.remove("hidden");
  
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }
import { translations } from './translations.js';

function updateLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  localStorage.setItem("language", lang);
}

document.getElementById("languageSwitcher").addEventListener("change", (e) => {
  updateLanguage(e.target.value);
});

const savedLang = localStorage.getItem("language") || "en";
document.getElementById("languageSwitcher").value = savedLang;
updateLanguage(savedLang);