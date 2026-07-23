/* =================================================================
   PARK AUTO MEF — FRONTEND SPA APPLICATION LOGIC
   Fully Integrated with Spring Boot REST API
   ================================================================= */

const API_BASE = '/api';

// Application State
let state = {
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    vehicules: [],
    currentVehicule: null
};

// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardLayout = document.getElementById('dashboard-layout');
const mainHeader = document.getElementById('main-header');
const formLogin = document.getElementById('form-login');
const formChangePassword = document.getElementById('form-change-password');
const formVehicule = document.getElementById('form-vehicule');
const formStatusChange = document.getElementById('form-status-change');
const filterSearch = document.getElementById('filter-search');
const filterStatut = document.getElementById('filter-statut');
const btnOpenCreateModal = document.getElementById('btn-open-create-modal');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    if (state.token && state.user) {
        if (state.user.doitChangerMotDePasse) {
            showMandatoryPasswordChange();
        } else {
            showDashboard();
        }
    } else {
        showLogin();
    }
}

function setupEventListeners() {
    // Login Submit
    if (formLogin) {
        formLogin.addEventListener('submit', handleLogin);
    }
    
    // Logout Buttons
    const btnLogoutHeader = document.getElementById('btn-logout');
    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener('click', handleLogout);
    }

    // Password Change Submit
    if (formChangePassword) {
        formChangePassword.addEventListener('submit', handleChangePassword);
    }

    // Search & Filter Listeners
    if (filterSearch) filterSearch.addEventListener('input', renderVehicules);
    if (filterStatut) filterStatut.addEventListener('change', renderVehicules);

    // Open Create Modal
    if (btnOpenCreateModal) {
        btnOpenCreateModal.addEventListener('click', () => {
            document.getElementById('vehicule-id').value = '';
            formVehicule.reset();
            document.getElementById('modal-vehicule-title').innerHTML = '<i class="fa-solid fa-car"></i> Nouveau Véhicule';
            openModal('modal-vehicule-form');
        });
    }

    // Vehicle Form Submit
    if (formVehicule) {
        formVehicule.addEventListener('submit', handleSaveVehicule);
    }

    // Status Change Submit
    if (formStatusChange) {
        formStatusChange.addEventListener('submit', handleSaveStatusChange);
    }

    // Sidebar Items Click Handler
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const viewName = item.getAttribute('data-view');
            const pageTitle = item.querySelector('span').textContent;
            document.getElementById('current-page-title').textContent = pageTitle;
            
            if (viewName !== 'vehicules' && viewName !== 'dashboard') {
                showToast(`Module '${pageTitle}' — Vue analytique bientôt disponible`, 'info');
            }
        });
    });
}

function togglePasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    const icon = document.getElementById(`eye-icon-${fieldId}`);
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye';
    } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye-slash';
    }
}

/* =================================================================
   AUTHENTICATION & SECURITY HANDLERS
   ================================================================= */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const motDePasse = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, motDePasse })
        });

        const data = await res.json();

        if (res.ok && data.data) {
            state.token = data.data.accessToken;
            state.refreshToken = data.data.refreshToken;
            state.user = data.data.utilisateur;

            localStorage.setItem('token', state.token);
            localStorage.setItem('refreshToken', state.refreshToken);
            localStorage.setItem('user', JSON.stringify(state.user));

            showToast('Connexion réussie — Bienvenue sur Park Auto MEF', 'success');

            if (state.user.doitChangerMotDePasse) {
                showMandatoryPasswordChange();
            } else {
                showDashboard();
            }
        } else {
            showToast(data.message || 'Adresse email ou mot de passe incorrect', 'error');
        }
    } catch (err) {
        showToast('Erreur de connexion au serveur API', 'error');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const ancienMotDePasse = document.getElementById('pw-ancien').value;
    const nouveauMotDePasse = document.getElementById('pw-nouveau').value;

    try {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ancienMotDePasse, nouveauMotDePasse })
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Mot de passe modifié avec succès', 'success');
            state.user.doitChangerMotDePasse = false;
            localStorage.setItem('user', JSON.stringify(state.user));
            closeModal('modal-change-password');
            showDashboard();
        } else {
            showToast(data.message || 'Erreur lors du changement de mot de passe', 'error');
        }
    } catch (err) {
        showToast('Erreur serveur lors de la mise à jour', 'error');
    }
}

function handleLogout() {
    state = { token: null, refreshToken: null, user: null, vehicules: [], currentVehicule: null };
    localStorage.clear();
    showLogin();
    showToast('Déconnexion effectuée avec succès', 'success');
}

function showLogin() {
    loginView.classList.remove('hidden');
    dashboardLayout.classList.add('hidden');
    mainHeader.classList.add('hidden');
}

function showMandatoryPasswordChange() {
    loginView.classList.add('hidden');
    dashboardLayout.classList.add('hidden');
    mainHeader.classList.add('hidden');
    openModal('modal-change-password');
}

function showDashboard() {
    loginView.classList.add('hidden');
    dashboardLayout.classList.remove('hidden');
    mainHeader.classList.remove('hidden');

    // Update Header & Sidebar User Profiles
    const fullName = `${state.user.prenom} ${state.user.nom}`;
    const roleName = state.user.role ? (state.user.role.nom || 'ADMIN') : 'ADMIN';
    const initials = (state.user.prenom[0] + state.user.nom[0]).toUpperCase();

    const nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = fullName;
    
    const roleEl = document.getElementById('user-display-role');
    if (roleEl) roleEl.textContent = roleName;

    fetchVehicules();
}

/* =================================================================
   VEHICLE API & CRUD OPERATIONS
   ================================================================= */
async function fetchVehicules() {
    try {
        const res = await fetch(`${API_BASE}/vehicules?size=100`, {
            headers: getAuthHeaders()
        });

        const data = await res.json();

        if (res.ok && data.data) {
            state.vehicules = data.data.content || [];
            updateMetrics();
            renderVehicules();
        } else if (res.status === 403 && state.user && state.user.doitChangerMotDePasse) {
            showMandatoryPasswordChange();
        } else {
            showToast('Erreur lors du chargement des véhicules', 'error');
        }
    } catch (err) {
        showToast('Impossible de contacter le serveur API', 'error');
    }
}

function updateMetrics() {
    const total = state.vehicules.length;
    const disponibles = state.vehicules.filter(v => v.statutAdministratif === 'DISPONIBLE').length;
    const entretien = state.vehicules.filter(v => ['EN_ENTRETIEN', 'EN_REPARATION', 'IMMOBILISE'].includes(v.statutAdministratif)).length;
    const horsService = state.vehicules.filter(v => ['HORS_SERVICE', 'ACCIDENTE', 'REFORME'].includes(v.statutAdministratif) || (v.etatTechnique === 'HORS_SERVICE')).length;
    const archives = state.vehicules.filter(v => v.statutAdministratif === 'ARCHIVE').length;

    const elTotal = document.getElementById('stat-total');
    if (elTotal) elTotal.textContent = total;

    const elDisp = document.getElementById('stat-disponibles');
    if (elDisp) elDisp.textContent = disponibles;

    const elEnt = document.getElementById('stat-entretien');
    if (elEnt) elEnt.textContent = entretien;

    const elHs = document.getElementById('stat-hors-service');
    if (elHs) elHs.textContent = horsService;

    const elArch = document.getElementById('stat-archives');
    if (elArch) elArch.textContent = archives;
}

function renderVehicules() {
    const grid = document.getElementById('vehicles-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid) return;

    const query = filterSearch ? filterSearch.value.toLowerCase().trim() : '';
    const selectedStatut = filterStatut ? filterStatut.value : '';

    const filtered = state.vehicules.filter(v => {
        const matchesSearch = !query || 
            v.immatriculation.toLowerCase().includes(query) ||
            v.marque.toLowerCase().includes(query) ||
            v.modele.toLowerCase().includes(query) ||
            v.numeroInventaire.toLowerCase().includes(query);

        const matchesStatut = !selectedStatut || v.statutAdministratif === selectedStatut;

        return matchesSearch && matchesStatut;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = filtered.map(v => createVehicleCardHTML(v)).join('');
}

function createVehicleCardHTML(v) {
    const statusClass = (v.statutAdministratif || 'DISPONIBLE').toLowerCase();
    
    return `
        <div class="vehicle-card">
            <div class="vehicle-media">
                <img src="assets/car_default.jpg" alt="${escapeHTML(v.marque)} ${escapeHTML(v.modele)}" onerror="this.style.display='none'">
            </div>
            <div class="vehicle-card-body">
                <div class="vehicle-header">
                    <span class="plate-badge">${escapeHTML(v.immatriculation)}</span>
                    <span class="status-pill ${statusClass}">${escapeHTML(v.statutAdministratif)}</span>
                </div>
                
                <div class="vehicle-body">
                    <h3>${escapeHTML(v.marque)} ${escapeHTML(v.modele)}</h3>
                    <span class="vehicle-sub">N° Inventaire: <strong>${escapeHTML(v.numeroInventaire)}</strong></span>
                </div>

                <div class="vehicle-details">
                    <div class="detail-item"><i class="fa-solid fa-gas-pump"></i> ${escapeHTML(v.typeCarburant)}</div>
                    <div class="detail-item"><i class="fa-solid fa-gauge-high"></i> ${v.kilometrageActuel} km</div>
                    <div class="detail-item"><i class="fa-solid fa-fingerprint"></i> ${escapeHTML(v.numeroChassis)}</div>
                    <div class="detail-item"><i class="fa-solid fa-heart-pulse"></i> ${escapeHTML(v.etatTechnique)}</div>
                </div>

                <div class="vehicle-actions">
                    <button class="btn-icon" onclick="openEditModal(${v.id})" title="Modifier">
                        <i class="fa-solid fa-pen"></i> Modifier
                    </button>
                    <button class="btn-icon" onclick="openStatusModal(${v.id})" title="Changer Statut">
                        <i class="fa-solid fa-rotate"></i> Statut
                    </button>
                    <button class="btn-icon" onclick="openHistoryModal(${v.id})" title="Historique">
                        <i class="fa-solid fa-clock-rotate-left"></i> Historique
                    </button>
                    <button class="btn-icon danger" onclick="confirmArchive(${v.id})" title="Archiver">
                        <i class="fa-solid fa-box-archive"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function handleSaveVehicule(e) {
    e.preventDefault();
    const id = document.getElementById('vehicule-id').value;

    const payload = {
        immatriculation: document.getElementById('v-immatriculation').value,
        numeroInventaire: document.getElementById('v-numeroInventaire').value,
        numeroChassis: document.getElementById('v-numeroChassis').value,
        marque: document.getElementById('v-marque').value,
        modele: document.getElementById('v-modele').value,
        typeCarburant: document.getElementById('v-typeCarburant').value,
        kilometrageInitial: parseInt(document.getElementById('v-kilometrageInitial').value),
        kilometrageActuel: parseInt(document.getElementById('v-kilometrageActuel').value)
    };

    const url = id ? `${API_BASE}/vehicules/${id}` : `${API_BASE}/vehicules`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            showToast(id ? 'Fiche véhicule mise à jour' : 'Nouveau véhicule enregistré avec succès', 'success');
            closeModal('modal-vehicule-form');
            fetchVehicules();
        } else {
            showToast(data.message || 'Erreur lors de l\'enregistrement', 'error');
        }
    } catch (err) {
        showToast('Erreur serveur', 'error');
    }
}

function openEditModal(id) {
    const v = state.vehicules.find(item => item.id === id);
    if (!v) return;

    document.getElementById('vehicule-id').value = v.id;
    document.getElementById('v-immatriculation').value = v.immatriculation;
    document.getElementById('v-numeroInventaire').value = v.numeroInventaire;
    document.getElementById('v-numeroChassis').value = v.numeroChassis;
    document.getElementById('v-marque').value = v.marque;
    document.getElementById('v-modele').value = v.modele;
    document.getElementById('v-typeCarburant').value = v.typeCarburant;
    document.getElementById('v-kilometrageInitial').value = v.kilometrageInitial;
    document.getElementById('v-kilometrageActuel').value = v.kilometrageActuel;

    document.getElementById('modal-vehicule-title').innerHTML = '<i class="fa-solid fa-pen"></i> Modifier la Fiche Véhicule';
    openModal('modal-vehicule-form');
}

function openStatusModal(id) {
    const v = state.vehicules.find(item => item.id === id);
    if (!v) return;

    document.getElementById('status-vehicule-id').value = v.id;
    document.getElementById('status-nouveau-admin').value = v.statutAdministratif;
    document.getElementById('status-nouveau-tech').value = v.etatTechnique;
    document.getElementById('status-motif').value = '';

    openModal('modal-status-change');
}

async function handleSaveStatusChange(e) {
    e.preventDefault();
    const id = document.getElementById('status-vehicule-id').value;

    const payload = {
        nouveauStatutAdministratif: document.getElementById('status-nouveau-admin').value,
        nouveauEtatTechnique: document.getElementById('status-nouveau-tech').value,
        motif: document.getElementById('status-motif').value
    };

    try {
        const res = await fetch(`${API_BASE}/vehicules/${id}/statut`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Changement de statut enregistré avec succès', 'success');
            closeModal('modal-status-change');
            fetchVehicules();
        } else {
            showToast(data.message || 'Erreur lors du changement de statut', 'error');
        }
    } catch (err) {
        showToast('Erreur serveur', 'error');
    }
}

async function openHistoryModal(id) {
    try {
        const res = await fetch(`${API_BASE}/vehicules/${id}/historique`, {
            headers: getAuthHeaders()
        });

        const data = await res.json();
        const container = document.getElementById('timeline-container');

        if (res.ok && data.data) {
            if (data.data.length === 0) {
                container.innerHTML = '<p class="empty-state">Aucun historique de transition pour ce véhicule.</p>';
            } else {
                container.innerHTML = data.data.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-meta">${new Date(item.dateChangement).toLocaleString('fr-FR')} — Par <strong>${escapeHTML(item.utilisateur)}</strong></div>
                        <div class="timeline-title">Statut: ${escapeHTML(item.nouveauStatutAdministratif)} | État: ${escapeHTML(item.nouveauEtatTechnique)}</div>
                        ${item.motif ? `<div class="timeline-desc" style="font-size: 12px; color: #64748B; margin-top: 4px;">Motif: ${escapeHTML(item.motif)}</div>` : ''}
                    </div>
                `).join('');
            }
            openModal('modal-history-timeline');
        } else {
            showToast('Impossible de charger l\'historique du véhicule', 'error');
        }
    } catch (err) {
        showToast('Erreur lors de la récupération de l\'historique', 'error');
    }
}

async function confirmArchive(id) {
    if (!confirm('Voulez-vous vraiment archiver ce véhicule ?')) return;

    try {
        const res = await fetch(`${API_BASE}/vehicules/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            showToast('Véhicule archivé dans la base', 'success');
            fetchVehicules();
        } else {
            showToast('Erreur lors de l\'archivage', 'error');
        }
    } catch (err) {
        showToast('Erreur serveur', 'error');
    }
}

/* =================================================================
   UTILITY HELPERS
   ================================================================= */
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
    };
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'circle-check' : type === 'error' ? 'circle-xmark' : 'circle-info';
    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> ${escapeHTML(message)}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
