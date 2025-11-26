const express=require('express');const cors=require('cors');const path=require('path');
const app=express();const PORT=process.env.PORT||3000;

app.use(cors());app.use(express.json());app.use(express.static(path.join(__dirname,'../frontend')));

// Simple in-memory users database
const users=[{id:1,username:'admin',password:'admin123',name:'Administrator',role:'admin'},{id:2,username:'manager',password:'manager123',name:'Inventory Manager',role:'manager'},{id:3,username:'demo',password:'demo',name:'Demo User',role:'viewer'}];
let sessions={};

function generateToken(){return Math.random().toString(36).substr(2)+Date.now().toString(36);}
function getFutureDate(d){const t=new Date();t.setDate(t.getDate()+d);return t.toISOString().split('T')[0];}

// Auth endpoints
app.post('/api/auth/login',(req,res)=>{
  const{username,password}=req.body;
  const user=users.find(u=>u.username===username&&u.password===password);
  if(user){const token=generateToken();sessions[token]={userId:user.id,username:user.username,name:user.name,role:user.role};res.json({success:true,token,user:{name:user.name,username:user.username,role:user.role}});}
  else{res.status(401).json({success:false,message:'Invalid username or password'});}
});

app.post('/api/auth/logout',(req,res)=>{
  const token=req.headers.authorization?.replace('Bearer ','');
  if(token&&sessions[token]){delete sessions[token];}
  res.json({success:true});
});

app.get('/api/auth/me',(req,res)=>{
  const token=req.headers.authorization?.replace('Bearer ','');
  if(token&&sessions[token]){res.json({success:true,user:sessions[token]});}
  else{res.status(401).json({success:false,message:'Not authenticated'});}
});

app.post('/api/auth/register',(req,res)=>{
  const{username,password,name}=req.body;
  if(users.find(u=>u.username===username)){return res.status(400).json({success:false,message:'Username already exists'});}
  const newUser={id:users.length+1,username,password,name:name||username,role:'viewer'};
  users.push(newUser);
  const token=generateToken();sessions[token]={userId:newUser.id,username:newUser.username,name:newUser.name,role:newUser.role};
  res.json({success:true,token,user:{name:newUser.name,username:newUser.username,role:newUser.role}});
});

const expiryData=[{name:'Bulk Wheat Flour',batchId:'B-1001-A',quantity:500,unit:'kg',expiryDate:getFutureDate(8)},{name:'Active Dry Yeast',batchId:'B-1003-B',quantity:20,unit:'kg',expiryDate:getFutureDate(2)},{name:'Finished Biscuits',batchId:'F-0982',quantity:1500,unit:'units',expiryDate:getFutureDate(35)},{name:'Potato Starch',batchId:'P-045A',quantity:250,unit:'kg',expiryDate:getFutureDate(-2)},{name:'Vegetable Oil',batchId:'V-004C',quantity:120,unit:'liters',expiryDate:getFutureDate(20)}];
const inventoryData=[{name:'Wheat Flour',currentStock:75000,maxStock:100000,dailyConsumption:5000,unit:'kg'},{name:'Potato Starch',currentStock:12000,maxStock:50000,dailyConsumption:2000,unit:'kg'},{name:'Maize',currentStock:40000,maxStock:80000,dailyConsumption:3000,unit:'kg'},{name:'Vegetable Oil',currentStock:5000,maxStock:20000,dailyConsumption:1500,unit:'liters'}];
const batchData={wheat:[{batchId:'B-1001-A',productName:'Wheat Flour',supplierName:'Kanpur Wheat Co-op',status:'In Transit',totalRoute:450,coveredRoute:310,delayReason:'Weather Delay - Fog'}],potato:[{batchId:'P-045A',productName:'Potato',supplierName:'Agra Potato Growers',status:'In Transit',totalRoute:300,coveredRoute:280,delayReason:null}],maize:[{batchId:'M-023B',productName:'Maize',supplierName:'Bihar Maize Collective',status:'Packing',totalRoute:550,coveredRoute:0,delayReason:null}]};
const supplierData={wheat:[{name:'Kanpur Wheat Co-op',quantity:50000,maxQuantity:100000,price:22.5,deliveryTime:2},{name:'Punjab Golden Fields',quantity:120000,maxQuantity:250000,price:23.0,deliveryTime:5}],potato:[{name:'Agra Potato Growers',quantity:75000,maxQuantity:100000,price:15.0,deliveryTime:2}],maize:[{name:'Bihar Maize Collective',quantity:150000,maxQuantity:200000,price:21.0,deliveryTime:4}]};

app.get('/api/expiry',(req,res)=>res.json(expiryData));
app.get('/api/inventory',(req,res)=>res.json(inventoryData));
app.get('/api/batches',(req,res)=>{const m=req.query.material||'wheat';res.json(batchData[m]||[]);});
app.get('/api/suppliers',(req,res)=>{const m=req.query.material||'wheat';res.json(supplierData[m]||[]);});
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'../frontend/index.html')));

app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));
