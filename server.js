require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Resepti API is alive!");
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/ask", async (req, res) => {
  const {
    kaytaKaapinSisaltoa,
    tuotteet,
    ruokatyyppi,
    aikaraja,
    allergiat,
    prompt
  } = req.body;


  const promptToUse = prompt || `Anna 3 ruokareseptiä, joissa käytetään ${
    kaytaKaapinSisaltoa === "yes" ? tuotteet : "ei määritelty"
  }
Valmistusaika max ${aikaraja} min eikä sisällä: ${allergiat || "ei mitään"}.
Listaa pelkät reseptien nimet, ei aineksia, valmistusohjeita tai muita huomioita äläkä kommentoi muuta ylimääräistä.`;

console.log("Prompt being sent to Gemini:", promptToUse);

  try {
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

    res.json(response.data);
  } catch (error) {
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

console.log("📦 ENV PORT:", process.env.PORT);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});