118
  const API_URL='http://localhost:3000/api';
let currentUser=null;let authToken=localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded',async()=>{
  const navLinks=document.querySelectorAll('.nav-link');
  const loginBtn=document.getElementById('loginBtn');
  const loginModal=document.getElementById('loginModal');
  const modalClose=document.getElementById('modalClose');
  const loginForm=document.getElementById('loginForm');
  const themeToggle=document.getElementById('themeToggle');
  const menuToggle=document.getElementById('menuToggle');
  const sidebar=document.getElementById('sidebar');

  // Check if user is logged in
  if(authToken){await checkAuth();}
  updateUI();

  navLinks.forEach(link=>{
    link.addEventListener('click',e=>{
      e.preventDefault();
      navLinks.forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
      loadPage(link.id.replace('nav-',''));
    });
  });

  loginBtn?.addEventListener('click',()=>{
    if(currentUser){logout();}else{loginModal.classList.add('active');}
  });
  modalClose?.addEventListener('click',()=>loginModal.classList.remove('active'));
  document.querySelector('.modal-overlay')?.addEventListener('click',()=>loginModal.classList.remove('active'));
  
  loginForm?.addEventListener('submit',async e=>{
    e.preventDefault();
    const username=document.getElementById('username').value;
    const password=document.getElementById('password').value;
    await login(username,password);
  });

  themeToggle?.addEventListener('click',()=>{document.body.dataset.theme=document.body.dataset.theme==='dark'?'':'dark';});
  menuToggle?.addEventListener('click',()=>sidebar.classList.toggle('open'));

  loadPage('dashboard');
});

async function login(username,password){
  try{
    const res=await fetch(API_URL+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const data=await res.json();
    if(data.success){
      authToken=data.token;localStorage.setItem('authToken',authToken);currentUser=data.user;
      document.getElementById('loginModal').classList.remove('active');
      document.getElementById('loginForm').reset();
      updateUI();showToast(`Welcome back, ${currentUser.name}!`,'success');
    }else{showToast(data.message||'Login failed','error');}
  }catch(e){showToast('Login failed. Server may be offline.','error');}
}

async function logout(){
  try{await fetch(API_URL+'/auth/logout',{method:'POST',headers:{'Authorization':'Bearer '+authToken}});}catch(e){}
  authToken=null;currentUser=null;localStorage.removeItem('authToken');
  updateUI();showToast('Logged out successfully','success');
}

async function checkAuth(){
  try{
    const res=await fetch(API_URL+'/auth/me',{headers:{'Authorization':'Bearer '+authToken}});
    const data=await res.json();
    if(data.success){currentUser=data.user;}else{authToken=null;localStorage.removeItem('authToken');}
  }catch(e){authToken=null;localStorage.removeItem('authToken');}
}

function updateUI(){
  const loginBtn=document.getElementById('loginBtn');
  if(currentUser){
    loginBtn.innerHTML=`<i class="fas fa-sign-out-alt"></i><span>Logout</span>`;
    loginBtn.title=`Logged in as ${currentUser.name}`;
  }else{
    loginBtn.innerHTML=`<i class="fas fa-sign-in-alt"></i><span>Login</span>`;
    loginBtn.title='Click to login';
  }
}

async function loadPage(page){
  const content=document.getElementById('contentArea');
  document.getElementById('pageTitle').textContent=page.charAt(0).toUpperCase()+page.slice(1);
  switch(page){
    case 'dashboard':content.innerHTML=await renderDashboard();break;
    case 'expiry':content.innerHTML=await renderExpiry();break;
    case 'inventory':content.innerHTML=await renderInventory();break;
    case 'batches':content.innerHTML=await renderBatches();break;
    case 'suppliers':content.innerHTML=await renderSuppliers();break;
    case 'weather':content.innerHTML=await renderWeather();break;
       case 'orders':content.innerHTML=await renderOrders();break;
    default:content.innerHTML='<p>Page not found</p>';
  }
  attachEventListeners();
}

async function renderDashboard(){
  const data=await fetchData('/expiry');const inv=await fetchData('/inventory');
  const expiring=data.filter(i=>daysUntil(i.expiryDate)<=7&&daysUntil(i.expiryDate)>0).length;
  const expired=data.filter(i=>daysUntil(i.expiryDate)<=0).length;
  document.getElementById('expiry-badge').textContent=expiring+expired;
  const userInfo=currentUser?`<div class="stat-card"><div class="stat-icon primary"><i class="fas fa-user"></i></div><h3>${currentUser.name}</h3><p>Role: ${currentUser.role}</p></div>`:'';
  return `<div class="stats-grid">${userInfo}<div class="stat-card"><div class="stat-icon primary"><i class="fas fa-boxes"></i></div><h3>${inv.length}</h3><p>Total Items</p></div><div class="stat-card"><div class="stat-icon warning"><i class="fas fa-clock"></i></div><h3>${expiring}</h3><p>Expiring Soon</p></div><div class="stat-card"><div class="stat-icon danger"><i class="fas fa-exclamation-triangle"></i></div><h3>${expired}</h3><p>Expired</p></div></div><div class="card"><div class="card-header"><h2>Recent Alerts</h2></div><div class="card-body">${data.slice(0,5).map(i=>renderExpiryCard(i)).join('')}</div></div>`;
}

async function renderExpiry(){const data=await fetchData('/expiry');data.sort((a,b)=>daysUntil(a.expiryDate)-daysUntil(b.expiryDate));return `<div class="card"><div class="card-header"><h2>Expiry Tracker</h2></div><div class="card-body">${data.map(i=>renderExpiryCard(i)).join('')}</div></div>`;}

function renderExpiryCard(item){const days=daysUntil(item.expiryDate);const cls=days<=0?'expired':days<=7?'expiring':'';const status=days<=0?`Expired ${Math.abs(days)} days ago`:`${days} days left`;return `<div class="inventory-card alert-card ${cls}"><h3>${item.name}</h3><div class="details"><span class="detail-item"><strong>Batch:</strong> ${item.batchId}</span><span class="detail-item"><strong>Qty:</strong> ${item.quantity} ${item.unit}</span></div><span class="status-tag ${cls}">${status}</span></div>`;}

async function renderInventory(){const data=await fetchData('/inventory');return `<div class="card"><div class="card-header"><h2>Raw Materials</h2></div><div class="card-body">${data.map(i=>{const pct=(i.currentStock/i.maxStock)*100;const days=(i.currentStock/i.dailyConsumption).toFixed(1);const color=pct<25?'red':pct<50?'yellow':'green';return `<div class="inventory-card"><h3>${i.name}</h3><div class="details"><span class="detail-item"><strong>Stock:</strong> ${i.currentStock.toLocaleString()}/${i.maxStock.toLocaleString()} ${i.unit}</span></div><div class="progress-bar"><div class="fill ${color}" style="width:${pct}%"></div></div><p class="progress-text">~${days} days remaining</p></div>`;}).join('')}</div></div>`;}

async function renderBatches(){return `<div class="sub-nav"><button class="active" data-material="wheat">Wheat</button><button data-material="potato">Potato</button><button data-material="maize">Maize</button></div><div id="batchList"></div>`;}
async function renderSuppliers(){return `<div class="sub-nav"><button class="active" data-material="wheat">Wheat</button><button data-material="potato">Potato</button><button data-material="maize">Maize</button></div><div id="supplierList"></div>`;}
async function renderWeather(){return `<div class="weather-card"><h2><i class="fas fa-cloud-sun"></i> Weather</h2><p class="temp">24°C</p><p>Good for deliveries</p></div>`;}
async function renderOrders(){const data=await fetchData('/orders');const buildItemCard=(o)=>`<div class="inventory-card"><h3>${o.productName}</h3><div class="details"><span class="detail-item"><strong>Order ID:</strong> ${o.orderId}</span><span class="detail-item"><strong>Qty:</strong> ${o.quantity} ${o.unit}</span><span class="detail-item"><strong>Status:</strong> ${o.status}</span><span class="detail-item"><strong>Expected:</strong> ${o.expectedDeliveryDate}</span></div><span class="status-tag ${o.status.toLowerCase()}">${o.status}</span></div>`;const buildSubcategory=(sub)=>`<div class="subcategory-block"><h3>${sub.name}</h3>${sub.note?`<p class="subcategory-note">${sub.note}</p>`:''}${sub.items&&sub.items.length?sub.items.map(buildItemCard).join(''):'<p>No orders in this subcategory.</p>'}</div>`;const buildGroup=(groupKey)=>{const group=data[groupKey];if(!group)return '';return `<div class="card"><div class="card-header"><h2>${group.category}</h2></div><div class="card-body">${group.subcategories.map(buildSubcategory).join('')}</div></div>`};return `<div class="card"><div class="card-header"><h2>Smart Orders</h2><p class="card-subtitle">Organized by product families and end uses</p></div><div class="card-body orders-groups">${['bakedGoods','pastaProducts','otherWheat','maize','potato'].map(buildGroup).join('')}</div></div>`}

async function loadBatches(m){const data=await fetchData(`/batches?material=${m}`);document.getElementById('batchList').innerHTML=data.map(b=>`<div class="inventory-card"><h3>${b.productName} (${b.batchId})</h3><div class="details"><span>${b.supplierName}</span><span class="status-tag">${b.status}</span></div><div class="progress-bar"><div class="fill green" style="width:${(b.coveredRoute/b.totalRoute)*100}%"></div></div>${b.delayReason?`<p class="delay-tag">${b.delayReason}</p>`:''}</div>`).join('')||'<p>No batches</p>';}
async function loadSuppliers(m){const data=await fetchData(`/suppliers?material=${m}`);document.getElementById('supplierList').innerHTML=data.map(s=>`<div class="supplier-card"><h3>${s.name}</h3><div class="info-grid"><div class="info-item"><label>Available</label><span>${s.quantity.toLocaleString()} kg</span></div><div class="info-item"><label>Price</label><span>₹${s.price}/kg</span></div></div><button class="btn btn-outline">Order</button></div>`).join('')||'<p>No suppliers</p>';}

function attachEventListeners(){document.querySelectorAll('.sub-nav button').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.sub-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const m=btn.dataset.material;if(document.getElementById('batchList'))loadBatches(m);if(document.getElementById('supplierList'))loadSuppliers(m);});});const ab=document.querySelector('.sub-nav button.active');if(ab){const m=ab.dataset.material;if(document.getElementById('batchList'))loadBatches(m);if(document.getElementById('supplierList'))loadSuppliers(m);}}

async function fetchData(endpoint){try{const res=await fetch(API_URL+endpoint);return await res.json();}catch(e){return getMockData(endpoint);}}
function getMockData(ep){const m={'/expiry':[{name:'Wheat',batchId:'B-1001',quantity:500,unit:'kg',expiryDate:getFutureDate(5)}],'/inventory':[{name:'Wheat',currentStock:75000,maxStock:100000,dailyConsumption:5000,unit:'kg'}],'/batches':[],'/suppliers':[],'/orders':{bakedGoods:{category:'Baked Goods',subcategories:[{name:'Breads',note:'(white, whole wheat, rye, pumpernickel, flatbreads like chapati, roti, naan)',items:[{productName:'Whole wheat bread',orderId:'BG-BR-001',quantity:800,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(4)},{productName:'Naan bread',orderId:'BG-BR-002',quantity:500,unit:'kg',status:'Confirmed',expectedDeliveryDate:getFutureDate(6)}]},{name:'Fine Bakery Goods',note:'(cakes, cookies, crackers, biscuits, waffles, pastries, doughnuts)',items:[{productName:'Cookies',orderId:'BG-FB-001',quantity:300,unit:'kg',status:'Shipped',expectedDeliveryDate:getFutureDate(2)}]}]},pastaProducts:{category:'Pasta Products',subcategories:[{name:'Pasta',note:'(macaroni, spaghetti, lasagna)',items:[{productName:'Macaroni',orderId:'PP-PA-001',quantity:600,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(5)}]},{name:'Noodles',items:[{productName:'Instant noodles',orderId:'PP-ND-001',quantity:400,unit:'kg',status:'Confirmed',expectedDeliveryDate:getFutureDate(3)}]},{name:'Breakfast Cereals',items:[{productName:'Corn flakes',orderId:'PP-BC-001',quantity:350,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(7)}]}]},otherWheat:{category:'Other Products & Ingredients',subcategories:[{name:'Semolina',note:'(coarsely ground durum wheat used for pasta)',items:[{productName:'Semolina',orderId:'OW-SM-001',quantity:450,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(6)}]},{name:'Maltodextrin and glucose syrups',note:'(used as food additives)',items:[{productName:'Maltodextrin',orderId:'OW-MD-001',quantity:200,unit:'kg',status:'Confirmed',expectedDeliveryDate:getFutureDate(5)}]},{name:'Vital wheat gluten',note:'(used for its structural properties and fortification)',items:[{productName:'Vital wheat gluten',orderId:'OW-VG-001',quantity:150,unit:'kg',status:'Shipped',expectedDeliveryDate:getFutureDate(2)}]},{name:'Wheat germ oil',note:'(used in cosmetics and food products)',items:[{productName:'Wheat germ oil',orderId:'OW-WO-001',quantity:80,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(9)}]}]},maize:{category:'Maize (Corn) End Products',subcategories:[{name:'Flour & Meal',note:'Cornmeal, corn grits, maize flour',items:[{productName:'Maize flour',orderId:'MZ-FM-001',quantity:700,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(5)}]},{name:'Snack & Breakfast Foods',note:'Popcorn, corn flakes, corn chips, extruded snacks',items:[{productName:'Popcorn kernels',orderId:'MZ-SN-001',quantity:300,unit:'kg',status:'Confirmed',expectedDeliveryDate:getFutureDate(4)}]},{name:'Ingredients & Sweeteners',note:'Corn starch, corn oil, corn syrup, HFCS',items:[{productName:'Corn starch',orderId:'MZ-IN-001',quantity:500,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(8)}]},{name:'Beverages',note:'Industrial alcohol and distilled spirits',items:[{productName:'Corn-based industrial alcohol',orderId:'MZ-BV-001',quantity:1000,unit:'L',status:'Pending',expectedDeliveryDate:getFutureDate(12)}]}]},potato:{category:'Potato End Products',subcategories:[{name:'Snack & Fast Foods',note:'Potato chips, wafers, french fries, specialty frozen products',items:[{productName:'Frozen french fries',orderId:'PT-SN-001',quantity:900,unit:'kg',status:'Shipped',expectedDeliveryDate:getFutureDate(3)}]},{name:'Dehydrated Products',note:'Potato flakes, granules, powder, flour',items:[{productName:'Potato flakes',orderId:'PT-DH-001',quantity:400,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(10)}]},{name:'Ingredients & Beverages',note:'Potato starch, vodka, potato-based wines',items:[{productName:'Potato starch',orderId:'PT-IN-001',quantity:350,unit:'kg',status:'Confirmed',expectedDeliveryDate:getFutureDate(6)}]}]}}{orderId:'ORD-001',productName:'Wheat',quantity:1000,unit:'kg',status:'Pending',expectedDeliveryDate:getFutureDate(7)},{orderId:'ORD-002',productName:'Maize',quantity:500,unit:'kg',status:'Confirmed',expectedDeliveryDate:getFutureDate(5)},{orderId:'ORD-003',productName:'Potato',quantity:750,unit:'kg',status:'Shipped',expectedDeliveryDate:getFutureDate(3)}]};return m[ep.split('?')[0]]||[];}
function daysUntil(d){const t=new Date(),e=new Date(d);t.setHours(0,0,0,0);e.setHours(0,0,0,0);return Math.ceil((e-t)/(1000*60*60*24));}
function getFutureDate(d){const t=new Date();t.setDate(t.getDate()+d);return t.toISOString().split('T')[0];}
function showToast(msg,type='info'){const c=document.getElementById('toastContainer'),t=document.createElement('div');t.className='toast';t.innerHTML=`<i class="fas fa-${type==='success'?'check-circle':type==='error'?'times-circle':'info-circle'}"></i><span>${msg}</span>`;c.appendChild(t);setTimeout(()=>t.remove(),3000);}
