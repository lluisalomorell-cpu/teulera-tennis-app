/* Teulera Tennis — servidor mínimo con persistencia real, sin dependencias externas.
   Usa solo módulos nativos de Node (http, fs, path) para que no dependa de ningún
   registro npm en el momento del build. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = fs.existsSync("/data") ? "/data" : __dirname;
const DB_FILE = path.join(DATA_DIR, "db.json");
const PORT = process.env.PORT || 3000;
const AREAS_VALID = ["tenis", "fisico", "nutricion", "psicologo"];

// Huella de esta versión desplegada: si index.html cambia en un redeploy, esta
// huella cambia, y las pestañas ya abiertas se recargan solas (ver /api/state
// y el polling del cliente) en vez de quedarse con código antiguo para siempre.
let APP_VERSION = "boot";
try{
  const html = fs.readFileSync(path.join(__dirname, "index.html"));
  APP_VERSION = crypto.createHash("sha1").update(html).digest("hex").slice(0,10);
}catch(e){ /* si falla, se queda "boot" y simplemente no se detectan cambios */ }

const DEFAULT_DB = {
  rev: 1,
  idSeq: 100,
  coaches: [
    { id:"c1",  name:"Angel",   role:"entrenador", area:"tenis",     director:true, username:"angel",   password:"hbrpoig8" },
    { id:"c2",  name:"Gabi",    role:"entrenador", area:"tenis",     username:"gabi",    password:"f1cbfno6" },
    { id:"c3",  name:"Carlos",  role:"entrenador", area:"tenis",     username:"carlos",  password:"b9m80o2r" },
    { id:"c4",  name:"Alfonso", role:"entrenador", area:"tenis",     username:"alfonso", password:"ak1vrjnv" },
    { id:"c5",  name:"Xavi",    role:"entrenador", area:"tenis",     username:"xavi",    password:"gfygwwqc", active:false },
    { id:"c6",  name:"Simone",  role:"entrenador", area:"tenis",     username:"simone",  password:"38hyf9sx" },
    { id:"c7",  name:"Lluis",   role:"entrenador", area:"fisico",    director:true, username:"Lluis", password:"Lluis1996" },
    { id:"c8",  name:"Pep",     role:"entrenador", area:"fisico",    username:"pep",     password:"mecosfog" },
    { id:"c9",  name:"Maria",   role:"entrenador", area:"nutricion", username:"maria",   password:"yr3xkxwn" },
    { id:"c10", name:"Lucia",   role:"entrenador", area:"psicologo", username:"lucia",   password:"rek8pk3y" },
  ],
  players: [
    { id:"p1",  name:"Pedro Vives",          categoria:"", username:"pedro.vives",    password:"r9oudocu", responsables:{ tenis:"c1",       fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:[] },
    { id:"p2",  name:"Didrik",               categoria:"", username:"didrik",         password:"zrenun5z", responsables:{ tenis:"c1",       fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:[] },
    { id:"p3",  name:"Henri",                categoria:"", username:"henri",          password:"3jqip98q", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p4",  name:"Salman",               categoria:"", username:"salman",         password:"1zxoi65f", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p5",  name:"Theo",                 categoria:"", username:"theo",           password:"dhjk1eyy", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p6",  name:"Sergi",                categoria:"", username:"sergi",          password:"37q9ah8r", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p7",  name:"Joan",                 categoria:"", username:"joan",           password:"vhs1k3aq", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p8",  name:"Luca",                 categoria:"", username:"luca",           password:"6l6gt6mj", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p9",  name:"Sase",                 categoria:"", username:"sase",           password:"xk87au5b", responsables:{ tenis:["c3","c1","c4"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p10", name:"Mireia",               categoria:"", username:"mireia",         password:"hxtpdpff", responsables:{ tenis:"c3",       fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p11", name:"Mia P",                categoria:"", username:"mia.p",          password:"5e8ii49k", responsables:{ tenis:["c3","c6"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p12", name:"Adriana C",            categoria:"", username:"adriana.c",      password:"q71n8mtz", responsables:{ tenis:["c3","c6"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p13", name:"Jimena",               categoria:"", username:"jimena",         password:"x272hpoe", responsables:{ tenis:["c3","c6"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p14", name:"Telmo",                categoria:"", username:"telmo",          password:"vb9ooaed", responsables:{ tenis:"c4",       fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p15", name:"Pedro S",              categoria:"", username:"pedro.s",        password:"oecve6pr", responsables:{ tenis:"c4",       fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p16", name:"Grupo tarde Rojo",     categoria:"Grupo", username:"grupo.rojo",     password:"5n8i4p40", responsables:{ tenis:["c2","c6"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p17", name:"Grupo tarde Amarillo", categoria:"Grupo", username:"grupo.amarillo", password:"mgg1w103", responsables:{ tenis:["c2","c6"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
    { id:"p18", name:"Grupo Next Gen",       categoria:"Grupo", username:"grupo.nextgen",  password:"dgdzvgpm", responsables:{ tenis:["c2","c6"], fisico:null, nutricion:"c9", psicologo:"c10" }, disabledAreas:["psicologo"] },
  ],
  posts: []
};

function loadDb(){
  try{
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if(!parsed.coaches || !parsed.players || !parsed.posts) throw new Error("db incompleta");
    return parsed;
  }catch(e){
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DB));
    saveDb(fresh);
    return fresh;
  }
}
function saveDb(dbObj){
  fs.writeFileSync(DB_FILE, JSON.stringify(dbObj));
}

let db = loadDb();

function newId(prefix){
  db.idSeq++;
  return prefix + db.idSeq;
}

function sendJson(res, status, obj){
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type":"application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function publicState(extra){
  return Object.assign({ coaches: db.coaches, players: db.players, posts: db.posts, rev: db.rev, appVersion: APP_VERSION }, extra || {});
}

function readJsonBody(req, maxBytes, cb){
  let chunks = [];
  let size = 0;
  let done = false;
  req.on("data", (chunk)=>{
    if(done) return;
    size += chunk.length;
    if(size > maxBytes){
      done = true;
      req.destroy();
      cb(new Error("payload_too_large"));
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", ()=>{
    if(done) return;
    try{
      const raw = Buffer.concat(chunks).toString("utf8");
      cb(null, raw ? JSON.parse(raw) : {});
    }catch(e){ cb(new Error("bad_json")); }
  });
  req.on("error", (e)=>{ if(!done){ done = true; cb(e); } });
}

const MIME = {
  ".html":"text/html; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".svg":"image/svg+xml",
  ".ico":"image/x-icon",
};

const server = http.createServer((req, res)=>{
  const url = (req.url || "/").split("?")[0];

  if(url === "/api/state" && req.method === "GET"){
    return sendJson(res, 200, publicState());
  }

  if(url === "/api/coaches" && req.method === "POST"){
    return readJsonBody(req, 1e6, (err, body)=>{
      if(err) return sendJson(res, err.message==="payload_too_large"?413:400, { error: err.message });
      const name = (body.name || "").toString().trim().slice(0,80);
      const area = (body.area || "tenis").toString();
      if(!name) return sendJson(res, 400, { error:"name_required" });
      const coach = { id:newId("c"), name, role:"entrenador", area };
      db.coaches.push(coach);
      db.rev++;
      saveDb(db);
      return sendJson(res, 200, publicState({ created: coach }));
    });
  }

  if(url === "/api/players" && req.method === "POST"){
    return readJsonBody(req, 1e6, (err, body)=>{
      if(err) return sendJson(res, err.message==="payload_too_large"?413:400, { error: err.message });
      const name = (body.name || "").toString().trim().slice(0,80);
      const categoria = (body.categoria || "").toString().slice(0,40);
      if(!name) return sendJson(res, 400, { error:"name_required" });
      const player = { id:newId("p"), name, categoria, responsables:{ tenis:null, fisico:null, nutricion:"c9", psicologo:"c10" } };
      db.players.push(player);
      db.rev++;
      saveDb(db);
      return sendJson(res, 200, publicState({ created: player }));
    });
  }

  if(url === "/api/coaches/set-active" && req.method === "POST"){
    return readJsonBody(req, 1e5, (err, body)=>{
      if(err) return sendJson(res, 400, { error: err.message });
      const id = (body.id || "").toString();
      const active = body.active !== false; // por defecto, reactivar
      const coach = db.coaches.find(c=>c.id === id);
      if(!coach) return sendJson(res, 404, { error:"not_found" });
      coach.active = active;
      db.rev++;
      saveDb(db);
      return sendJson(res, 200, publicState());
    });
  }

  if(url === "/api/players/set-disabled-areas" && req.method === "POST"){
    return readJsonBody(req, 1e5, (err, body)=>{
      if(err) return sendJson(res, 400, { error: err.message });
      const playerId = (body.playerId || "").toString();
      const player = db.players.find(p=>p.id === playerId);
      if(!player) return sendJson(res, 404, { error:"not_found" });
      let disabledAreas = body.disabledAreas;
      if(!Array.isArray(disabledAreas)) disabledAreas = [];
      disabledAreas = disabledAreas.map(String).filter(a=>AREAS_VALID.includes(a));
      player.disabledAreas = disabledAreas;
      db.rev++;
      saveDb(db);
      return sendJson(res, 200, publicState());
    });
  }

  if(url === "/api/players/set-responsable" && req.method === "POST"){
    return readJsonBody(req, 1e5, (err, body)=>{
      if(err) return sendJson(res, 400, { error: err.message });
      const playerId = (body.playerId || "").toString();
      const area = (body.area || "").toString();
      if(!AREAS_VALID.includes(area)) return sendJson(res, 400, { error:"bad_area" });
      const player = db.players.find(p=>p.id === playerId);
      if(!player) return sendJson(res, 404, { error:"not_found" });
      let responsables = body.responsables;
      // Normaliza: null, un id en string, o un array de ids.
      if(responsables != null && !Array.isArray(responsables)) responsables = [String(responsables)];
      if(Array.isArray(responsables)) responsables = responsables.map(String).filter(Boolean);
      player.responsables[area] = (!responsables || responsables.length===0) ? null : (responsables.length===1 ? responsables[0] : responsables);
      db.rev++;
      saveDb(db);
      return sendJson(res, 200, publicState());
    });
  }

  if(url === "/api/players/delete" && req.method === "POST"){
    return readJsonBody(req, 1e5, (err, body)=>{
      if(err) return sendJson(res, 400, { error: err.message });
      const id = (body.id || "").toString();
      const before = db.players.length;
      db.players = db.players.filter(p=>p.id !== id);
      if(db.players.length !== before){
        db.posts = db.posts.filter(m=>m.playerId !== id);
        db.rev++;
        saveDb(db);
      }
      return sendJson(res, 200, publicState());
    });
  }

  if(url === "/api/posts" && req.method === "POST"){
    return readJsonBody(req, 20e6, (err, body)=>{
      if(err) return sendJson(res, err.message==="payload_too_large"?413:400, { error: err.message });
      const playerId = (body.playerId || "").toString();
      const area = (body.area || "").toString();
      const authorId = (body.authorId || "").toString();
      const title = (body.title || "").toString().slice(0,200);
      const text = (body.text || "").toString().slice(0,6000);
      if(!playerId || !area || !authorId) return sendJson(res, 400, { error:"missing_fields" });
      let attachment = null;
      if(body.attachment && body.attachment.dataUrl){
        attachment = {
          name: String(body.attachment.name || "archivo.pdf").slice(0,150),
          dataUrl: String(body.attachment.dataUrl)
        };
      }
      const post = { id:newId("m"), playerId, area, authorId, date:new Date().toISOString(), title, text, attachment };
      db.posts.push(post);
      db.rev++;
      saveDb(db);
      return sendJson(res, 200, publicState({ created: post }));
    });
  }

  if(url === "/api/posts/delete" && req.method === "POST"){
    return readJsonBody(req, 1e5, (err, body)=>{
      if(err) return sendJson(res, 400, { error: err.message });
      const id = (body.id || "").toString();
      const before = db.posts.length;
      db.posts = db.posts.filter(m=>m.id !== id);
      if(db.posts.length !== before){ db.rev++; saveDb(db); }
      return sendJson(res, 200, publicState());
    });
  }

  // Static file serving (index.html and anything else next to it)
  if(req.method !== "GET"){
    res.writeHead(404); return res.end("Not found");
  }
  let rel = url === "/" ? "/index.html" : url;
  const filePath = path.normalize(path.join(__dirname, rel));
  if(!filePath.startsWith(__dirname)){
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data)=>{
    if(err){
      res.writeHead(404, { "Content-Type":"text/plain" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    });
    res.end(data);
  });
});

server.listen(PORT, ()=>{
  console.log(`Teulera Tennis server listening on port ${PORT} (data dir: ${DATA_DIR})`);
});
