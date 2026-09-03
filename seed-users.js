// Generate SHA-256 hashes for demo passwords. Run in browser console or Node 18+:
// node seed-users.js
const crypto=require('crypto'); for(const p of ['admin123','bgh123','dhspkt123','dhsp123','dhkt123','dhbk123','dhcntt123']) console.log(p,crypto.createHash('sha256').update(p).digest('hex'));
