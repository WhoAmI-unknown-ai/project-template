const express=require('express');const cors=require('cors');const path=require('path');
const app=express();const PORT=process.env.PORT||3000;

app.use(cors());app.use(express.json());app.use(express.static(path.join(__dirname,'../frontend')));

function getFutureDate(d){const t=new Date();t.setDate(t.getDate()+d);return t.toISOString().split('T')[0];}

const expiryData=[{name:'Bulk Wheat Flour',batchId:'B-1001-A',quantity:500,unit:'kg',expiryDate:getFutureDate(8)},{name:'Active Dry Yeast',batchId:'B-1003-B',quantity:20,unit:'kg',expiryDate:getFutureDate(2)},{name:'Finished Biscuits',batchId:'F-0982',quantity:1500,unit:'units',expiryDate:getFutureDate(35)},{name:'Potato Starch',batchId:'P-045A',quantity:250,unit:'kg',expiryDate:getFutureDate(-2)},{name:'Vegetable Oil',batchId:'V-004C',quantity:120,unit:'liters',expiryDate:getFutureDate(20)},{name:'Maize Flour',batchId:'M-023B',quantity:400,unit:'kg',expiryDate:getFutureDate(14)}];

const inventoryData=[{name:'Wheat Flour',currentStock:75000,maxStock:100000,dailyConsumption:5000,unit:'kg'},{name:'Potato Starch',currentStock:12000,maxStock:50000,dailyConsumption:2000,unit:'kg'},{name:'Maize',currentStock:40000,maxStock:80000,dailyConsumption:3000,unit:'kg'},{name:'Refined Sugar',currentStock:30000,maxStock:30000,dailyConsumption:2500,unit:'kg'},{name:'Vegetable Oil',currentStock:5000,maxStock:20000,dailyConsumption:1500,unit:'liters'}];

const batchData={wheat:[{batchId:'B-1001-A',productName:'Wheat Flour',supplierName:'Kanpur Wheat Co-op',status:'In Transit',totalRoute:450,coveredRoute:310,delayReason:'Weather Delay - Fog'},{batchId:'B-1008-C',productName:'Wheat Flour',supplierName:'Punjab Golden Fields',status:'Loading',totalRoute:820,coveredRoute:0,delayReason:'Equipment Malfunction'}],potato:[{batchId:'P-045A',productName:'Potato',supplierName:'Agra Potato Growers',status:'In Transit',totalRoute:300,coveredRoute:280,delayReason:null},{batchId:'P-046B',productName:'Potato',supplierName:'Indore Farm Fresh',status:'In Transit',totalRoute:710,coveredRoute:150,delayReason:'Traffic Jam'}],maize:[{batchId:'M-023B',productName:'Maize',supplierName:'Bihar Maize Collective',status:'Packing',totalRoute:550,coveredRoute:0,delayReason:null}]};

const supplierData={wheat:[{name:'Kanpur Wheat Co-op',quantity:50000,maxQuantity:100000,price:22.5,deliveryTime:2},{name:'AgriGrain India',quantity:80000,maxQuantity:80000,price:21.75,deliveryTime:3},{name:'Punjab Golden Fields',quantity:120000,maxQuantity:250000,price:23.0,deliveryTime:5}],potato:[{name:'Agra Potato Growers',quantity:75000,maxQuantity:100000,price:15.0,deliveryTime:2},{name:'Indore Farm Fresh',quantity:50000,maxQuantity:50000,price:14.5,deliveryTime:3}],maize:[{name:'Bihar Maize Collective',quantity:150000,maxQuantity:200000,price:21.0,deliveryTime:4},{name:'Karnataka Corn Co.',quantity:300000,maxQuantity:300000,price:20.5,deliveryTime:6}]};

app.get('/api/expiry',(req,res)=>res.json(expiryData));
app.get('/api/inventory',(req,res)=>res.json(inventoryData));
app.get('/api/batches',(req,res)=>{const m=req.query.material||'wheat';res.json(batchData[m]||[]);});
app.get('/api/suppliers',(req,res)=>{const m=req.query.material||'wheat';res.json(supplierData[m]||[]);});
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'../frontend/index.html')));

app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));
