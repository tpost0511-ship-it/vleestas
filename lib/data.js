import { DAILY_CHALLENGE_BONUS, amsterdamDateKey, pointBalance, rouletteGrossPayout, validRouletteBets } from './game.js';

const createClient = (...args) => window.supabase.createClient(...args);

const settings = window.PUNTJACHT_CONFIG || {};
const supabaseUrl = String(settings.supabaseUrl || '').trim();
const supabaseAnonKey = String(settings.supabaseAnonKey || '').trim();
export const isDemo = !supabaseUrl || !supabaseAnonKey;
export const supabase = isDemo ? null : createClient(supabaseUrl, supabaseAnonKey, {
  auth: {persistSession: true, detectSessionInUrl: true, autoRefreshToken: true}
});

const DB_KEY = 'puntjacht-demo-v1';
const demoUser = {id:'me', display_name:'Jij', email:'demo@puntjacht.app'};
const now = () => new Date().toISOString();
const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const assertNoError = ({data,error}) => {if (error) throw new Error(error.message); return data;};

function seedDemo() {
  const offset = (n) => new Date(Date.now() - n * 86400000).toISOString();
  return {
    groups:[{id:'demo-g',name:'Weekend Warriors',invite_code:'WEEKEND8',created_by:'me',created_at:offset(8)}],
    members:[
      {group_id:'demo-g',user_id:'me',display_name:'Jij',joined_at:offset(8)},
      {group_id:'demo-g',user_id:'noor',display_name:'Noor',joined_at:offset(7)},
      {group_id:'demo-g',user_id:'sam',display_name:'Sam',joined_at:offset(7)},
      {group_id:'demo-g',user_id:'lisa',display_name:'Lisa',joined_at:offset(5)}
    ],
    challenges:[
      {id:'ch1',group_id:'demo-g',title:'Neem een duik in koud water',description:'Spring in de zee, een meer of een buitenbad. Bonus respect als het regent.',category:'avontuur',points:150,created_by:'noor',created_at:offset(5)},
      {id:'ch2',group_id:'demo-g',title:'Loop 10 kilometer',description:'Een lekkere ronde hardlopen. Tijd maakt niet uit!',category:'sport',points:200,created_by:'me',created_at:offset(4)},
      {id:'ch3',group_id:'demo-g',title:'Kook een driegangendiner',description:'Organiseer een diner voor minimaal twee vrienden.',category:'sociaal',points:120,created_by:'lisa',created_at:offset(3)},
      {id:'ch4',group_id:'demo-g',title:'Doe karaoke in het openbaar',description:'Zing minimaal één heel nummer, bewijs met een foto of video.',category:'grappig',points:250,created_by:'sam',created_at:offset(2)},
      {id:'ch5',group_id:'demo-g',title:'Een dag zonder social media',description:'24 uur lang niet scrollen.',category:'overig',points:75,created_by:'noor',created_at:offset(1)},
      {id:'ch6',group_id:'demo-g',title:'Fiets 50 kilometer',description:'Leg 50 km af op één dag.',category:'sport',points:300,created_by:'me',created_at:offset(0)}
    ],
    participations:[
      {id:'p1',challenge_id:'ch1',user_id:'noor',status:'approved',proof_text:'Duik bij zonsondergang!',proof_path:null,created_at:offset(4)},
      {id:'p2',challenge_id:'ch2',user_id:'sam',status:'approved',proof_text:'10 km gelopen.',proof_path:null,created_at:offset(2)},
      {id:'p3',challenge_id:'ch3',user_id:'lisa',status:'approved',proof_text:'Risotto, pasta en tiramisu.',proof_path:null,created_at:offset(1)},
      {id:'p4',challenge_id:'ch1',user_id:'sam',status:'approved',proof_text:'IJskoud!',proof_path:null,created_at:offset(1)},
      {id:'p5',challenge_id:'ch5',user_id:'me',status:'approved',proof_text:'Telefoon in een kast!',proof_path:null,created_at:offset(1)},
      {id:'p6',challenge_id:'ch2',user_id:'me',status:'accepted',proof_text:null,proof_path:null,created_at:offset(1)},
      {id:'p7',challenge_id:'ch4',user_id:'noor',status:'pending',proof_text:'Ik heb echt gezongen! Video volgt.',proof_path:null,created_at:offset(0)}
    ],
    shopItems:[
      {id:'shop1',group_id:'demo-g',title:'Koffie op mij',description:'Ik trakteer je op een koffie naar keuze.',price:50,stock:3,created_by:'noor',created_at:offset(1)},
      {id:'shop2',group_id:'demo-g',title:'Playlist op maat',description:'Een persoonlijke playlist voor jouw volgende roadtrip.',price:75,stock:2,created_by:'lisa',created_at:offset(0)},
      {id:'shop3',group_id:'demo-g',title:'Zelfgebakken brownies',description:'Een doosje brownies, vers uit de oven.',price:150,stock:1,created_by:'sam',created_at:offset(0)}
    ],
    shopPurchases:[],
    challengeFunds:[],
    challengeAwards:[],
    dailyBonuses:[],
    rouletteSpins:[],
    groupStartingPoints:['me','noor','sam','lisa'].map(user_id=>({group_id:'demo-g',user_id,points:100}))
  };
}
function loadDemo() {
  try {
    const value = localStorage.getItem(DB_KEY);
    if (value) {
      const saved = JSON.parse(value);
      const seed = seedDemo();
      const members=saved.members || seed.members;
      const groupStartingPoints=Array.isArray(saved.groupStartingPoints)
        ? saved.groupStartingPoints
        : members.map(member=>({group_id:member.group_id,user_id:member.user_id,points:100}));
      return {...seed,...saved,members,groupStartingPoints,shopItems:saved.shopItems || seed.shopItems,shopPurchases:saved.shopPurchases || [],challengeFunds:saved.challengeFunds || [],challengeAwards:saved.challengeAwards || [],dailyBonuses:saved.dailyBonuses || [],rouletteSpins:saved.rouletteSpins || []};
    }
  } catch { /* On private browsing without storage, use in-memory data. */ }
  return seedDemo();
}
let demoData = loadDemo();
function saveDemo() {
  try {localStorage.setItem(DB_KEY,JSON.stringify(demoData));} catch { /* Browser may restrict storage. */ }
}
function ensureDemoStartingPoints(groupId,userId) {
  if (!demoData.groupStartingPoints.some(points=>points.group_id===groupId && points.user_id===userId)) {
    demoData.groupStartingPoints.push({group_id:groupId,user_id:userId,points:100});
  }
}
saveDemo();

export async function currentSession() {
  if (isDemo) return {user:demoUser};
  const {data,error} = await supabase.auth.getSession();
  if (error) throw error;
  return {user:data.session?.user || null};
}
export function watchAuth(onChange) {
  if (isDemo) return () => {};
  const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => onChange(session?.user || null));
  return () => subscription.unsubscribe();
}
export async function logIn(email,password) {
  return assertNoError(await supabase.auth.signInWithPassword({email,password}));
}
export async function signUp(name,email,password) {
  return assertNoError(await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim()},emailRedirectTo:window.location.origin}}));
}
export async function logOut() {if (!isDemo) assertNoError(await supabase.auth.signOut());}
export async function getProfile(user) {
  if (isDemo) return demoUser;
  const {data,error} = await supabase.from('profiles').select('id,display_name').eq('id',user.id).maybeSingle();
  if (error) throw error;
  return {id:user.id,email:user.email || '',display_name:data?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Speler'};
}

export async function listGroups(userId) {
  if (isDemo) return demoData.groups.filter(g => demoData.members.some(m => m.group_id === g.id && m.user_id === userId));
  const rows = assertNoError(await supabase.from('group_members').select('group_id,groups(id,name,invite_code,created_by,created_at)').eq('user_id',userId));
  return rows.map(r => r.groups).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name,'nl'));
}
export async function createGroup(name) {
  if (isDemo) {
    const id=makeId(),code=Math.random().toString(36).substring(2,10).toUpperCase();
    demoData.groups.push({id,name:name.trim(),invite_code:code,created_by:'me',created_at:now()});
    demoData.members.push({group_id:id,user_id:'me',display_name:'Jij',joined_at:now()});
    ensureDemoStartingPoints(id,'me');
    saveDemo();return id;
  }
  return assertNoError(await supabase.rpc('create_group',{p_name:name.trim()}));
}
export async function joinGroup(code) {
  if (isDemo) {
    const group=demoData.groups.find(g=>g.invite_code===code.trim().toUpperCase());
    if (!group) throw new Error('Deze code bestaat niet in de demo. Deel echte groepscodes via de online versie.');
    if (!demoData.members.some(m=>m.group_id===group.id && m.user_id==='me')) demoData.members.push({group_id:group.id,user_id:'me',display_name:'Jij',joined_at:now()});
    ensureDemoStartingPoints(group.id,'me');
    saveDemo();return group.id;
  }
  return assertNoError(await supabase.rpc('join_group_by_code',{p_code:code.trim().toUpperCase()}));
}
export async function loadGroup(groupId) {
  if (isDemo) {
    const list=demoData.challenges.filter(c=>c.group_id===groupId).sort((a,b)=>b.created_at.localeCompare(a.created_at));
    const challengeFunds=demoData.challengeFunds.filter(fund=>fund.group_id===groupId);
    const dailyBonuses=demoData.dailyBonuses.filter(bonus=>bonus.group_id===groupId);
    const fundingByChallenge=new Map(challengeFunds.map(fund=>[fund.challenge_id,fund]));
    return {
      members:demoData.members.filter(m=>m.group_id===groupId).map(m=>({id:m.user_id,display_name:m.display_name,joined_at:m.joined_at})),
      challenges:list.map(challenge=>{
        const bounty=fundingByChallenge.get(challenge.id);
        return {...challenge,bounty:bounty ? {...bounty,available_slots:bounty.slots_total-bounty.slots_paid-bounty.slots_reserved-bounty.refunded_slots} : null};
      }),
      participations:demoData.participations.filter(p=>list.some(c=>c.id===p.challenge_id)),
      shopItems:demoData.shopItems.filter(item=>item.group_id===groupId).sort((a,b)=>b.created_at.localeCompare(a.created_at)),
      shopPurchases:demoData.shopPurchases.filter(purchase=>purchase.group_id===groupId).sort((a,b)=>b.created_at.localeCompare(a.created_at)),
      challengeFunds,
      challengeAwards:demoData.challengeAwards.filter(award=>award.group_id===groupId),
      dailyBonuses,
      rouletteSpins:demoData.rouletteSpins.filter(spin=>spin.group_id===groupId),
      groupStartingPoints:demoData.groupStartingPoints.filter(points=>points.group_id===groupId)
    };
  }
  const [memberRows, challenges, shopItems, shopPurchases, challengeFunds, challengeAwards, dailyChallengeBonuses, rouletteSpins, groupStartingPoints] = await Promise.all([
    supabase.from('group_members').select('user_id,joined_at').eq('group_id',groupId),
    supabase.from('challenges').select('id,group_id,title,description,category,points,reward_slots,created_by,created_at,cancelled_at').eq('group_id',groupId).order('created_at',{ascending:false}),
    supabase.from('shop_items').select('id,group_id,title,description,price,stock,created_by,created_at').eq('group_id',groupId).order('created_at',{ascending:false}),
    supabase.from('shop_purchases').select('id,group_id,item_id,buyer_id,seller_id,price,created_at').eq('group_id',groupId).order('created_at',{ascending:false}),
    supabase.from('challenge_funds').select('challenge_id,group_id,creator_id,points_per_slot,slots_total,slots_reserved,slots_paid,refunded_slots,cancelled_at').eq('group_id',groupId),
    supabase.from('challenge_awards').select('id,group_id,challenge_id,participation_id,recipient_id,points,created_at').eq('group_id',groupId),
    supabase.from('daily_challenge_bonuses').select('id,group_id,user_id,award_date,points,created_at').eq('group_id',groupId).order('created_at',{ascending:false}),
    supabase.from('roulette_spins').select('id,group_id,user_id,bets,winning_number,stake,payout,created_at').eq('group_id',groupId).order('created_at',{ascending:false}),
    supabase.from('group_starting_points').select('group_id,user_id,points').eq('group_id',groupId)
  ]);
  const memberships=assertNoError(memberRows), rows=assertNoError(challenges), items=assertNoError(shopItems), purchases=assertNoError(shopPurchases), funds=assertNoError(challengeFunds), awards=assertNoError(challengeAwards), bonuses=assertNoError(dailyChallengeBonuses), spins=assertNoError(rouletteSpins), startingPoints=assertNoError(groupStartingPoints);
  const fundingByChallenge=new Map(funds.map(fund=>[fund.challenge_id,fund]));
  const list=rows.map(challenge=>{
    const bounty=fundingByChallenge.get(challenge.id);
    return {...challenge,bounty:bounty ? {...bounty,available_slots:bounty.slots_total-bounty.slots_paid-bounty.slots_reserved-bounty.refunded_slots} : null};
  });
  const [profileRows,participationRows]=await Promise.all([
    memberships.length ? supabase.from('profiles').select('id,display_name').in('id',memberships.map(m=>m.user_id)) : Promise.resolve({data:[],error:null}),
    list.length ? supabase.from('participations').select('id,challenge_id,user_id,status,proof_text,proof_path,created_at,submitted_at,reviewed_at,reviewed_by').in('challenge_id',list.map(c=>c.id)) : Promise.resolve({data:[],error:null})
  ]);
  const profiles=assertNoError(profileRows), participations=assertNoError(participationRows);
  const profileMap=new Map(profiles.map(p=>[p.id,p]));
  return {
    members:memberships.map(m=>({id:m.user_id,display_name:profileMap.get(m.user_id)?.display_name || 'Speler',joined_at:m.joined_at})),
    challenges:list,
    participations,
    shopItems:items,
    shopPurchases:purchases,
    challengeFunds:funds,
    challengeAwards:awards,
    dailyBonuses:bonuses,
    rouletteSpins:spins,
    groupStartingPoints:startingPoints
  };
}
export async function addChallenge(groupId,form,userId) {
  const payload={group_id:groupId,title:form.title.trim(),description:(form.description || '').trim(),category:form.category || 'overig',points:Number(form.points),reward_slots:Number(form.reward_slots),created_by:userId};
  if (isDemo) {
    const challenges=demoData.challenges.filter(challenge=>challenge.group_id===groupId);
    const ids=new Set(challenges.map(challenge=>challenge.id));
    const participations=demoData.participations.filter(participation=>ids.has(participation.challenge_id));
    const purchases=demoData.shopPurchases.filter(purchase=>purchase.group_id===groupId);
    const funds=demoData.challengeFunds.filter(fund=>fund.group_id===groupId);
    const awards=demoData.challengeAwards.filter(award=>award.group_id===groupId);
    if (pointBalance(
      userId,
      challenges,
      participations,
      purchases,
      funds,
      awards,
      demoData.dailyBonuses.filter(bonus=>bonus.group_id===groupId),
      demoData.rouletteSpins.filter(spin=>spin.group_id===groupId),
      demoData.groupStartingPoints.filter(points=>points.group_id===groupId)
    )<payload.points*payload.reward_slots) throw new Error('Je hebt niet genoeg punten om deze challenge en alle betaalde plekken te financieren.');
    const challenge={...payload,id:makeId(),created_at:now()};
    demoData.challenges.unshift(challenge);
    demoData.challengeFunds.unshift({challenge_id:challenge.id,group_id:groupId,creator_id:userId,points_per_slot:payload.points,slots_total:payload.reward_slots,slots_reserved:0,slots_paid:0,refunded_slots:0,cancelled_at:null});
    saveDemo();return challenge.id;
  }
  assertNoError(await supabase.from('challenges').insert(payload));
}
export async function cancelChallenge(challengeId,userId) {
  if (isDemo) {
    const challenge=demoData.challenges.find(challenge=>challenge.id===challengeId && challenge.created_by===userId);
    if (!challenge) throw new Error('Deze challenge is niet gevonden.');
    if (challenge.cancelled_at) throw new Error('Deze challenge is al ingetrokken.');
    const fund=demoData.challengeFunds.find(fund=>fund.challenge_id===challengeId);
    if (fund) {
      fund.refunded_slots+=fund.slots_total-fund.slots_paid-fund.slots_reserved-fund.refunded_slots;
      fund.cancelled_at=now();
    }
    challenge.cancelled_at=now();
    saveDemo();return;
  }
  assertNoError(await supabase.rpc('cancel_challenge',{p_challenge_id:challengeId}));
}
export async function withdrawChallenge(participationId,userId) {
  if (isDemo) {
    const index=demoData.participations.findIndex(participation=>participation.id===participationId && participation.user_id===userId && participation.status==='accepted');
    if (index<0) throw new Error('Alleen een challenge zonder ingezonden bewijs kan worden gestopt.');
    const participation=demoData.participations[index];
    const fund=demoData.challengeFunds.find(fund=>fund.challenge_id===participation.challenge_id);
    if (fund) {
      fund.slots_reserved-=1;
      if (fund.cancelled_at) fund.refunded_slots+=1;
    }
    demoData.participations.splice(index,1);
    saveDemo();return;
  }
  assertNoError(await supabase.rpc('withdraw_challenge',{p_participation_id:participationId}));
}
export async function addShopItem(groupId,form,userId) {
  const payload={group_id:groupId,title:form.title.trim(),description:(form.description || '').trim(),price:Number(form.price),stock:Number(form.stock),created_by:userId};
  if (isDemo) {demoData.shopItems.unshift({...payload,id:makeId(),created_at:now()});saveDemo();return;}
  assertNoError(await supabase.from('shop_items').insert(payload));
}
export async function buyShopItem(itemId,userId) {
  if (isDemo) {
    const item=demoData.shopItems.find(item=>item.id===itemId);
    if (!item) throw new Error('Deze beloning is niet meer beschikbaar.');
    if (item.created_by===userId) throw new Error('Je kunt je eigen beloning niet kopen.');
    if (item.stock<1) throw new Error('Deze beloning is uitverkocht.');
    const groupChallenges=demoData.challenges.filter(challenge=>challenge.group_id===item.group_id);
    const groupParticipations=demoData.participations.filter(participation=>groupChallenges.some(challenge=>challenge.id===participation.challenge_id));
    const balance=pointBalance(
      userId,
      groupChallenges,
      groupParticipations,
      demoData.shopPurchases.filter(purchase=>purchase.group_id===item.group_id),
      demoData.challengeFunds.filter(fund=>fund.group_id===item.group_id),
      demoData.challengeAwards.filter(award=>award.group_id===item.group_id),
      demoData.dailyBonuses.filter(bonus=>bonus.group_id===item.group_id),
      demoData.rouletteSpins.filter(spin=>spin.group_id===item.group_id),
      demoData.groupStartingPoints.filter(points=>points.group_id===item.group_id)
    );
    if (balance<item.price) throw new Error('Je hebt niet genoeg punten voor deze beloning.');
    item.stock-=1;
    const purchase={id:makeId(),group_id:item.group_id,item_id:item.id,buyer_id:userId,seller_id:item.created_by,price:item.price,created_at:now()};
    demoData.shopPurchases.unshift(purchase);saveDemo();return purchase;
  }
  return assertNoError(await supabase.rpc('purchase_shop_item',{p_item_id:itemId}));
}
export async function acceptChallenge(challengeId) {
  if (isDemo) {
    const challenge=demoData.challenges.find(challenge=>challenge.id===challengeId);
    if (!challenge) throw new Error('Challenge niet gevonden.');
    if (challenge.created_by==='me') throw new Error('Je kunt je eigen challenge niet uitvoeren.');
    let p=demoData.participations.find(p=>p.challenge_id===challengeId && p.user_id==='me');
    if (!p) {
      const fund=demoData.challengeFunds.find(fund=>fund.challenge_id===challengeId);
      if (fund) {
        if (fund.cancelled_at) throw new Error('Deze challenge is ingetrokken.');
        if (fund.slots_total-fund.slots_paid-fund.slots_reserved-fund.refunded_slots<1) throw new Error('Er zijn geen betaalde plekken meer beschikbaar.');
        fund.slots_reserved+=1;
      }
      p={id:makeId(),challenge_id:challengeId,user_id:'me',status:'accepted',proof_text:null,proof_path:null,created_at:now()};
      demoData.participations.push(p);saveDemo();
    }
    return p.id;
  }
  return assertNoError(await supabase.rpc('accept_challenge',{p_challenge_id:challengeId}));
}
async function imageDataUrl(file) {
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Foto kon niet worden geopend.'));reader.readAsDataURL(file);
  });
}
export async function submitProof(groupId,participationId,description,file,userId) {
  let path=null;
  if (isDemo) {
    // Demo images are kept in localStorage; use small files, because browsers limit storage.
    if (file) {if(file.size > 650000) throw new Error('In de demo kunnen alleen kleine foto’s (max. 650 KB) worden opgeslagen. In de echte app maximaal 4 MB.'); path=await imageDataUrl(file);}
    const p=demoData.participations.find(p=>p.id===participationId && p.user_id==='me');
    if (!p) throw new Error('Challenge niet gevonden.');
    const challenge=demoData.challenges.find(challenge=>challenge.id===p.challenge_id);
    if (challenge?.created_by===userId) throw new Error('Je kunt je eigen challenge niet uitvoeren.');
    const fund=demoData.challengeFunds.find(fund=>fund.challenge_id===p.challenge_id);
    if (fund && p.status==='rejected') {
      if (fund.cancelled_at) throw new Error('Deze challenge is ingetrokken en heeft geen betaalde plekken meer.');
      if (fund.slots_total-fund.slots_paid-fund.slots_reserved-fund.refunded_slots<1) throw new Error('Er zijn geen betaalde plekken meer beschikbaar.');
      fund.slots_reserved+=1;
    }
    p.status='pending';p.proof_text=description.trim();p.proof_path=path;p.submitted_at=now();saveDemo();return;
  }
  if (file) {
    if (file.size > 4 * 1024 * 1024) throw new Error('De foto mag maximaal 4 MB groot zijn.');
    const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif'}[file.type];
    if (!extension) throw new Error('Gebruik een JPG-, PNG-, WEBP- of HEIC-foto.');
    path=`${groupId}/${userId}/${participationId}/${makeId()}.${extension}`;
    const {error}=await supabase.storage.from('challenge-proofs').upload(path,file,{contentType:file.type,upsert:false});
    if (error) throw new Error(`Upload mislukt: ${error.message}`);
  }
  try {assertNoError(await supabase.rpc('submit_proof',{p_participation_id:participationId,p_proof_text:description.trim(),p_proof_path:path}));}
  catch (err) {if (path) await supabase.storage.from('challenge-proofs').remove([path]);throw err;}
}
export async function reviewSubmission(participationId,approved) {
  if (isDemo) {
    const p=demoData.participations.find(p=>p.id===participationId);
    if (!p || p.status !== 'pending') throw new Error('Dit bewijs wacht niet op beoordeling.');
    if (p.user_id==='me') throw new Error('Je kunt je eigen bewijs niet beoordelen.');
    const fund=demoData.challengeFunds.find(fund=>fund.challenge_id===p.challenge_id);
    if (fund) {
      if (fund.slots_reserved<1) throw new Error('Voor deze inzending is geen betaalde plek gereserveerd.');
      fund.slots_reserved-=1;
      if (approved) {
        fund.slots_paid+=1;
        demoData.challengeAwards.unshift({id:makeId(),group_id:fund.group_id,challenge_id:fund.challenge_id,participation_id:p.id,recipient_id:p.user_id,points:fund.points_per_slot,created_at:now()});
      } else if (fund.cancelled_at) {
        fund.refunded_slots+=1;
      }
    }
    let dailyBonusAwarded=false;
    if (approved) {
      const challenge=demoData.challenges.find(challenge=>challenge.id===p.challenge_id);
      if (!challenge) throw new Error('Challenge niet gevonden.');
      const awardDate=amsterdamDateKey();
      if (!demoData.dailyBonuses.some(bonus=>bonus.user_id===p.user_id && bonus.award_date===awardDate)) {
        demoData.dailyBonuses.unshift({
          id:makeId(),
          group_id:challenge.group_id,
          user_id:p.user_id,
          award_date:awardDate,
          points:DAILY_CHALLENGE_BONUS,
          created_at:now()
        });
        dailyBonusAwarded=true;
      }
    }
    p.status=approved?'approved':'rejected';p.reviewed_at=now();p.reviewed_by='me';saveDemo();return {dailyBonusAwarded};
  }
  assertNoError(await supabase.rpc('review_submission',{p_participation_id:participationId,p_approved:approved}));
}
export async function getProofUrl(path) {
  if (!path) return null;
  if (isDemo) return path.startsWith('data:image/') ? path : null;
  const {data,error}=await supabase.storage.from('challenge-proofs').createSignedUrl(path,3600);
  if (error) throw error;
  return data.signedUrl;
}
export async function spinRoulette(groupId,bets,userId) {
  if (isDemo) {
    const challenges=demoData.challenges.filter(challenge=>challenge.group_id===groupId);
    const challengeIds=new Set(challenges.map(challenge=>challenge.id));
    const balance=pointBalance(
      userId,
      challenges,
      demoData.participations.filter(participation=>challengeIds.has(participation.challenge_id)),
      demoData.shopPurchases.filter(purchase=>purchase.group_id===groupId),
      demoData.challengeFunds.filter(fund=>fund.group_id===groupId),
      demoData.challengeAwards.filter(award=>award.group_id===groupId),
      demoData.dailyBonuses.filter(bonus=>bonus.group_id===groupId),
      demoData.rouletteSpins.filter(spin=>spin.group_id===groupId),
      demoData.groupStartingPoints.filter(points=>points.group_id===groupId)
    );
    const error=validRouletteBets(bets,balance);
    if (error) throw new Error(error);
    const winningNumber=Math.floor(Math.random()*37);
    const stake=bets.reduce((total,bet)=>total+Number(bet.stake),0);
    const spin={
      id:makeId(),
      group_id:groupId,
      user_id:userId,
      bets:bets.map(({type,value,stake:betStake})=>({type,value,stake:betStake})),
      winning_number:winningNumber,
      stake,
      payout:rouletteGrossPayout(bets,winningNumber),
      created_at:now()
    };
    demoData.rouletteSpins.unshift(spin);
    saveDemo();
    return spin;
  }
  const cleanBets=bets.map(({type,value,stake})=>({type,value,stake}));
  return assertNoError(await supabase.rpc('spin_roulette',{p_group_id:groupId,p_bets:cleanBets}));
}
export function subscribeToGroup(groupId,notify) {
  if (isDemo) {
    const callback=(ev)=>{if(ev.key === DB_KEY) {demoData=loadDemo();notify();}};
    window.addEventListener('storage',callback);
    return ()=>window.removeEventListener('storage',callback);
  }
  const channel=supabase.channel(`puntjacht-${groupId}-${makeId()}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'challenges',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'participations'},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'group_members',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'shop_items',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'shop_purchases',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'challenge_funds',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'challenge_awards',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'daily_challenge_bonuses',filter:`group_id=eq.${groupId}`},notify)
    .on('postgres_changes',{event:'*',schema:'public',table:'roulette_spins',filter:`group_id=eq.${groupId}`},notify)
    .subscribe();
  return ()=>{supabase.removeChannel(channel);};
}
