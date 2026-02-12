import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2ZipJD-Mkt8IBkzgQJNO0TIEjjEBlvFM",
    authDomain: "resepti.firebaseapp.com",
    projectId: "resepti",
    storageBucket: "resepti.firebasestorage.app",
    messagingSenderId: "1071621906930",
    appId: "1:1071621906930:web:720a1914ad5828711d4b6b",
    measurementId: "G-FW74GE6E1Z"
  };
  
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

export function setupAuthHandlers() {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");
  
    if (loginBtn) {
      loginBtn.onclick = (e) => {
        e.preventDefault();
        signInWithPopup(auth, provider).catch(console.error);
      };
    }
  
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        signOut(auth).catch(console.error);
      };
    }
  
    onAuthStateChanged(auth, user => {
        if (user) {
          if (userInfo) userInfo.textContent = `${user.displayName || user.email}`;
          if (loginBtn) loginBtn.style.display = "none";
          if (logoutBtn) logoutBtn.style.display = "inline-block";
      
          //Ladataan suosikit jos listaelementti on olemassa
          const favoriteList = document.getElementById("favorite-list");
          if (favoriteList) {
            loadFavoritesAndShow().catch(console.error);
          }
      
        } else {
          if (userInfo) userInfo.textContent = "";
          if (loginBtn) loginBtn.style.display = "inline-block";
          if (logoutBtn) logoutBtn.style.display = "none";
        }
      });
  }
  
  import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  export async function addFavorite(recipe) {
    const user = auth.currentUser;
    if (!user) throw new Error("Ei kirjautunut käyttäjä.");
  
    const userFavoritesRef = collection(db, "users", user.uid, "favorites");
    await addDoc(userFavoritesRef, recipe);
  }

export async function removeFavorite(recipeId) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    favorites: arrayRemove(recipeId)
  });
}

export async function loadFavoritesAndShow() {
  const list = document.getElementById("favorite-list");
  if (!list) return;

  list.innerHTML = "";

  try {
    const favorites = await getFavorites(); // Haetaan alikokoelmasta

    if (favorites.length === 0) {
      list.innerHTML = "<li>Ei tallennettuja.</li>";
      return;
    }

    favorites.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="suosikki-kortti">
          <h4 class="resepti-otsikko">${item.title}</h4>
          <div class="resepti-sisalto hidden">
            <p>${item.content.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `;
      list.appendChild(li);
    });

    list.querySelectorAll(".resepti-otsikko").forEach(otsikko => {
      otsikko.addEventListener("click", () => {
        const sisalto = otsikko.nextElementSibling;
        sisalto.classList.toggle("hidden");
      });
    });

  } catch (err) {
    console.error("Virhe suosikkien latauksessa:", err);
    list.innerHTML = "<li>Virhe ladattaessa suosikkeja.</li>";
  }
}

export async function getFavorites() {
  const user = auth.currentUser;
  if (!user) throw new Error("Ei kirjautunut käyttäjä.");

  const userFavoritesRef = collection(db, "users", user.uid, "favorites");
  const snapshot = await getDocs(userFavoritesRef);
  return snapshot.docs.map(doc => doc.data());
}