import { ARMY_ROSTER_SCHEMA_VERSION, assertRoster, createArmyRoster } from "../state/army-roster-library.js";
const TABLE = "v2_army_rosters";
const LIST_FIELDS = "id,name,schema_version,created_at,updated_at";
const FULL_FIELDS = LIST_FIELDS + ",roster";
const required = (v, label) => { const s = String(v ?? "").trim(); if (!s) throw new TypeError(label + " is required."); return s; };
const checkError = (e) => { if (e) throw new Error("Supabase army roster persistence failed: " + (e.message || String(e))); };
function normalize(roster, id) {
 assertRoster(roster);
 const copy = JSON.parse(JSON.stringify(roster));
 copy.id = required(id, "Roster id");
 copy.schemaVersion = ARMY_ROSTER_SCHEMA_VERSION;
 return createArmyRoster(copy);
}
export function createSupabaseArmyRosterStore(client, { table = TABLE } = {}) {
 if (!client?.auth || typeof client.auth.getUser !== "function" || typeof client.from !== "function") throw new TypeError("A Supabase client with auth and database access is required.");
 const tableName = required(table, "Table name");
 async function ownerId() {
  const {data,error}=await client.auth.getUser(); checkError(error);
  if (!data?.user?.id) throw new Error("Sign in to the single-owner app account before saving army rosters.");
  return data.user.id;
 }
 return Object.freeze({
  async save({id=null,roster}={}) {
   const userId=await ownerId(), rosterId=required(id ?? roster?.id,"Roster id"), value=normalize(roster,rosterId);
   const payload={id:rosterId,user_id:userId,name:required(value.name,"Roster name"),schema_version:ARMY_ROSTER_SCHEMA_VERSION,roster:value};
   const query=id
    ? client.from(tableName).update(payload).eq("id",rosterId).eq("user_id",userId)
    : client.from(tableName).insert(payload);
   const {data,error}=await query.select(LIST_FIELDS).single(); checkError(error);
   if (!data?.id) throw new Error("Supabase did not return the saved roster record.");
   return data;
  },
  async list({limit=100}={}) {
   const userId=await ownerId(), safeLimit=Math.max(1,Math.min(200,Math.floor(Number(limit)||100)));
   const {data,error}=await client.from(tableName).select(LIST_FIELDS).eq("user_id",userId).order("updated_at",{ascending:false}).limit(safeLimit);
   checkError(error); return Array.isArray(data)?data:[];
  },
  async load(id) {
   const userId=await ownerId();
   const {data,error}=await client.from(tableName).select(FULL_FIELDS).eq("id",required(id,"Roster id")).eq("user_id",userId).single();
   checkError(error);
   if (!data?.roster || typeof data.roster!=="object") throw new Error("The saved army roster has no usable roster payload.");
   if (data.schema_version!==data.roster.schemaVersion) throw new Error("The saved army roster's version metadata does not match its payload.");
   if (data.schema_version!==ARMY_ROSTER_SCHEMA_VERSION) throw new Error("This roster uses schema version "+data.schema_version+"; this app supports version "+ARMY_ROSTER_SCHEMA_VERSION+". A migration is required before loading it.");
   const value=normalize(data.roster,data.id);
   if(value.name!==data.name) throw new Error("The saved army roster name does not match its record metadata.");
   return {...data,roster:JSON.parse(JSON.stringify(value))};
  },
  async remove(id) {
   const userId=await ownerId();
   const {error}=await client.from(tableName).delete().eq("id",required(id,"Roster id")).eq("user_id",userId);
   checkError(error); return true;
  }
 });
}
