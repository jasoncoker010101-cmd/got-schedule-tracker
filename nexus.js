(() => {
"use strict";
const db=window.GOT_SUPABASE;
if(!db)return;
const $=id=>document.getElementById(id);
const authPanel=$("authPanel"),hub=$("hub"),authForm=$("authForm"),authMessage=$("authMessage");
const roomList=$("roomList"),messages=$("messages"),composer=$("composer"),input=$("messageInput");
const reportBackdrop=$("reportBackdrop"),reportForm=$("reportForm");
let user=null,profile=null,rooms=[],activeRoom=null,channel=null,moderator=false,reportMessageId=null,authMode="login",loading=false;
let messageCache=[];
const safeText=value=>String(value??"");
function setStatus(el,text,type=""){el.textContent=text;el.className="message"+(type?" "+type:"");}
function timeLabel(value){const d=new Date(value);return d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});}
function nearBottom(){return messages.scrollHeight-messages.scrollTop-messages.clientHeight<100;}
function setLive(ok,label){$("liveDot").classList.toggle("offline",!ok);$("liveText").textContent=label;}
function setAuthMode(mode){
 authMode=mode;const signup=mode==="signup";
 $("loginTab").classList.toggle("active",!signup);$("signupTab").classList.toggle("active",signup);
 $("usernameWrap").hidden=!signup;$("username").required=signup;
 $("authTitle").textContent=signup?"Create your G.O.T account":"Join the conversation";
 $("authSubmit").textContent=signup?"Create account":"Log in";
 $("password").autocomplete=signup?"new-password":"current-password";
 setStatus(authMessage,"");
}
$("loginTab").addEventListener("click",()=>setAuthMode("login"));
$("signupTab").addEventListener("click",()=>setAuthMode("signup"));
authForm.addEventListener("submit",async e=>{
 e.preventDefault();const submit=$("authSubmit");submit.disabled=true;
 try{
  const email=$("email").value.trim(),password=$("password").value;
  if(authMode==="signup"){
   const username=$("username").value.trim();
   if(!/^[A-Za-z0-9_]{3,20}$/.test(username))throw new Error("Username must be 3–20 characters using letters, numbers, or underscores.");
   if(password.length<8)throw new Error("Password must be at least 8 characters.");
   const {data,error}=await db.auth.signUp({email,password,options:{data:{username}}});
   if(error)throw error;
   if(data.session){user=data.user;await enterHub();}
   else setStatus(authMessage,"Account created. Check your email for the confirmation link, then log in.","success");
  }else{
   const {data,error}=await db.auth.signInWithPassword({email,password});
   if(error)throw error;user=data.user;await enterHub();
  }
 }catch(err){let msg=err.message||"Something went wrong.";if(/duplicate key|unique constraint/i.test(msg))msg="That username is already taken.";if(/invalid login credentials/i.test(msg))msg="Email or password is incorrect.";if(/email not confirmed/i.test(msg))msg="Please confirm your email address before logging in.";setStatus(authMessage,msg,"error");}
 finally{submit.disabled=false;}
});
async function loadProfile(){
 const {data,error}=await db.from("profiles").select("username,avatar_url").eq("id",user.id).maybeSingle();
 if(error)console.warn("Nexus profile lookup:",error.message);
 profile=data||{username:user.user_metadata?.username||user.email?.split("@")[0]||"Member",avatar_url:null};
}
async function enterHub(){
 authPanel.hidden=true;hub.hidden=false;
 await loadProfile();
 const {data:roles,error:roleError}=await db.from("user_roles").select("role").eq("user_id",user.id);
 if(!roleError)moderator=(roles||[]).some(r=>["owner","administrator","moderator","developer"].includes(r.role));
 await loadRooms();
 if(!db.auth.getSession) return;
}
async function loadRooms(){
 const {data,error}=await db.from("got_chat_rooms").select("id,name,description,icon,sort_order,is_readonly").order("sort_order");
 if(error){messages.textContent="Couldn't load chat rooms. Please refresh and try again.";console.error(error);return;}
 rooms=data||[];renderRooms();
 if(!activeRoom||!rooms.some(r=>r.id===activeRoom.id))activeRoom=rooms[0]||null;
 if(activeRoom)await openRoom(activeRoom.id);
}
function renderRooms(){
 roomList.replaceChildren();
 for(const room of rooms){
  const b=document.createElement("button");b.type="button";b.className="room-button"+(activeRoom?.id===room.id?" active":"");
  const icon=document.createElement("span");icon.className="room-icon";icon.textContent=room.icon||"💬";
  const wrap=document.createElement("span");const name=document.createElement("span");name.className="room-name";name.textContent=room.name;
  const desc=document.createElement("span");desc.className="room-desc";desc.textContent=room.description;
  wrap.append(name,desc);const arrow=document.createElement("span");arrow.className="room-arrow";arrow.textContent="›";b.append(icon,wrap,arrow);
  b.addEventListener("click",()=>openRoom(room.id));roomList.append(b);
 }
}
async function openRoom(id){
 const next=rooms.find(r=>r.id===id);if(!next)return;
 if(channel){await db.removeChannel(channel);channel=null;}
 activeRoom=next;renderRooms();
 $("roomIcon").textContent=next.icon||"💬";$("roomName").textContent=next.name;$("roomDescription").textContent=next.description;
 const readonly=next.is_readonly&&!moderator;
 composer.hidden=readonly;$("readonlyNote").hidden=!readonly;
 $("composerHint").textContent=next.is_readonly?"Official updates from the moderation team.":"Messages are public in this room.";
 messages.replaceChildren();const loadingNode=document.createElement("div");loadingNode.className="empty-state";loadingNode.textContent="Loading messages…";messages.append(loadingNode);
 await fetchMessages(true);
 channel=db.channel("nexus-room-"+next.id)
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"got_chat_messages",filter:"room_id=eq."+next.id},payload=>handleRealtime(payload.new))
  .on("postgres_changes",{event:"UPDATE",schema:"public",table:"got_chat_messages",filter:"room_id=eq."+next.id},()=>fetchMessages(false))
  .subscribe(status=>{const ok=status==="SUBSCRIBED";setLive(ok,ok?"Live":"Reconnecting");});
}
async function fetchMessages(initial){
 if(!activeRoom)return;const wasBottom=nearBottom();const previousScrollTop=messages.scrollTop;
 const {data,error}=await db.from("got_chat_messages").select("id,room_id,author_id,body,created_at,deleted_at,deleted_by").eq("room_id",activeRoom.id).is("deleted_at",null).order("created_at",{ascending:false}).limit(80);
 if(error){console.error("Nexus messages:",error);messages.textContent="Messages couldn't load. Please refresh the room.";return;}
 const rows=(data||[]).reverse();messageCache=rows;
 const ids=[...new Set(rows.map(m=>m.author_id))];let profileMap={};
 if(ids.length){const {data:people,error:peopleError}=await db.from("profiles").select("id,username,avatar_url").in("id",ids);if(!peopleError)(people||[]).forEach(p=>profileMap[p.id]=p);}
 renderMessages(rows,profileMap);
 if(initial||wasBottom)messages.scrollTop=messages.scrollHeight;
 else messages.scrollTop=previousScrollTop;
}
function handleRealtime(row){
 if(!activeRoom||row.room_id!==activeRoom.id)return;
 const wasBottom=nearBottom();
 if(messageCache.some(m=>m.id===row.id))return;
 fetchMessages(false).then(()=>{if(wasBottom)messages.scrollTop=messages.scrollHeight;});
}
function renderMessages(rows,profileMap){
 messages.replaceChildren();
 if(!rows.length){const empty=document.createElement("div");empty.className="empty-state";const big=document.createElement("div");big.className="big";big.textContent="✦";const title=document.createElement("strong");title.textContent="The room is quiet.";const copy=document.createElement("span");copy.textContent="Start a friendly conversation.";empty.append(big,title,copy);messages.append(empty);return;}
 rows.forEach(m=>{
  const p=profileMap[m.author_id]||{};const card=document.createElement("article");card.className="chat-message";
  const avatar=document.createElement("div");avatar.className="avatar";
  if(p.avatar_url&&/^https:\/\//i.test(p.avatar_url)){const img=document.createElement("img");img.src=p.avatar_url;img.alt="";img.loading="lazy";img.referrerPolicy="no-referrer";avatar.append(img);}else avatar.textContent=(p.username||"G").slice(0,1).toUpperCase();
  const main=document.createElement("div");main.className="message-main";const meta=document.createElement("div");meta.className="message-meta";
  const author=document.createElement("span");author.className="message-author";author.textContent=p.username||"G.O.T Member";
  if(m.author_id===user.id){const you=document.createElement("span");you.className="message-time";you.textContent="you";meta.append(author,you);}else meta.append(author);
  const time=document.createElement("time");time.className="message-time";time.dateTime=m.created_at;time.textContent=timeLabel(m.created_at);meta.append(time);
  const body=document.createElement("p");body.className="message-body";body.textContent=m.body;
  main.append(meta,body);
  const actions=document.createElement("div");actions.className="message-actions";
  if(m.author_id!==user.id){const report=document.createElement("button");report.type="button";report.className="text-action";report.textContent="Report";report.addEventListener("click",()=>openReport(m.id));actions.append(report);}
  const canDelete=moderator||(m.author_id===user.id&&(Date.now()-new Date(m.created_at).getTime())<5*60*1000);
  if(canDelete){const del=document.createElement("button");del.type="button";del.className="text-action";del.textContent="Remove";del.addEventListener("click",()=>removeMessage(m));actions.append(del);}
  if(actions.childNodes.length)main.append(actions);
  card.append(avatar,main);messages.append(card);
 });
}
async function removeMessage(m){
 if(!confirm("Remove this message from the room?"))return;
 const {error}=await db.from("got_chat_messages").update({deleted_at:new Date().toISOString(),deleted_by:user.id}).eq("id",m.id);
 if(error){alert(error.message);return;}await fetchMessages(false);
}
composer.addEventListener("submit",async e=>{
 e.preventDefault();if(!activeRoom||activeRoom.is_readonly&&!moderator)return;
 const body=input.value.trim();if(!body)return;
 const send=$("sendButton");send.disabled=true;
 const {error}=await db.from("got_chat_messages").insert({room_id:activeRoom.id,author_id:user.id,body});
 send.disabled=false;
 if(error){$("composerHint").textContent=error.message||"Message couldn't be sent.";return;}
 input.value="";$("charCount").textContent="0 / 800";$("composerHint").textContent="Message sent.";
 await fetchMessages(false);messages.scrollTop=messages.scrollHeight;input.focus();
});
input.addEventListener("input",()=>{$("charCount").textContent=input.value.length+" / 800";});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();composer.requestSubmit();}});
function openReport(id){reportMessageId=id;$("reportMessage").textContent="";$("reportDetails").value="";reportBackdrop.hidden=false;}
$("cancelReport").addEventListener("click",()=>{reportBackdrop.hidden=true;reportMessageId=null;});
reportBackdrop.addEventListener("click",e=>{if(e.target===reportBackdrop){reportBackdrop.hidden=true;reportMessageId=null;}});
reportForm.addEventListener("submit",async e=>{
 e.preventDefault();if(!reportMessageId)return;const submit=$("submitReport");submit.disabled=true;
 const {error}=await db.from("got_chat_reports").insert({message_id:reportMessageId,reporter_id:user.id,reason:$("reportReason").value,details:$("reportDetails").value.trim()});
 submit.disabled=false;
 if(error){setStatus($("reportMessage"),/duplicate key|unique/i.test(error.message)?"You've already reported this message.":error.message,"error");return;}
 setStatus($("reportMessage"),"Report sent to the moderation team.","success");setTimeout(()=>{reportBackdrop.hidden=true;reportMessageId=null;},900);
});
db.auth.getSession().then(async({data,error})=>{
 if(error){setStatus(authMessage,"Couldn't check your sign-in. Refresh and try again.","error");return;}
 user=data.session?.user||null;if(user)await enterHub();
});
db.auth.onAuthStateChange((_event,session)=>{setTimeout(async()=>{const next=session?.user||null;if(next?.id===user?.id)return;user=next;if(user)await enterHub();else{if(channel)await db.removeChannel(channel);channel=null;hub.hidden=true;authPanel.hidden=false;profile=null;activeRoom=null;}},0);});
})();