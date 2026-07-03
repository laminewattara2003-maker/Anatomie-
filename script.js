const API_URL = "https://script.google.com/macros/s/AKfycbw7uCQXpNrmyx6EbAHzxYcaMJwPAlyu7dXMDMWesF4RQThvXId94eXdFpHrUGpnLWaA/exec";
let totalSeconds = 1200; // 20 min globales
let questionSeconds = 30; // 30s par question
let selectedAnswers = []; 
let serverDatabase = [];
let userIP = "Non détectée";
let currentStudentName = "";
let score = 0;
let i = 0;
let lock = false;
let globalInterval;
let questionInterval;
let liveCountInterval;
let isSubmitting = false; // true dès que la copie est en cours d'envoi : bloque le compteur en direct
let quizStarted = false;  // empêche un double clic sur "Commencer l'examen" de lancer deux minuteurs
let quizFinished = false; // empêche un double envoi de la copie (ex: fin de temps + dernière question au même instant)

// Échappe les caractères HTML sensibles avant d'insérer un texte saisi par un étudiant dans la page
// (protège tous les étudiants qui consultent le classement contre un nom contenant du code HTML/JS)
function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
let questions = [
    {q:`1- Quelle est la définition exacte de la cellule selon votre cours ?`,o:[`A- Le rassemblement d'organes pour former un système`,`B- La plus petite portion de matière vivante pouvant vivre isolément`,`C- Une simple combinaison d'atomes formant une molécule`,`D- Un groupement de tissus spécialisés`],a:["B"]},
    {q:`2- Comment appelle-t-on les organismes constitués d'une seule cellule ?`,o:[`A- Les métazoaires`,`B- Les protozoaires`,`C- Les tissus`,`D- Les inclusions`],a:["B"]},
    {q:`3- Quels sont les quatre éléments de base (atomes) qui constituent l'essentiel des cellules ?`,o:[`A- Fer, Iode, Calcium, Sodium`,`B- Carbone, Oxygène, Hydrogène, Azote`,`C- Carbone, Potassium, Soufre, Chlore`,`D- Eau, Glucides, Lipides, Protides`],a:["B"]},
    {q:`4- Quel est l'ordre correct des niveaux d'organisation de la matière vivante ?`,o:[`A- Cellules -> Atomes -> Molécules -> Organes`,`B- Atomes -> Molécules -> Cellules -> Tissus -> Organes -> Systèmes`,`C- Molécules -> Systèmes -> Tissus -> Cellules -> Atomes`,`D- Organes -> Systèmes -> Tissus -> Cellules`],a:["B"]},
    {q:`5- Quel terme est utilisé pour classer les éléments cellulaires comme le "blanc de l'œuf" ?`,o:[`A- Les glucides`,`B- Les lipides`,`C- Les protides`,`D- Les électrolytes`],a:["C"]},
    {q:`6- Vrai ou Faux : Les glucides sont la principale source d'énergie de la cellule.`,o:[`A- Vrai`,`B- Faux`],a:["A"]},
    {q:`7- Quel oligoélément est nécessaire à la coagulation du sang ?`,o:[`A- Le Fer (Fe)`,`B- L'Iode (I)`,`C- Le Calcium (Ca)`,`D- Le Potassium (K)`],a:["C"]},
    {q:`8- Quel est le rôle du Fer (Fe) dans l'organisme selon votre cours ?`,o:[`A- Synthèse de l'hormone thyroïdienne`,`B- Coagulation du sang`,`C- Composition de l'hémoglobine`,`D- Propagation de l'influx nerveux`],a:["C"]},
    {q:`9- Vrai ou Faux : Les ions sodium (Na+) et potassium (K+) sont essentiels pour la contraction des muscles et la propagation de l'influx nerveux.`,o:[`A- Vrai`,`B- Faux`],a:["A"]},
    {q:`10- Quel est le pourcentage d'eau dans la composition d'une cellule vivante ?`,o:[`A- Environ 40%`,`B- Environ 60%`,`C- Environ 80%`,`D- Environ 95%`],a:["B"]},
    {q:`11- Comment s'appelle la solution salée diluée dans laquelle baignent les cellules ?`,o:[`A- Le cytoplasme`,`B- Le liquide interstitiel`,`C- Le suc nucléaire`,`D- Le hyaloplasme`],a:["B"]},
    {q:`12- Vrai ou Faux : La taille d'une cellule peut varier de 2 microns à un mètre.`,o:[`A- Vrai`,`B- Faux`],a:["A"]},
    {q:`13- Quelle forme est caractéristique des globules rouges ?`,o:[`A- Filiforme`,`B- Circulaire`,`C- Cubique`,`D- Avec deux bouts pointus`],a:["B"]},
    {q:`14- Les cellules avec "deux bouts pointus" sont caractéristiques de quel type de cellules ?`,o:[`A- Les neurones`,`B- Les cellules épithéliales de revêtement`,`C- Les cellules musculaires lisses`,`D- Les globules rouges`],a:["C"]},
    {q:`15- Quelles sont les trois (3) régions principales qui composent la structure d'une cellule ?`,o:[`A- Membrane plasmique, Mitochondrie, Noyau`,`B- Membrane plasmique, Cytoplasme, Noyau`,`C- Paroi cellulaire, Cytosol, Chromatine`,`D- Appareil de Golgi, Membrane, Cytoplasme`],a:["B"]},
    {q:`16- Lequel de ces rôles n'est PAS attribué à la membrane plasmique ?`,o:[`A- L'absorption`,`B- La protection (reconnaissance des cellules pathogènes)`,`C- L'intégrité de la cellule`,`D- La synthèse des protéines`],a:["D"]},
    {q:`17- Quels sont les trois principaux éléments qui composent le cytoplasme ?`,o:[`A- Cytosol, organites, inclusions cytoplasmiques`,`B- Noyau, nucléoles, chromatine`,`C- Eau, sels minéraux, oligoéléments`,`D- Mitochondries, lysosomes, appareil de Golgi`],a:["A"]},
    {q:`18- Vrai ou Faux : Le cytoplasme est le matériel cellulaire compris entre la membrane plasmique et l'extérieur de la cellule.`,o:[`A- Vrai`,`B- Faux`],a:["B"]},
    {q:`19- Dans le noyau, quel composant renferme les 46 chromosomes ?`,o:[`A- Les ribosomes`,`B- Le suc nucléaire (nucléoplasme)`,`C- La chromatine`,`D- Les nucléoles`],a:["C"]},
    {q:`20- Vrai ou Faux : Les nucléoles (généralement au nombre de 2) sont des structures arrondies limitées par une membrane.`,o:[`A- Vrai`,`B- Faux`],a:["B"]},
    {q:`21- Quel est l'autre nom donné au cytosol (le liquide translucide du cytoplasme) ?`,o:[`A- Le nucléoplasme`,`B- L'ergastoplasme`,`C- Le hyaloplasme`,`D- Le chondriome`],a:["C"]},
    {q:`22- Quel organite est appelé l'appareil mitochondrial et gère l'activité de la cellule ?`,o:[`A- Le centrosome`,`B- Le chondriome`,`C- L'appareil de Golgi`,`D- Le lysosome`],a:["B"]},
    {q:`23- Quel est le rôle principal de l'appareil de Golgi ?`,o:[`A- La digestion des cellules usées`,`B- Il intervient dans l'activité sécrétoire`,`C- La division cellulaire`,`D- La synthèse protéique`],a:["B"]},
    {q:`24- Vrai ou Faux : Les lysosomes ont pour fonction la digestion des cellules usées.`,o:[`A- Vrai`,`B- Faux`],a:["A"]},
    {q:`25- Que signifie le terme "ERGASTOPLASME" ?`,o:[`A- Le noyau en phase de repos`,`B- Des ribosomes en cas d'activité de synthèse intense`,`C- Le réseau de mitochondries`,`D- Le liquide interstitiel modifié`],a:["B"]},
    {q:`26- Quel organite, situé au centre cellulaire, intervient lors de la mitose ?`,o:[`A- Le réticulum endoplasmique`,`B- L'appareil de Golgi`,`C- Le centrosome`,`D- Les structures fibrillaires`],a:["C"]},
    {q:`27- Vrai ou Faux : L'hémoglobine, stockée dans les inclusions cytoplasmiques, est considérée comme un déchet.`,o:[`A- Vrai`,`B- Faux`],a:["B"]},
    {q:`28- Que stockent les inclusions cytoplasmiques (vacuoles) ?`,o:[`A- Uniquement de l'eau`,`B- Des inclusions alimentaires (glycogène, lipides), des déchets et des pigments`,`C- Uniquement des déchets`,`D- L'information héréditaire (ADN)`],a:["B"]},
    {q:`29- Comment appelle-t-on la synthèse, par la cellule, de sa propre matière vivante ?`,o:[`A- La mitose`,`B- L'anabolisme`,`C- La respiration`,`D- L'exocytose`],a:["B"]},
    {q:`30- L'endocytose de matériels solides (digérés sous l'action des lysosomes) est spécifiquement appelée :`,o:[`A- Pinocytose`,`B- Phagocytose`,`C- Exocytose`,`D- Amitose`],a:["B"]},
    {q:`31- Quel est le rôle de l'exocytose ?`,o:[`A- Assurer l'expulsion des déchets hors de la cellule`,`B- Absorber de l'oxygène`,`C- Digérer les nutriments`,`D- Séparer les chromosomes`],a:["A"]},
    {q:`32- Vrai ou Faux : Les cellules aérobies trouvent l'O2 par des actions chimiques particulières sans l'emprunter au milieu extérieur.`,o:[`A- Vrai`,`B- Faux`],a:["B"]},
    {q:`33- Quel est le mode de division cellulaire (division directe) observé chez les unicellulaires ?`,o:[`A- La mitose`,`B- La méiose`,`C- L'amitose`,`D- L'anabolisme`],a:["C"]},
    {q:`34- Chez les pluricellulaires (division indirecte ou mitose), quelle phase correspond à la cellule "au repos" ?`,o:[`A- Prophase`,`B- Interphase`,`C- Métaphase`,`D- Télophase`],a:["B"]},
    {q:`35- Lors de quelle phase de la mitose assiste-t-on à la formation des cellules filles ?`,o:[`A- Anaphase`,`B- Prophase`,`C- Télophase`,`D- Interphase`],a:["C"]},
    {q:`36- Vrai ou Faux : La mitose réductionnelle (méiose) est un type de division réservé exclusivement aux cellules sexuelles.`,o:[`A- Vrai`,`B- Faux`],a:["A"]},
    {q:`37- Lors de la télophase de la méiose, combien de chromosomes possède chaque cellule fille ?`,o:[`A- Un nombre de chromosome double`,`B- Un nombre de chromosome égal à N`,`C- Un nombre de chromosome égal à N/2`,`D- Zéro chromosome`],a:["C"]},
    {q:`38- Quand considère-t-on qu'une cellule est définitivement morte (dégénérescence) ?`,o:[`A- Quand l'exocytose commence`,`B- Quand le noyau se divise`,`C- Quand l'anabolisme a définitivement cessé`,`D- Quand elle absorbe trop d'eau`],a:["C"]},
    {q:`39- Laquelle de ces propositions N'EST PAS une cause de mort cellulaire ?`,o:[`A- Accumulation de substances toxiques`,`B- Appauvrissement en aliments ou en O2`,`C- Modifications du milieu extérieur`,`D- Synthèse protéique intense (ergastoplasme)`],a:["D"]},
    {q:`40- Vrai ou Faux : Les échanges entre les cellules et le sang se font à travers le liquide interstitiel.`,o:[`A- Vrai`,`B- Faux`],a:["A"]}
];
// Mélange aléatoire des questions à chaque rechargement (algorithme de Fisher-Yates)
for (let idx = questions.length - 1; idx > 0; idx--) {
    const j = Math.floor(Math.random() * (idx + 1));
    [questions[idx], questions[j]] = [questions[j], questions[idx]];
}
window.onload = function() {
    fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(ipData => { userIP = ipData.ip; checkUserStatus(); })
    .catch(() => { checkUserStatus(); });

    // Rafraîchit le nombre d'étudiants déjà évalués toutes les 30s (écran de connexion + pendant l'examen)
    liveCountInterval = setInterval(refreshLiveCount, 30000);

    document.getElementById("name").addEventListener("keydown", e => {
        if (e.key === "Enter") start();
    });
};

// Récupère le nombre d'étudiants ayant déjà terminé et met à jour les badges visibles à l'écran
function refreshLiveCount() {
    if (isSubmitting) return; // n'interfère jamais avec l'envoi de la copie en cours
    fetch(API_URL)
    .then(res => res.json())
    .then(data => {
        if (isSubmitting) return; // vérification supplémentaire si l'envoi a démarré entre-temps
        serverDatabase = data;
        let loginBadge = document.getElementById("count-students-login");
        if (loginBadge) loginBadge.innerText = `👥 ${data.length} étudiant(s) ont déjà composé`;
        let quizValue = document.getElementById("live-count-value");
        if (quizValue) quizValue.innerText = data.length;
    })
    .catch(() => {});
}

function checkUserStatus() {
    fetch(API_URL)
    .then(res => res.json())
    .then(data => {
        serverDatabase = data;
        document.getElementById("count-students-login").innerText = `👥 ${data.length} étudiant(s) ont déjà composé`;
        let aujourdhui = new Date().toDateString();
        let dejaSoumis = data.find(row => row.ip === userIP && row.date && new Date(row.date).toDateString() === aujourdhui);
        if (dejaSoumis) { showSavedResults(dejaSoumis); } 
        else {
            document.getElementById("loading-screen").style.display = "none";
            document.getElementById("login").style.display = "flex";
            document.getElementById("name").focus();
        }
    })
    .catch(() => {
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("login").style.display = "flex";
        document.getElementById("name").focus();
    });
}

function handleBeforeUnload(e) {
    e.preventDefault();
    e.returnValue = '';
}

function start() {
    if (quizStarted) return;
    currentStudentName = document.getElementById("name").value.trim();
    if (!currentStudentName) { alert("Nom complet requis"); return; }
    let nomExiste = serverDatabase.find(row => row.nom && row.nom.trim().toLowerCase() === currentStudentName.toLowerCase());
    if (nomExiste) { showSavedResults(nomExiste); return; }
    quizStarted = true;
    document.getElementById("login").style.display = "none";
    document.getElementById("quiz").style.display = "flex";
    document.getElementById("student").innerText = currentStudentName;
    window.addEventListener("beforeunload", handleBeforeUnload);
    startGlobalTimer();
    load();
}

function startGlobalTimer() {
    globalInterval = setInterval(() => {
        totalSeconds--;
        let min = Math.floor(totalSeconds / 60);
        let sec = totalSeconds % 60;
        let globalEl = document.getElementById("global-timer");
        globalEl.innerText = `⏱ Global : ${min}:${sec < 10 ? '0' : ''}${sec}`;
        globalEl.classList.toggle("time-low", totalSeconds <= 60);
        if (totalSeconds <= 0) {
            clearInterval(globalInterval); clearInterval(questionInterval);
            alert("⏰ Temps global écoulé ! Copie envoyée."); finish();
        }
    }, 1000);
}

function load() {
    lock = false; selectedAnswers = []; questionSeconds = 30;
    let questionTimerEl = document.getElementById("question-timer");
    questionTimerEl.innerText = `⏳ Question : ${questionSeconds}s`;
    questionTimerEl.classList.remove("time-critical");
    let q = questions[i];
    let typeBadge = document.getElementById("quiz-type");
    let validateBtn = document.getElementById("btn-validate");
    if (q.a.length === 1) {
        typeBadge.innerText = "QCD : Choix unique direct"; typeBadge.style.background = "#4453d8"; validateBtn.style.display = "none";
    } else {
        typeBadge.innerText = "QCM : Choix multiple (" + q.a.length + " réponses)"; typeBadge.style.background = "#f2994a"; validateBtn.style.display = "block";
        validateBtn.disabled = true;
    }
    document.getElementById("question-counter").innerText = `Question ${i + 1} / ${questions.length}`;
    document.getElementById("question").innerText = q.q;
    let box = document.getElementById("options"); box.innerHTML = "";
    q.o.forEach(opt => {
        let b = document.createElement("button"); b.className = "option"; b.innerText = opt;
        b.onclick = () => selectOption(b, opt.charAt(0)); box.appendChild(b);
    });
    document.getElementById("bar").style.width = ((i / questions.length) * 100) + "%";

    clearInterval(questionInterval);
    questionInterval = setInterval(() => {
        questionSeconds--;
        questionTimerEl.innerText = `⏳ Question : ${questionSeconds}s`;
        questionTimerEl.classList.toggle("time-critical", questionSeconds <= 10 && questionSeconds > 0);
        if (questionSeconds <= 0) {
            clearInterval(questionInterval); lock = true;
            questions[i].userSelection = selectedAnswers;
            displayColors(questions[i].a, selectedAnswers); nextQuestion();
        }
    }, 1000);
}

function selectOption(buttonElement, letter) {
    if (lock) return;
    let q = questions[i];
    if (q.a.length === 1) { clearInterval(questionInterval); validateQCD(letter); } 
    else {
        if (selectedAnswers.includes(letter)) {
            selectedAnswers = selectedAnswers.filter(item => item !== letter);
            buttonElement.classList.remove("selected-opt");
        } else { selectedAnswers.push(letter); buttonElement.classList.add("selected-opt"); }
        document.getElementById("btn-validate").disabled = selectedAnswers.length === 0;
    }
}

function validateQCD(val) {
    lock = true; let correctList = questions[i].a; let isCorrect = correctList.includes(val);
    questions[i].userSelection = [val]; displayColors(correctList, [val]);
    if (isCorrect) score++; nextQuestion();
}

function validateQCM() {
    if (lock) return;
    if (selectedAnswers.length === 0) { alert("Sélectionnez au moins une option !"); return; }
    clearInterval(questionInterval); lock = true; let correctList = questions[i].a;
    let isFullyCorrect = ([...correctList].sort().join(",") === [...selectedAnswers].sort().join(","));
    questions[i].userSelection = selectedAnswers; displayColors(correctList, selectedAnswers);
    if (isFullyCorrect) score++; nextQuestion();
}

function displayColors(correctList, selectedList) {
    document.querySelectorAll(".option").forEach(btn => {
        btn.disabled = true; let letter = btn.innerText.charAt(0);
        if (correctList.includes(letter)) { btn.className = "option correct"; }
        else if (selectedList.includes(letter)) { btn.className = "option wrong"; }
    });
}

function nextQuestion() {
    setTimeout(() => {
        i++; if (i >= questions.length) { clearInterval(globalInterval); clearInterval(questionInterval); finish(); } else { load(); }
    }, 1000);
}

function finish() {
    if (quizFinished) return;
    quizFinished = true;
    isSubmitting = true;
    clearInterval(liveCountInterval);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    let noteSur20 = ((score / questions.length) * 20).toFixed(2);
    document.getElementById("quiz").style.display = "none";
    document.getElementById("loading-screen").style.display = "flex";
    document.getElementById("loading-screen").innerHTML = `<h3>Transmission de votre copie sécurisée...</h3>`;
    fetch(`${API_URL}?ip=${userIP}`, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "nom": currentStudentName, "score": `${score}/${questions.length}`, "note": `${noteSur20}/20` })
    })
    .then(() => { reloadDataAndShowResults(currentStudentName, noteSur20, score); })
    .catch(() => { reloadDataAndShowResults(currentStudentName, noteSur20, score); });
}

function reloadDataAndShowResults(studentName, finalNote, finalScore) {
    fetch(API_URL).then(res => res.json()).then(data => {
        serverDatabase = data; buildRankingTable(data); buildCorrectionGrid();
        showResultScreen(studentName, finalNote, finalScore);
    })
    .catch(() => {
        // La note a déjà été transmise au serveur avant cet appel : on l'affiche quand même
        // même si on ne peut pas recharger le classement général (connexion instable).
        buildCorrectionGrid();
        document.getElementById("ranking-table-container").innerHTML = "<p style='color:#7f8c8d; text-align:center;'>Classement momentanément indisponible. Votre note a bien été transmise.</p>";
        showResultScreen(studentName, finalNote, finalScore);
    });
}

function showResultScreen(studentName, finalNote, finalScore) {
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("result-welcome-msg").innerHTML = `Étudiant : <strong>${escapeHtml(studentName)}</strong>.<br>Note finale enregistrée : <strong style="font-size:22px; color:#27ae60;">${finalNote}/20</strong> (${finalScore}/${questions.length}).`;
    document.getElementById("result-screen").style.display = "flex";
}

function showSavedResults(studentRow) {
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("login").style.display = "none";
    document.getElementById("quiz").style.display = "none";
    document.getElementById("already-done-msg").style.display = "block";
    document.getElementById("result-welcome-msg").innerHTML = `Étudiant : <strong>${escapeHtml(studentRow.nom)}</strong>.<br>Note finale : <strong style="font-size:22px; color:#27ae60;">${escapeHtml(studentRow.note)}</strong> (${escapeHtml(studentRow.score)}).`;
    buildRankingTable(serverDatabase);
    document.getElementById("correction-box").innerHTML = "<p style='color:#7f8c8d; text-align:center;'>La grille de correction détaillée est affichée uniquement lors de la soumission initiale de la copie pour des raisons de sécurité.</p>";
    document.getElementById("result-screen").style.display = "flex";
}

function buildRankingTable(data) {
    if (!data || data.length === 0) { document.getElementById("ranking-table-container").innerHTML = "<p>Aucune note.</p>"; return; }
    data.sort((a, b) => parseFloat(b.note) - parseFloat(a.note));
    let tableHtml = `<table class="rank-table"><tr><th>Rang</th><th>Nom Étudiant</th><th>Note /20</th></tr>`;
    data.forEach((student, index) => {
        let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : (index + 1);
        let isMe = currentStudentName && student.nom && student.nom.trim().toLowerCase() === currentStudentName.trim().toLowerCase();
        tableHtml += `<tr class="${isMe ? 'rank-me' : ''}"><td>${medal}</td><td>${escapeHtml(student.nom) || "Anonyme"}</td><td><strong>${escapeHtml(student.note) || "N/A"}</strong></td></tr>`;
    });
    tableHtml += `</table>`; document.getElementById("ranking-table-container").innerHTML = tableHtml;
}

function buildCorrectionGrid() {
    let html = "";
    questions.forEach((q, index) => {
        let userSel = q.userSelection || [];
        let isCorrect = ([...q.a].sort().join(",") === [...userSel].sort().join(","));
        let color = isCorrect ? "#d4edda" : "#f8d7da";
        let correctTexts = q.o.filter(opt => q.a.includes(opt.charAt(0))).join(' | ');
        let userTexts = userSel.length > 0 ? q.o.filter(opt => userSel.includes(opt.charAt(0))).join(' | ') : "Aucune réponse / Temps écoulé";
        html += `
        <div style="background:${color}; padding:10px; margin-bottom:10px; border-radius:6px; font-size:13px; border-left:5px solid ${isCorrect ? '#2ecc71':'#e74c3c'}">
            <b>Q${index + 1} : ${q.q}</b><br>
            <span style="color:#27ae60;">✔ Réponse correcte : ${correctTexts}</span><br>
            <span style="color:${isCorrect ? '#27ae60':'#c0392b'};">❌ Votre choix : ${userTexts}</span>
        </div>`;
    });
    document.getElementById("correction-box").innerHTML = html;
}