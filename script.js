//luodaan muuttujia htmllän id-elementtiä käyttäen
const radioYes = document.getElementById("radioYes");
const radioNo = document.getElementById("radioNo");
const kSisalto = document.getElementById("Ksisalto");
const eSisalto = document.getElementById("Esisalto");
const otsikko = document.getElementById("otsikkoEsisalto")
const slidebar = document.getElementById("slidebar");
const allergiat = document.getElementById("allergiat");
const haku = document.getElementById("haku");


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


document.addEventListener("DOMContentLoaded", () => {

  //luodaan muuttujia htmllän id-elementtiä käyttäen
  const aikaSlider = document.getElementById("aika");
  const aikaArvo = document.getElementById("aikaArvo");

  //päivittää sliderin etenemisen oranssina
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
});

  //kun käyttäjä painaa "haku" nappia tulee resepti kysely
  document.getElementById("haku").addEventListener("click", async () => {

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
          document.getElementById("valittuResepti").innerHTML = `<em>Haetaan reseptiä...</em>`;
          haeTarkempiResepti(valinta);
        });
      });

    } catch (e) {
      //jos tapahtuu virhe tuodaan error viesti consoleen
      console.error("Virhe haettaessa reseptejä:", e.message);
    }
  });

  //funktio hakee tarkemman reseptin valitulle reseptille
  async function haeTarkempiResepti(reseptiNimi) {
    if (!reseptiNimi || reseptiNimi === "Ei vastausta") {
      console.warn("Skipping invalid recipe request:", reseptiNimi);
      return;
    }
    
    //lähetetään pyyntö palvelimelle
    try {
      const response = await fetch(`${window.ENV.API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: `Anna tarkka resepti ja ainesmäärät ruoalle: ${reseptiNimi}` })
      });
      const data = await response.json();
      const vastaus = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ei reseptiä saatavilla.";
      
      //näytetään tarkempi resepti käyttöliittymässä
      const valittuBox = document.getElementById("valittuResepti");
      valittuBox.innerHTML = `
        <h4>Valitsemasi resepti: ${reseptiNimi}</h4>
        <p>${vastaus.replace(/\n/g, "<br>")}</p>
      `;} 
      catch (e) {
      console.error("Virhe tarkemmassa reseptikyselyssä:", e.message);
    }
  }

  //togglemenu pienemille näytöille
  function toggleMenu() {
    const nav = document.getElementById("navMenu");
    const heroContent = document.querySelector(".hero-content");
  
    nav.classList.toggle("active");

    //näytetään tai piilotetaan hero-content valikon mukaan
    if (nav.classList.contains("active")) {
      heroContent.style.display = "none";
    } else {
      heroContent.style.display = "block";
    }
  }