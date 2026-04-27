let animeLibrary = [];
let currentFilter = 'watching';
let editingId = null; 

try { const savedData = localStorage.getItem('suleymanAnimeData'); if (savedData) animeLibrary = JSON.parse(savedData); } 
catch(e) { console.error("Memory error:", e); }

function apply3DTilt(element) {
    if(document.body.classList.contains('potato-mode')) return;
    element.addEventListener('mousemove', (e) => {
        if(document.body.classList.contains('potato-mode')) return;
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const centerX = rect.width / 2; const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12; const rotateY = ((x - centerX) / centerX) * 12;
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    element.addEventListener('mouseleave', () => { element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`; });
}

document.querySelectorAll('.main-card').forEach(card => apply3DTilt(card));

window.openAnimeModule = function() { 
    triggerSwipeTransition(() => { 
        document.getElementById('dashboard-view').style.display = 'none'; 
        document.getElementById('anime-view').style.display = 'flex'; 
        changeBGM('Musics/bgm-library.mp3', "Library Theme");
        renderLibrary(); 
    }, 'forward'); 
}

window.goBackToDashboard = function() { 
    triggerSwipeTransition(() => { 
        document.getElementById('anime-view').style.display = 'none'; 
        document.getElementById('dashboard-view').style.display = 'block'; 
        changeBGM('Musics/bgm-main.mp3', "Main Hub Theme");
    }, 'back'); 
}

window.renderLibrary = function() {
    const grid = document.getElementById('main-grid');
    if(!grid) return;
    grid.innerHTML = ''; 

    const addBtn = document.createElement('div');
    addBtn.className = 'anime-item add-new-btn';
    addBtn.onclick = () => openModal(null);
    addBtn.innerHTML = `<div class="anime-img-container" style="background:transparent; border:none; box-shadow:none;"><i class="fa-solid fa-plus"></i></div><span data-i18n="add-new">Add New...</span>`;
    grid.appendChild(addBtn);
    apply3DTilt(addBtn); 

    animeLibrary.forEach(item => {
        if (item.status !== currentFilter) return;

        const card = document.createElement('div');
        let themeClass = item.themeClass || 'theme-aero';
        card.className = `anime-item ${themeClass}`;
        card.id = `card-${item.id}`;

        let typeIcon = 'fa-tv';
        if(item.type === 'Manga') typeIcon = 'fa-book-open';
        if(item.type === 'Film') typeIcon = 'fa-film';
        if(item.type === 'Series') typeIcon = 'fa-video';
        if(item.type === 'Book') typeIcon = 'fa-book';

        let watermarkIcon = typeIcon; 
        if (themeClass === 'theme-jjk') watermarkIcon = 'fa-ghost';
        if (themeClass === 'theme-bluelock') watermarkIcon = 'fa-futbol';
        if (themeClass === 'theme-naruto') watermarkIcon = 'fa-leaf';
        if (themeClass === 'theme-aot') watermarkIcon = 'fa-shield-halved';
        if (themeClass === 'theme-onepiece') watermarkIcon = 'fa-skull-crossbones';
        if (themeClass === 'theme-dragonball') watermarkIcon = 'fa-dragon';
        if (themeClass === 'theme-demonslayer') watermarkIcon = 'fa-fire-flame-curved';
        if (themeClass === 'theme-evangelion') watermarkIcon = 'fa-robot';
        if (themeClass === 'theme-image-focus') watermarkIcon = 'fa-image';

        let percent = (item.progress / item.total) * 100;
        if(percent > 100) percent = 100;

        let imgHTML = item.imgUrl ? `<img src="${item.imgUrl}" class="anime-real-img">` : `<i class="fa-solid ${typeIcon}"></i>`;
        let dynamicBlur = (themeClass === 'theme-image-focus' && item.imgUrl) ? `<img src="${item.imgUrl}" class="dynamic-blur-bg">` : '';

        let ratingHTML = '<div class="star-rating">';
        let rating = item.rating || 0;
        for(let i=1; i<=5; i++) {
            if(i <= rating) ratingHTML += '<i class="fa-solid fa-star"></i>';
            else ratingHTML += '<i class="fa-regular fa-star"></i>';
        }
        ratingHTML += '</div>';

        let linkHTML = '';
        if (item.link && item.link.trim() !== '') {
            let fullLink = item.link.startsWith('http') ? item.link : 'https://' + item.link;
            linkHTML = `<a href="${fullLink}" target="_blank" class="aero-link-btn" onclick="event.stopPropagation()">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Media
                        </a>`;
        }

        let tWatch = translations[currentLang]["stat-watching"] || "Watching";
        let tRead = translations[currentLang]["stat-reading"] || "Reading";
        let tPlan = translations[currentLang]["stat-plan"] || "Plan";
        let tComp = translations[currentLang]["stat-completed"] || "Completed";

        card.innerHTML = `
            ${dynamicBlur}
            <i class="fa-solid ${watermarkIcon} theme-watermark"></i>
            <div class="control-btns">
                <button class="aero-glass-btn aero-btn-edit" onclick="openModal(${item.id})"><i class="fa-solid fa-pencil"></i></button>
                <button class="aero-glass-btn aero-btn-del" onclick="deleteEntry(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="anime-img-container">${imgHTML}</div>
            <div class="anime-title" title="${item.title}">${item.title}</div>
            ${ratingHTML}
            <select class="status-dropdown aero-select" onchange="changeStatus(${item.id}, this.value)">
                <option value="watching" ${item.status === 'watching' ? 'selected' : ''}>${tWatch}</option>
                <option value="reading" ${item.status === 'reading' ? 'selected' : ''}>${tRead}</option>
                <option value="plan" ${item.status === 'plan' ? 'selected' : ''}>${tPlan}</option>
                <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>${tComp}</option>
            </select>
            ${linkHTML}
            <div class="progress-wrapper">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <div class="progress-info">
                    <button class="aero-glass-btn aero-btn-progress" onclick="updateProgress(${item.id}, -1)">-</button>
                    <span>${item.progress} / ${item.total}</span>
                    <button class="aero-glass-btn aero-btn-progress" onclick="updateProgress(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        apply3DTilt(card);
    });
}

window.updateProgress = function(id, amount) {
    const cardElement = document.getElementById(`card-${id}`);
    let animDuration = 600; 
    if (cardElement && !document.body.classList.contains('potato-mode')) {
        if (amount > 0) { cardElement.classList.add('anim-card-plus'); animDuration = 1400; } 
        else { cardElement.classList.add('anim-card-minus'); }
    }
    const index = animeLibrary.findIndex(i => i.id === id);
    if(index > -1) {
        let newProg = animeLibrary[index].progress + amount;
        if(newProg < 0) newProg = 0; 
        if(newProg > animeLibrary[index].total) newProg = animeLibrary[index].total; 
        animeLibrary[index].progress = newProg;
        saveData(); setTimeout(() => { renderLibrary(); }, animDuration);
    }
}

window.submitEntry = function() {
    const title = document.getElementById('entry-title').value;
    const img = document.getElementById('entry-img').value;
    const link = document.getElementById('entry-link') ? document.getElementById('entry-link').value : ""; 
    const type = document.getElementById('entry-type').value;
    const status = document.getElementById('entry-status').value;
    const theme = document.getElementById('entry-theme').value; 
    const prog = parseInt(document.getElementById('entry-progress').value) || 0;
    const tot = parseInt(document.getElementById('entry-total').value) || 1;
    const rating = parseInt(document.getElementById('entry-rating').value) || 0;

    if (!title) { alert("Title is required!"); return; }

    if (editingId) {
        const index = animeLibrary.findIndex(i => i.id === editingId);
        if (index > -1) animeLibrary[index] = { id: editingId, title, imgUrl: img, link: link, type, status, themeClass: theme, progress: prog, total: tot, rating: rating };
    } else {
        const newItem = { id: Date.now(), title, imgUrl: img, link: link, type, status, themeClass: theme, progress: prog, total: tot, rating: rating };
        animeLibrary.push(newItem);
    }
    saveData(); closeModal(); renderLibrary();
}

window.deleteEntry = function(id) { if(confirm("Delete this entry?")) { animeLibrary = animeLibrary.filter(i => i.id !== id); saveData(); renderLibrary(); } }
window.changeStatus = function(id, newStatus) { const index = animeLibrary.findIndex(i => i.id === id); if(index > -1) { animeLibrary[index].status = newStatus; saveData(); renderLibrary(); } }
function saveData() { localStorage.setItem('suleymanAnimeData', JSON.stringify(animeLibrary)); }

window.filterCategory = function(status, btn) { 
    currentFilter = status; 
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active-tab')); 
    btn.classList.add('active-tab'); 
    
    if(!document.body.classList.contains('potato-mode')) {
        btn.classList.remove('tab-bump');
        void btn.offsetWidth; 
        btn.classList.add('tab-bump');
        setTimeout(() => btn.classList.remove('tab-bump'), 400);
    }
    
    document.getElementById('category-title').innerText = btn.innerText; 
    renderLibrary(); 
}

window.openModal = function(id = null) { 
    editingId = id;
    if (id) {
        const item = animeLibrary.find(i => i.id === id);
        document.getElementById('modal-title').innerText = translations[currentLang]["btn-save"] || "Edit Entry";
        document.getElementById('submit-btn').innerText = translations[currentLang]["btn-save"] || "Save Changes";
        document.getElementById('entry-title').value = item.title;
        document.getElementById('entry-img').value = item.imgUrl || "";
        if(document.getElementById('entry-link')) document.getElementById('entry-link').value = item.link || ""; 
        document.getElementById('entry-type').value = item.type;
        document.getElementById('entry-status').value = item.status;
        document.getElementById('entry-theme').value = item.themeClass || "theme-aero";
        document.getElementById('entry-progress').value = item.progress;
        document.getElementById('entry-total').value = item.total;
        document.getElementById('entry-rating').value = item.rating || 0;
    } else {
        document.getElementById('modal-title').innerText = translations[currentLang]["add-entry-title"] || "Add New Entry";
        document.getElementById('submit-btn').innerText = translations[currentLang]["btn-add"] || "Add";
        document.getElementById('entry-title').value = "";
        document.getElementById('entry-img').value = "";
        if(document.getElementById('entry-link')) document.getElementById('entry-link').value = "";
        document.getElementById('entry-progress').value = "0";
        document.getElementById('entry-rating').value = "0";
    }
    const modal = document.getElementById('add-modal');
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10);
}

window.closeModal = function() { 
    const modal = document.getElementById('add-modal');
    modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; editingId = null; }, 300);
}