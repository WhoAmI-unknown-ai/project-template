const API_URL='http://localhost:3000/api';

document.addEventListener('DOMContentLoaded',()=>{
  const navLinks=document.querySelectorAll('.nav-link');
  const contentArea=document.getElementById('contentArea');
  const loginBtn=document.getElementById('loginBtn');
  const loginModal=document.getElementById('loginModal');
  const modalClose=document.getElementById('modalClose');
  const loginForm=document.getElementById('loginForm');
  const themeToggle=document.getElementById('themeToggle');
  const menuToggle=document.getElementById('menuToggle');
  const sidebar=document.getElementById('sidebar');

  navLinks.forEach(link=>{
    link.addEventListener('click',e=>{
      e.preventDefault();
      navLinks.forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
      const page=link.id.replace('nav-','');
      loadPage(page);
    });
  });

  loginBtn?.addEventListener('click',()=>loginModal.classList.add('active'));
  modalClose?.addEventListener('click',()=>loginModal.classList.remove('active'));
  document.querySelector('.modal-overlay')?.addEventListener('click',()=>loginModal.classList.remove('active'));
  loginForm?.addEventListener('submit',e=>{e.preventDefault();loginModal.classList.remove('active');showToast('Login successful!','success');});
  themeToggle?.addEventListener('click',()=>{document.body.dataset.theme=document.body.dataset.theme==='dark'?'':'dark';});
  menuToggle?.addEventListener('click',()=>sidebar.classList.toggle('open'));

  loadPage('dashboard');
});

async function loadPage(page){
  const content=document.getElementById('contentArea');
  const title=document.getElementById('pageTitle');
  title.textContent=page.charAt(0).toUpperCase()+page.slice(1).replace('-',' ');
  
  switch(page){
    case 'dashboard':content.innerHTML=await renderDashboard();break;
    case 'expiry':content.innerHTML=await renderExpiry();break;
    case 'inventory':content.innerHTML=await renderInventory();break;
    case 'batches':content.innerHTML=await renderBatches();break;
    case 'suppliers':content.innerHTML=await renderSuppliers();break;
    case 'weather':content.innerHTML=await renderWeather();break;
    default:content.innerHTML='<p>Page not found</p>';
  }
  attachEventListeners();
}

async function renderDashboard(){
  const data=await fetchData('/expiry');
  const inv=await fetchData('/inventory');
  const expiring=data.filter(i=>daysUntil(i.expiryDate)<=7&&daysUntil(i.expiryDate)>0).length;
  const expired=data.filter(i=>daysUntil(i.expiryDate)<=0).length;
  const lowStock=inv.filter(i=>(i.currentStock/i.maxStock)<0.25).length;
  document.getElementById('expiry-badge').textContent=expiring+expired;
  return `<div class="stats-grid">
    <div class="stat-card"><div class="stat-icon primary"><i class="fas fa-boxes"></i></div><h3>${inv.length}</h3><p>Total Items</p></div>
    <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-clock"></i></div><h3>${expiring}</h3><p>Expiring Soon</p></div>
    <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-exclamation-triangle"></i></div><h3>${expired}</h3><p>Expired</p></div>
    <div class="stat-card"><div class="stat-icon info"><i class="fas fa-arrow-down"></i></div><h3>${lowStock}</h3><p>Low Stock</p></div>
  </div>
  <div class="card"><div class="card-header"><h2>Recent Alerts</h2></div><div class="card-body">${data.slice(0,5).map(i=>renderExpiryCard(i)).join('')}</div></div>`;
}

async function renderExpiry(){
  const data=await fetchData('/expiry');
  data.sort((a,b)=>daysUntil(a.expiryDate)-daysUntil(b.expiryDate));
  return `<div class="card"><div class="card-header"><h2>Expiry Tracker</h2></div><div class="card-body">${data.map(i=>renderExpiryCard(i)).join('')}</div></div>`;
}

function renderExpiryCard(item){
  const days=daysUntil(item.expiryDate);
  const cls=days<=0?'expired':days<=7?'expiring':'';
  const status=days<=0?`Expired ${Math.abs(days)} days ago`:days<=7?`${days} days left`:`${days} days left`;
  return `<div class="inventory-card alert-card ${cls}"><h3>${item.name}</h3><div class="details"><span class="detail-item"><strong>Batch:</strong> ${item.batchId}</span><span class="detail-item"><strong>Qty:</strong> ${item.quantity} ${item.unit}</span><span class="detail-item"><strong>Expiry:</strong> ${item.expiryDate}</span></div><span class="status-tag ${days<=0?'expired':'expiring'}">${status}</span></div>`;
}

async function renderInventory(){
  const data=await fetchData('/inventory');
  return `<div class="card"><div class="card-header"><h2>Raw Materials</h2></div><div class="card-body">${data.map(i=>{
    const pct=(i.currentStock/i.maxStock)*100;
    const days=(i.currentStock/i.dailyConsumption).toFixed(1);
    const color=pct<25?'red':pct<50?'yellow':'green';
    return `<div class="inventory-card" data-name="${i.name}"><h3>${i.name}</h3><div class="details"><span class="detail-item"><strong>Stock:</strong> ${i.currentStock.toLocaleString()} / ${i.maxStock.toLocaleString()} ${i.unit}</span><span class="detail-item"><strong>Daily Use:</strong> ${i.dailyConsumption.toLocaleString()} ${i.unit}</span></div><div class="progress-bar"><div class="fill ${color}" style="width:${pct}%"></div></div><p class="progress-text">~${days} days of stock remaining</p></div>`;
  }).join('')}</div></div>`;
}

async function renderBatches(){
  return `<div class="sub-nav"><button class="active" data-material="wheat">Wheat</button><button data-material="potato">Potato</button><button data-material="maize">Maize</button></div><div id="batchList"></div>`;
}

async function renderSuppliers(){
  return `<div class="sub-nav"><button class="active" data-material="wheat">Wheat</button><button data-material="potato">Potato</button><button data-material="maize">Maize</button></div><div id="supplierList"></div>`;
}

async function renderWeather(){
  return `<div class="weather-card"><h2><i class="fas fa-cloud-sun"></i> Weather Forecast</h2><p class="temp">24°C</p><p class="condition">Partly Cloudy - Good for deliveries</p></div><div class="card"><div class="card-header"><h2>Weather-Based Recommendations</h2></div><div class="card-body"><p>No adverse weather conditions expected. Normal delivery schedules recommended.</p></div></div>`;
}

async function loadBatches(material){
  const data=await fetchData(`/batches?material=${material}`);
  document.getElementById('batchList').innerHTML=data.map(b=>{
    const pct=(b.coveredRoute/b.totalRoute)*100;
    return `<div class="inventory-card"><h3>${b.productName} (${b.batchId})</h3><div class="details"><span class="detail-item"><strong>Supplier:</strong> ${b.supplierName}</span><span class="status-tag ${b.status.toLowerCase().replace(' ','-')}">${b.status}</span></div><div class="progress-bar"><div class="fill green" style="width:${pct}%"></div></div><p class="progress-text">${b.coveredRoute}km / ${b.totalRoute}km</p>${b.delayReason?`<p class="delay-tag">${b.delayReason}</p>`:''}</div>`;
  }).join('')||'<p>No batches found</p>';
}

async function loadSuppliers(material){
  const data=await fetchData(`/suppliers?material=${material}`);
  document.getElementById('supplierList').innerHTML=data.map(s=>{
    const pct=(s.quantity/s.maxQuantity)*100;
    return `<div class="supplier-card"><h3>${s.name}</h3><div class="info-grid"><div class="info-item"><label>Available</label><span>${s.quantity.toLocaleString()} kg</span></div><div class="info-item"><label>Price</label><span>₹${s.price}/kg</span></div><div class="info-item"><label>Delivery</label><span>${s.deliveryTime} days</span></div></div><div class="progress-bar"><div class="fill green" style="width:${pct}%"></div></div><button class="btn btn-outline" style="margin-top:15px">Order Inquiry</button></div>`;
  }).join('')||'<p>No suppliers found</p>';
}

function attachEventListeners(){
  document.querySelectorAll('.sub-nav button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.sub-nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const m=btn.dataset.material;
      if(document.getElementById('batchList'))loadBatches(m);
      if(document.getElementById('supplierList'))loadSuppliers(m);
    });
  });
  const activeBtn=document.querySelector('.sub-nav button.active');
  if(activeBtn){
    const m=activeBtn.dataset.material;
    if(document.getElementById('batchList'))loadBatches(m);
    if(document.getElementById('supplierList'))loadSuppliers(m);
  }
}

async function fetchData(endpoint){
  try{const res=await fetch(API_URL+endpoint);return await res.json();}
  catch(e){console.error(e);return getMockData(endpoint);}
}

function getMockData(endpoint){
  const mock={
    '/expiry':[{name:'Wheat Flour',batchId:'B-1001',quantity:500,unit:'kg',expiryDate:getFutureDate(5)},{name:'Yeast',batchId:'B-1002',quantity:20,unit:'kg',expiryDate:getFutureDate(2)},{name:'Potato Starch',batchId:'P-045',quantity:250,unit:'kg',expiryDate:getFutureDate(-2)}],
    '/inventory':[{name:'Wheat Flour',currentStock:75000,maxStock:100000,dailyConsumption:5000,unit:'kg'},{name:'Potato Starch',currentStock:12000,maxStock:50000,dailyConsumption:2000,unit:'kg'},{name:'Vegetable Oil',currentStock:5000,maxStock:20000,dailyConsumption:1500,unit:'liters'}],
    '/batches':[{batchId:'B-1001',productName:'Wheat Flour',supplierName:'Punjab Farms',status:'In Transit',totalRoute:450,coveredRoute:310,delayReason:'Weather Delay'}],
    '/suppliers':[{name:'Punjab Farms',quantity:50000,maxQuantity:100000,price:22.5,deliveryTime:2},{name:'AgriGrain',quantity:80000,maxQuantity:80000,price:21.75,deliveryTime:3}]
  };
  return mock[endpoint.split('?')[0]]||[];
}

function daysUntil(date){const t=new Date();const e=new Date(date);t.setHours(0,0,0,0);e.setHours(0,0,0,0);return Math.ceil((e-t)/(1000*60*60*24));}
function getFutureDate(d){const t=new Date();t.setDate(t.getDate()+d);return t.toISOString().split('T')[0];}
function showToast(msg,type='info'){const c=document.getElementById('toastContainer');const t=document.createElement('div');t.className='toast';t.innerHTML=`<i class="fas fa-${type==='success'?'check-circle':'info-circle'}"></i><span>${msg}</span>`;c.appendChild(t);setTimeout(()=>t.remove(),3000);}
