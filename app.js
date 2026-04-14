// 1. Importações do Firebase via CDN (Versão para Navegador)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. CONFIGURAÇÃO DO SEU FIREBASE (SUBSTITUA PELOS SEUS DADOS)
const firebaseConfig = {
apiKey: "AIzaSyBGZwBzwmkKFg38LUai1QQSvrNNGHBhy9E",
  authDomain: "financasfamiliares-c898b.firebaseapp.com",
  projectId: "financasfamiliares-c898b",
  storageBucket: "financasfamiliares-c898b.firebasestorage.app",
  messagingSenderId: "916560306624",
  appId: "1:916560306624:web:72c1ba7b97eb93c231e825",
  measurementId: "G-5W8V50CD3Q"
};

// 3. Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Elementos da Interface
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const form = document.getElementById('finance-form');
const submitBtn = document.getElementById('submit-btn');
const list = document.getElementById('transaction-list');

let financeChart; // Variável para o gráfico

// --- FUNÇÃO DE LOGIN ---
loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao tentar logar com o Google.");
    }
};

// --- FUNÇÃO DE LOGOUT ---
logoutBtn.onclick = () => signOut(auth);

// --- OBSERVADOR DE ESTADO (LOGIN/LOGOUT) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
        document.getElementById('user-name').innerText = `Olá, ${user.displayName.split(' ')[0]}`;
        loadData(user.uid); // Carrega os dados do banco
    } else {
        loginScreen.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
});

// --- FUNÇÃO PARA SALVAR (COM RECORRÊNCIA) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // IMPORTANTE: Impede o recarregamento da página (não desloga)
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Salvando...";

    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const repeatUntil = document.getElementById('repeat-until').value; // Ex: 2026-12
    
    const uid = auth.currentUser.uid;
    const itemsParaSalvar = [];

    // Gerar datas para recorrência
    let dataAtual = new Date();
    dataAtual.setDate(1); // Normaliza para o dia 1

    if (repeatUntil) {
        let dataLimite = new Date(repeatUntil + "-02"); // Garante leitura correta do mês
        let dataLoop = new Date(dataAtual);

        while (dataLoop <= dataLimite) {
            itemsParaSalvar.push({
                desc: `${desc} (${dataLoop.toLocaleString('pt-BR', { month: 'short' })}/${dataLoop.getFullYear()})`,
                amount: amount,
                type: type,
                date: new Date(dataLoop)
            });
            dataLoop.setMonth(dataLoop.getMonth() + 1);
        }
    } else {
        itemsParaSalvar.push({ desc, amount, type, date: new Date() });
    }

    try {
        // Salva cada item no Firestore
        for (const item of itemsParaSalvar) {
            await addDoc(collection(db, `users/${uid}/transactions`), item);
        }
        form.reset();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar dados.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Lançar na Planilha";
    }
});

// --- CARREGAR DADOS EM TEMPO REAL ---
function loadData(uid) {
    const q = query(collection(db, `users/${uid}/transactions`), orderBy('date', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        let html = '';
        let income = 0;
        let expense = 0;
        let chartData = { income: 0, expense: 0 };
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const isIncome = data.type === 'income';
            
            isIncome ? income += data.amount : expense += data.amount;

            html += `
                <tr class="border-t hover:bg-gray-50 transition">
                    <td class="p-4 text-gray-700 font-medium">${data.desc}</td>
                    <td class="p-4 ${isIncome ? 'text-green-600' : 'text-red-600'} font-bold">
                        R$ ${data.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td class="p-4 text-xs">
                        <span class="px-2 py-1 rounded-full ${isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${isIncome ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <button onclick="deleteItem('${id}')" class="text-gray-400 hover:text-red-500 transition">
                             🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        list.innerHTML = html;
        updateDashboard(income, expense);
        initChart(income, expense);
    });
}

// --- ATUALIZAR CARDS ---
function updateDashboard(inc, exp) {
    document.getElementById('total-income').innerText = `R$ ${inc.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('total-expense').innerText = `R$ ${exp.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    const balance = inc - exp;
    const balanceEl = document.getElementById('total-balance');
    balanceEl.innerText = `R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    balanceEl.className = `text-2xl font-bold ${balance >= 0 ? 'text-gray-800' : 'text-red-500'}`;
}

// --- GRÁFICO ---
function initChart(inc, exp) {
    const ctx = document.getElementById('financeChart').getContext('2d');
    if (financeChart) financeChart.destroy();
    
    financeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: [inc, exp],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// --- DELETAR ITEM ---
window.deleteItem = async (id) => {
    if (confirm("Deseja excluir este lançamento?")) {
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, id));
        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
    }
};