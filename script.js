const radioYes = document.getElementById("radioYes");
const radioNo = document.getElementById("radioNo");

const kSisalto = document.getElementById("Ksisalto");
const eSisalto = document.getElementById("Esisalto");
const slidebar = document.getElementById("slidebar");
const allergiat = document.getElementById("allergiat");
const haku = document.getElementById("haku");

radioYes.addEventListener("change", () => {
  if (radioYes.checked) {
    kSisalto.classList.remove("hidden");
    eSisalto.classList.add("hidden");
    slidebar.classList.remove("hidden");
    allergiat.classList.remove("hidden");
    haku.classList.remove("hidden");
  }
});

radioNo.addEventListener("change", () => {
  if (radioNo.checked) {
    kSisalto.classList.add("hidden");
    eSisalto.classList.remove("hidden");
    slidebar.classList.remove("hidden");
    allergiat.classList.remove("hidden");
    haku.classList.remove("hidden");
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const aikaSlider = document.getElementById("aika");
  const aikaArvo = document.getElementById("aikaArvo");

  //Funktio taustan väriin
  function paivitaSliderVari() {
    const min = aikaSlider.min;
    const max = aikaSlider.max;
    const val = aikaSlider.value;

    const prosentti = ((val - min) / (max - min)) * 100;
    aikaSlider.style.background = `linear-gradient(to right, #ffa500 0%, #ffa500 ${prosentti}%, #ccc ${prosentti}%, #ccc 100%)`;
  }

  //Päivitä sekä arvo että väri
  aikaSlider.addEventListener("input", function () {
    aikaArvo.textContent = this.value;
    paivitaSliderVari();
  });

  //Alustus kun sivu latautuu
  aikaArvo.textContent = aikaSlider.value;
  paivitaSliderVari();
});

  document.getElementById("haku").addEventListener("click", async () => {
    const kaappiValinta = document.querySelector('input[name="jaakaappiSisalto"]:checked')?.value;
    let tuotteet = "";
    let vaihtoehto = "";

    if (kaappiValinta === "yes") {
      tuotteet = document.getElementById("tuote").value.trim();
    } else if (kaappiValinta === "no") {
      vaihtoehto = document.querySelector('input[name="vaihtoehto"]:checked')?.value || "";
    }

    const aikaraja = document.getElementById("aika").value;
    const allergiat = document.getElementById("allergia").value.trim();

    const vastaukset = {
      kaytaKaapinSisaltoa: kaappiValinta,
      tuotteet: tuotteet,
      ruokatyyppi: vaihtoehto,
      aikaraja: Number(aikaraja),
      allergiat: allergiat
    };

    console.log("Lähetetään palvelimelle:", vastaukset);

    try {
      const response = await fetch(`${window.ENV.API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vastaukset)
      });

      const data = await response.json();
      console.log("Palvelimen vastaus:", data);

      const vastaus = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ei vastausta";
      const vastausElementti = document.getElementById("vastaus");
      
      const reseptiLista = vastaus.split("\n").filter(r => r.trim() !== "");
      
      let reseptiHTML = "<h3>Reseptiehdotukset:</h3><ul>";
      reseptiLista.forEach((resepti, index) => {
        reseptiHTML += `<li><button class="resepti-valinta" data-valinta="${resepti}">${resepti}</button></li>`;
      });
      reseptiHTML += "</ul><div id='valittuResepti'></div>";
      
      vastausElementti.innerHTML = reseptiHTML;
      vastausElementti.classList.remove("hidden");
      
      document.querySelectorAll(".resepti-valinta").forEach(button => {
        button.addEventListener("click", (e) => {
          const valinta = e.target.getAttribute("data-valinta");
          console.log("Käyttäjä valitsi reseptin:", valinta);
          document.getElementById("valittuResepti").innerHTML = `<em>Haetaan reseptiä...</em>`;
          haeTarkempiResepti(valinta);
        });
      });

    } catch (e) {
      console.error("Virhe haettaessa reseptejä:", e.message);
    }
  });

  async function haeTarkempiResepti(reseptiNimi) {
    if (!reseptiNimi || reseptiNimi === "Ei vastausta") {
      console.warn("Skipping invalid recipe request:", reseptiNimi);
      return;
    }
    
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
  
      const valittuBox = document.getElementById("valittuResepti");
      valittuBox.innerHTML = `
        <h4>Valitsemasi resepti: ${reseptiNimi}</h4>
        <p>${vastaus.replace(/\n/g, "<br>")}</p>
      `;
    } catch (e) {
      console.error("Virhe tarkemmassa reseptikyselyssä:", e.message);
    }
  }