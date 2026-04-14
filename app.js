// FORMA CORRETA PARA GITHUB PAGES (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Suas configurações do Firebase abaixo...
const firebaseConfig = {
  // ... (mantenha suas chaves aqui)
};

// COLOQUE SEUS DADOS AQUI NOVAMENTE
const firebaseConfig = {
apiKey: "AIzaSyBGZwBzwmkKFg38LUai1QQSvrNNGHBhy9E",
  authDomain: "financasfamiliares-c898b.firebaseapp.com",
  projectId: "financasfamiliares-c898b",
  storageBucket: "financasfamiliares-c898b.firebasestorage.app",
  messagingSenderId: "916560306624",
  appId: "1:916560306624:web:72c1ba7b97eb93c231e825",
  measurementId: "G-5W8V50CD3Q"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Elementos
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// Lógica de Login
loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro no login:", error);
        document.getElementById('auth-error').classList.remove('hidden');
    }
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
        document.getElementById('user-name').innerText = `Olá, ${user.displayName.split(' ')[0]}`;
        loadData(user.uid);
    } else {
        loginScreen.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
});

// O restante da função loadData e salvar dados permanece igual à versão anterior
// (Adicione o restante do código de salvamento e tabela aqui conforme enviado antes)