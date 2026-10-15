// ===== PRODUCTS DATA =====
const allProducts = [
  { id:1,  name:'Paracetamol 500mg',   price:25,  img:'images/paracetamol.jpg',  cat:'pain',      badge:'Popular',  catLabel:'Pain Relief' },
  { id:2,  name:'Metformin 500mg',     price:45,  img:'images/med2.jpg',          cat:'diabetes',  badge:'',         catLabel:'Diabetes' },
  { id:3,  name:'Vitamin C Tablets',   price:80,  img:'images/med6.jpg',          cat:'vitamins',  badge:'New',      catLabel:'Vitamins' },
  { id:4,  name:'Amoxicillin 250mg',   price:120, img:'images/med3.jpg',          cat:'antibiotics',badge:'',        catLabel:'Antibiotic' },
  { id:5,  name:'Ibuprofen 400mg',     price:60,  img:'images/med2.jpg',          cat:'pain',      badge:'',         catLabel:'Pain Relief' },
  { id:6,  name:'Cetirizine 10mg',     price:35,  img:'images/med 5.webp',        cat:'allergy',   badge:'',         catLabel:'Allergy' },
  { id:7,  name:'ORS Powder',          price:20,  img:'images/ors.jpeg',          cat:'digestive', badge:'',         catLabel:'Digestive' },
  { id:8,  name:'Azithromycin 500mg',  price:150, img:'images/axi.jpg',           cat:'antibiotics',badge:'',        catLabel:'Antibiotic' },
  { id:9,  name:'Domperidone 10mg',    price:40,  img:'images/domperidone.jpg',   cat:'digestive', badge:'',         catLabel:'Digestive' },
  { id:10, name:'Insulin Injection',   price:150, img:'images/insulin injection.jpg', cat:'injection', badge:'Rx',   catLabel:'Injection' },
  { id:11, name:'Aspirin 300mg',       price:70,  img:'images/aspirine.jpg',      cat:'cardiac',   badge:'',         catLabel:'Cardiac' },
  { id:12, name:'Fluconazole 150mg',   price:50,  img:'images/fluca.jpg',         cat:'antibiotics',badge:'',        catLabel:'Antibiotic' },
  { id:13, name:'Clopidogrel 75mg',    price:100, img:'images/clopidogrel.jpg',   cat:'cardiac',   badge:'',         catLabel:'Cardiac' },
];

let cart = JSON.parse(localStorage.getItem('pharmora_cart')) || [];
let currentFilter = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  renderProducts(allProducts);
  updateCartCount();
  initSearch();
  initScrollEffects();
  initHeader();
});

// ===== LOADER =====
function initLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hidden');
    // Trigger hero animations after loader
    document.querySelectorAll('.hero-left, .hero-right').forEach(el => {
      el.style.animationPlayState = 'running';
    });
  }, 1400);
}

// ===== HEADER SCROLL =====
function initHeader() {
  const header = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ===== RENDER PRODUCTS =====
function renderProducts(products, highlightTerm = '') {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');

  if (!products.length) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  grid.innerHTML = products.map((p, i) => {
    const nameDisplay = highlightTerm
      ? p.name.replace(new RegExp(`(${highlightTerm})`, 'gi'), '<mark>$1</mark>')
      : p.name;

    return `
    <div class="prod-card" style="animation-delay:${i * 0.07}s">
      <div class="prod-img-wrap">
        ${p.badge ? `<div class="prod-badge">${p.badge}</div>` : ''}
        <img class="prod-img" src="${p.img}" alt="${p.name}" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23f0fdfa%22/%3E%3Ctext x=%2250%22 y=%2255%22 font-size=%2230%22 text-anchor=%22middle%22%3E💊%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="prod-body">
        <div class="prod-cat">${p.catLabel}</div>
        <div class="prod-name">${nameDisplay}</div>
        <div class="prod-price">₹${p.price}</div>
        <button class="add-btn" onclick="addToCart(${p.id}, '${p.name}', ${p.price}, '${p.img}')">
          <span>Add to Cart</span>
        </button>
      </div>
    </div>`;
  }).join('');
}

// ===== SEARCH =====
function initSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const dropdown = document.getElementById('searchDropdown');

  if (!input || !btn || !dropdown) return;

  // Live dropdown search
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }
    const results = allProducts.filter(p => p.name.toLowerCase().includes(q));
    if (!results.length) {
      dropdown.innerHTML = '<div class="dropdown-item"><div class="di-info"><strong>No results found</strong><small>Try another term</small></div></div>';
      dropdown.classList.add('open');
      return;
    }
    dropdown.innerHTML = results.slice(0, 5).map(p => `
      <div class="dropdown-item" onclick="selectFromDropdown('${p.name}')">
        <img class="di-img" src="${p.img}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22%3E%3Crect width=%2244%22 height=%2244%22 fill=%22%23f0fdfa%22/%3E%3Ctext x=%2222%22 y=%2228%22 font-size=%2220%22 text-anchor=%22middle%22%3E💊%3C/text%3E%3C/svg%3E'">
        <div class="di-info">
          <strong>${p.name}</strong>
          <small>${p.catLabel}</small>
        </div>
        <div class="di-price">₹${p.price}</div>
      </div>
    `).join('');
    dropdown.classList.add('open');
  });

  // Search button
  btn.addEventListener('click', () => performSearch(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch(input.value);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      dropdown.classList.remove('open');
    }
  });
}

function performSearch(query) {
  const q = query.trim().toLowerCase();
  const dropdown = document.getElementById('searchDropdown');
  dropdown.classList.remove('open');

  if (!q) {
    renderProducts(allProducts);
    document.getElementById('products-title').textContent = 'Popular Medicines';
    document.getElementById('clearFilter').style.display = 'none';
    currentFilter = null;
    scrollToProducts();
    return;
  }

  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.catLabel.toLowerCase().includes(q)
  );
  renderProducts(results, q);
  document.getElementById('products-title').textContent = `Search: "${query}"`;
  document.getElementById('clearFilter').style.display = 'flex';
  currentFilter = 'search';
  scrollToProducts();
}

function selectFromDropdown(name) {
  document.getElementById('searchInput').value = name;
  document.getElementById('searchDropdown').classList.remove('open');
  performSearch(name);
}

function quickSearch(term) {
  const input = document.getElementById('searchInput');
  input.value = term;
  performSearch(term);
}

// ===== FILTER BY CATEGORY =====
function filterByCategory(cat) {
  currentFilter = cat;
  const results = allProducts.filter(p => p.cat === cat);
  const catLabels = {
    pain:'Pain Relief', diabetes:'Diabetes', vitamins:'Vitamins',
    antibiotics:'Antibiotics', allergy:'Allergy', injection:'Injections',
    digestive:'Digestive', cardiac:'Cardiac'
  };
  renderProducts(results);
  document.getElementById('products-title').textContent = catLabels[cat] || cat;
  document.getElementById('clearFilter').style.display = 'flex';
  document.getElementById('searchInput').value = '';
  scrollToProducts();
}

function clearFilter() {
  currentFilter = null;
  renderProducts(allProducts);
  document.getElementById('products-title').textContent = 'Popular Medicines';
  document.getElementById('clearFilter').style.display = 'none';
  document.getElementById('searchInput').value = '';
}

function scrollToProducts() {
  setTimeout(() => {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ===== CART =====
function addToCart(id, name, price, img) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, img, qty: 1 });
  }
  localStorage.setItem('pharmora_cart', JSON.stringify(cart));
  updateCartCount(true);
  showToast(`${name} added to cart! 🛒`, 'success');
}

function updateCartCount(bump = false) {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const total = cart.reduce((s, i) => s + i.qty, 0);
  el.textContent = total;
  if (bump) {
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 400);
  }
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== SCROLL REVEAL =====
function initScrollEffects() {
  const revealEls = document.querySelectorAll('.cat-item, .prod-card, .sec-head');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });
}
function addToCart(name, price) {

    let cart = JSON.parse(localStorage.getItem("pharmora_cart")) || [];

    let existing = cart.find(item => item.name === name);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            qty: 1
        });
    }

    localStorage.setItem("pharmora_cart", JSON.stringify(cart));

    alert(name + " added to cart");
}