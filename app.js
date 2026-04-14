// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Elementos da UI
const loginBtn = document.getElementById('login-btn');
const appContent = document.getElementById('app-content');
const form = document.getElementById('finance-form');
const list = document.getElementById('transaction-list');

// Login
loginBtn.onclick = () => signInWithPopup(auth, provider);

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.classList.add('hidden');
        appContent.classList.remove('hidden');
        loadData(user.uid);
    }
});

// Salvar Dados
form.onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, `users/${auth.currentUser.uid}/transactions`), {
        desc: document.getElementById('desc').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        date: new Date()
    });
    form.reset();
};

// Carregar e Atualizar UI
function loadData(uid) {
    const q = query(collection(db, `users/${uid}/transactions`));
    onSnapshot(q, (snapshot) => {
        let html = '';
        let income = 0, expense = 0;
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isIncome = data.type === 'income';
            isIncome ? income += data.amount : expense += data.amount;

            html += `
                <tr class="border-t">
                    <td class="p-4">${data.desc}</td>
                    <td class="p-4 ${isIncome ? 'text-green-600' : 'text-red-600'}">R$ ${data.amount.toFixed(2)}</td>
                    <td class="p-4 text-sm uppercase text-gray-500">${isIncome ? 'Entrada' : 'Saída'}</td>
                    <td class="p-4">
                        <button onclick="deleteItem('${docSnap.id}')" class="text-red-500 hover:underline">Excluir</button>
                    </td>
                </tr>
            `;
        });
        list.innerHTML = html;
        updateDashboard(income, expense);
    });
}

function updateDashboard(inc, exp) {
    document.getElementById('total-income').innerText = `R$ ${inc.toFixed(2)}`;
    document.getElementById('total-expense').innerText = `R$ ${exp.toFixed(2)}`;
    document.getElementById('total-balance').innerText = `R$ ${(inc - exp).toFixed(2)}`;
}

window.deleteItem = (id) => deleteDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, id));
