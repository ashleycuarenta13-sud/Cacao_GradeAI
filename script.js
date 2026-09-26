document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Navigation ---
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }

    // --- Modal Management ---
    const openModal = (overlayId) => {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.add('active');
    };

    const closeModal = (overlay) => {
        if (overlay) overlay.classList.remove('active');
    };

    // Global close buttons (data-close attribute)
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const overlayId = btn.getAttribute('data-close');
            closeModal(document.getElementById(overlayId));
        });
    });

    // Close modal when clicking outside content area
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Modal Trigger Buttons
    const loginBtn = document.getElementById('loginBtn');
    const analyzeHeroBtn = document.getElementById('analyzeHeroBtn');
    const analyzeCtaBtn = document.getElementById('analyzeCtaBtn');
    const developersBtn = document.getElementById('developersBtn');
    const developersFooterBtn = document.getElementById('developersFooterBtn');

    if (loginBtn) loginBtn.addEventListener('click', () => openModal('authOverlay'));
    if (analyzeHeroBtn) analyzeHeroBtn.addEventListener('click', () => openModal('analysisOverlay'));
    if (analyzeCtaBtn) analyzeCtaBtn.addEventListener('click', () => openModal('analysisOverlay'));
    if (developersBtn) developersBtn.addEventListener('click', () => openModal('developersOverlay'));
    if (developersFooterBtn) developersFooterBtn.addEventListener('click', () => openModal('developersOverlay'));

    // --- Auth Form Tabs (Login / Register) ---
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');

    const showLogin = () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    };

    const showRegister = () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    };

    if (loginTab) loginTab.addEventListener('click', showLogin);
    if (registerTab) registerTab.addEventListener('click', showRegister);
    if (toRegister) toRegister.addEventListener('click', showRegister);
    if (toLogin) toLogin.addEventListener('click', showLogin);

    // Toggle Password Visibility
    document.querySelectorAll('.eye').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                } else {
                    targetInput.type = 'password';
                }
            }
        });
    });

    // --- Analysis Upload & Simulation ---
    const chooseImage = document.getElementById('chooseImage');
    const cacaoFile = document.getElementById('cacaoFile');
    const previewImage = document.getElementById('previewImage');
    const runAnalysis = document.getElementById('runAnalysis');
    const loading = document.getElementById('loading');
    const resultCard = document.getElementById('resultCard');
    const resultImg = document.getElementById('resultImg');

    if (chooseImage && cacaoFile) {
        chooseImage.addEventListener('click', () => cacaoFile.click());

        cacaoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImage.src = event.target.result;
                    previewImage.classList.remove('hidden');
                    if (resultImg) resultImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (runAnalysis) {
        runAnalysis.addEventListener('click', () => {
            loading.classList.remove('hidden');
            resultCard.classList.add('hidden');

            setTimeout(() => {
                loading.classList.add('hidden');
                resultCard.classList.remove('hidden');
            }, 1500);
        });
    }
});