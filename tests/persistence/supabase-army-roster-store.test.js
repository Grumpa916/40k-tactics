import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseArmyRosterStore } from "../../src/persistence/supabase-army-roster-store.js";
function mockClient({userId="owner",rows=[]}={}) {
 return {auth:{async getUser(){return {data:{user:userId?{id:userId}:null},error:null};}},from(table){
  assert.equal(table,"v2_army_rosters"); let op="select",payload,filters=[],fields="",single=false,sort=null,limit=null;
  const q={select(v){fields=v;return q;},insert(v){op="insert";payload=v;return q;},update(v){op="update";payload=v;return q;},delete(){op="delete";return q;},eq(k,v){filters.push([k,v]);return q;},order(k,v){sort=[k,v];return q;},limit(v){limit=v;return q;},single(){single=true;return Promise.resolve(run());},then(a,b){return Promise.resolve(run()).then(a,b);}};
  function pick(row){return Object.fromEntries(fields.split(",").map(k=>[k,row[k]]));}
  function run(){const match=r=>filters.every(([k,v])=>r[k]===v);
   if(op==="insert"){rows.push({...payload,created_at:"now",updated_at:"now"});return {data:pick(rows.at(-1)),error:null};}
   if(op==="update"){const r=rows.find(match);if(!r)return {data:null,error:{message:"missing"}};Object.assign(r,payload,{updated_at:"later"});return {data:pick(r),error:null};}
   if(op==="delete"){const i=rows.findIndex(match);if(i>=0)rows.splice(i,1);return {data:null,error:null};}
   let found=rows.filter(match);if(sort)found.sort((a,b)=>String(b[sort[0]]).localeCompare(String(a[sort[0]])));if(limit)found=found.slice(0,limit);
   return {data:single?(found[0]?pick(found[0]):null):found.map(pick),error:null};
  } return q;
 }};
}
const roster=()=>({schemaVersion:1,id:"00000000-0000-4000-8000-000000000001",name:"Tyranids Practice",faction:"Tyranids",pointsLimit:2000,battleSize:null,detachment:null,units:[{id:"u1",name:"Exocrine",datasheetId:"exocrine"}],notes:"",createdAt:null,updatedAt:null});
test("requires authenticated owner",async()=>{await assert.rejects(()=>createSupabaseArmyRosterStore(mockClient({userId:null})).list(),/Sign in/);});
test("creates a stable-id roster",async()=>{const value=roster(),saved=await createSupabaseArmyRosterStore(mockClient()).save({roster:value});assert.equal(saved.id,value.id);assert.equal(saved.name,value.name);});
test("lists and loads versioned owner-scoped records",async()=>{const value=roster(),client=mockClient({rows:[{id:value.id,user_id:"owner",name:value.name,schema_version:1,roster:value,created_at:"now",updated_at:"now"}]}),store=createSupabaseArmyRosterStore(client);assert.equal((await store.list()).length,1);assert.equal((await store.load(value.id)).roster.units[0].name,"Exocrine");});
test("updates and deletes the selected roster",async()=>{const value=roster(),client=mockClient({rows:[{id:value.id,user_id:"owner",name:value.name,schema_version:1,roster:value,created_at:"now",updated_at:"now"}]}),store=createSupabaseArmyRosterStore(client);await store.save({id:value.id,roster:{...value,name:"Tournament Tyranids"}});assert.equal((await store.load(value.id)).roster.name,"Tournament Tyranids");await store.remove(value.id);assert.equal((await store.list()).length,0);});
test("rejects version metadata mismatch",async()=>{const value={...roster(),schemaVersion:2},client=mockClient({rows:[{id:value.id,user_id:"owner",name:value.name,schema_version:1,roster:value,created_at:"now",updated_at:"now"}]});await assert.rejects(()=>createSupabaseArmyRosterStore(client).load(value.id),/version metadata/);});
