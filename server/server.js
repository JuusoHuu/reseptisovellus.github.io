//ladataan ympäristö muuttujat käyttöön
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

//otetaan CORS käyttöön sallien pyynnöt eri lähteistä
app.use(cors());

//asetetaan tarkemmat CORS pyynnot varmuuden vuoksi
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");  //sallii kaikki lähteet
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");   //sallitut metodit
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");    //sallitut otsikot
  next();
});

//mahdollistaa JSON datan vastaanoton pyynnoissä
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Resepti API is alive!");
});

//luetaan gemini api avain ympäristö muuttujista
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const kieli = localStorage.getItem("language") || "en";

//reitti resepti kyselyä varten
app.post("/api/ask", async (req, res) => {
  //haetaan pyynnön mukana tulevat tiedot
  const {
    kaytaKaapinSisaltoa,
    tuotteet,
    ruokatyyppi,
    aikaraja,
    allergiat,
    prompt
  } = req.body;


  
//promptti joka pyytää reseptien nimet geminiltä
const promptToUse = prompt || `Anna 3 ruokareseptiä, jotka sopivat ruokatyypille: ${ruokatyyppi}.
${kaytaKaapinSisaltoa === "yes" ? `Käytä seuraavia aineksia: ${tuotteet}` : "Älä käytä jääkaapin sisältöä"}.
Valmistusaika maksimissaan ${aikaraja} min eikä sisällä: ${allergiat || "ei mitään"}.
Listaa pelkät reseptien nimet, ei aineksia, valmistusohjeita tai muita huomioita äläkä kommentoi muuta ylimääräistä.`;

//lähettää konsoliin promptin varmistaakseen että se menee läpi
console.log("Prompt being sent to Gemini:", promptToUse);

  try {
    //lähetetään promptti geminille
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: promptToUse }] }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    //välitetään geminin vastaus fronttiin
    res.json(response.data);
  } catch (error) {
    //tulostetaan virheellinen vastaus konsoliin
    console.error("Gemini virhe:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error.message
    });
    res.status(500).json({
      virhe: "Gemini API epäonnistui",
      data: error?.response?.data || error.message
    });
  }
});

//määritetään portti jota palvelin kuuntelee ympäristö muuttuja tai oletusta
const PORT = process.env.PORT || 8080;

console.log("Ympäristöportti:", process.env.PORT);

//käynnistetään palvelin
app.listen(PORT, () => {
  console.log(`serveri pyörii portissa ${PORT}`);
});