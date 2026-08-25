import{n as e}from"./supabase.DdMF51nB.js";e.auth.getSession().then(({data:{session:e}})=>{e||(window.location.href=`/admin/`)});var t=[`Janvier`,`Février`,`Mars`,`Avril`,`Mai`,`Juin`,`Juillet`,`Août`,`Septembre`,`Octobre`,`Novembre`,`Décembre`],n=new Date,r=new Date,i=[],a=`all`,o=document.getElementById(`debug-banner`);function s(e){o.textContent=e,o.classList.remove(`hidden`)}async function c(){let{data:t,error:n}=await e.from(`bookings`).select(`*`).order(`booking_date`,{ascending:!1});n?(s(`Erreur Supabase: ${n.message} (Code: ${n.code}). Vérifiez que la table "bookings" existe et que les policies RLS sont configurées.`),console.error(`Supabase error:`,n),i=[]):(o.classList.add(`hidden`),i=t||[]),l(),u(),f()}function l(){let e=i.filter(e=>e.status===`pending`).length,t=i.filter(e=>e.status===`confirmed`).length,n=i.filter(e=>e.status===`cancelled`).length;document.getElementById(`stat-pending`).textContent=String(e),document.getElementById(`stat-confirmed`).textContent=String(t),document.getElementById(`stat-cancelled`).textContent=String(n),document.getElementById(`stat-total`).textContent=String(i.length)}function u(){let e=document.getElementById(`bookings-list`),t=a===`all`?i:i.filter(e=>e.status===a);if(t.length===0){e.innerHTML=`<div class="text-sm text-zinc-500 text-center py-12">
          ${a===`all`?`Aucune réservation pour le moment`:`Aucune réservation avec ce statut`}
        </div>`;return}e.innerHTML=t.map(e=>{let t=new Date(e.booking_date+`T00:00:00`).toLocaleDateString(`fr-FR`,{day:`numeric`,month:`short`});return window.innerWidth<768?`
            <div class="p-4 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-medium text-sm text-white">${g(e.client_name)}</p>
                  <p class="text-xs text-zinc-400 mt-0.5">TEL: ${g(e.client_phone)}</p>
                </div>
                <span class="status-badge status-${e.status}">${h(e.status)}</span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${t}
                </span>
                <span class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${e.booking_time}
                </span>
                <span class="font-medium text-white">${e.total_price}€</span>
              </div>
              <p class="text-xs text-zinc-500">${g(e.services.join(`, `))}</p>
              ${e.barber?`<p class="text-xs text-zinc-500">Coiffeur: ${g(e.barber)}</p>`:``}
              ${e.notes?`<p class="text-xs text-zinc-500 italic">"${g(e.notes)}"</p>`:``}
              <div class="flex gap-2 pt-1">
                ${e.status===`pending`?`
                  <button data-confirm="${e.id}" class="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">Confirmer</button>
                  <button data-cancel="${e.id}" class="flex-1 py-2 text-xs font-medium rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Annuler</button>
                `:`
                  <button data-delete="${e.id}" class="flex-1 py-2 text-xs font-medium rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">Supprimer</button>
                `}
              </div>
            </div>`:`
          <div class="grid grid-cols-[1fr_120px_100px_140px_100px_120px] gap-4 items-center px-5 py-4 hover:bg-zinc-800/30 transition-colors">
            <div>
              <p class="font-medium text-sm text-white">${g(e.client_name)}</p>
              <p class="text-xs text-zinc-400">${g(e.client_phone)}</p>
              ${e.barber?`<p class="text-[11px] text-zinc-500">${g(e.barber)}</p>`:``}
            </div>
            <span class="text-sm text-zinc-300">${t}</span>
            <span class="text-sm text-zinc-300">${e.booking_time}</span>
            <span class="text-xs text-zinc-400 line-clamp-2">${g(e.services.join(`, `))}</span>
            <span class="text-sm font-medium text-amber-400">${e.total_price}€</span>
            <div class="flex items-center gap-2 justify-end">
              <span class="status-badge status-${e.status}">${h(e.status)}</span>
              ${e.status===`pending`?`
                <button data-confirm="${e.id}" class="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors" title="Confirmer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button data-cancel="${e.id}" class="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors" title="Annuler">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              `:`
                <button data-delete="${e.id}" class="p-1.5 rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors" title="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              `}
            </div>
          </div>`}).join(``),d(e)}function d(t){t.querySelectorAll(`[data-confirm]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.confirm;await e.from(`bookings`).update({status:`confirmed`}).eq(`id`,n),await c()})}),t.querySelectorAll(`[data-cancel]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.cancel;await e.from(`bookings`).update({status:`cancelled`}).eq(`id`,n),await c()})}),t.querySelectorAll(`[data-delete]`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!confirm(`Supprimer cette réservation ?`))return;let n=t.dataset.delete;await e.from(`bookings`).delete().eq(`id`,n),await c()})})}function f(){let e=n.getFullYear(),a=n.getMonth();document.getElementById(`calendar-title`).textContent=`${t[a]} ${e}`;let o=new Date(e,a,1),s=new Date(e,a+1,0),c=(o.getDay()+6)%7,l=s.getDate(),u=m(new Date),d=m(r),h=``,g=new Date(e,a,0).getDate();for(let e=c-1;e>=0;e--)h+=`<div class="day-cell other-month">${g-e}</div>`;for(let t=1;t<=l;t++){let n=m(new Date(e,a,t)),r=i.filter(e=>e.booking_date===n),o=r.some(e=>e.status===`pending`),s=r.some(e=>e.status===`confirmed`),c=[`day-cell`,n===u?`today`:``,n===d?`selected`:``,r.length>0?s&&!o?`has-confirmed`:`has-bookings`:``].filter(Boolean).join(` `);h+=`<div class="${c}" data-date="${n}">${t}</div>`}let _=c+l,v=_%7==0?0:7-_%7;for(let e=1;e<=v;e++)h+=`<div class="day-cell other-month">${e}</div>`;document.getElementById(`calendar-grid`).innerHTML=h,document.querySelectorAll(`[data-date]`).forEach(e=>{e.addEventListener(`click`,()=>{r=new Date(e.dataset.date+`T00:00:00`),f(),p()})})}function p(){let e=m(r),t=i.filter(t=>t.booking_date===e);document.getElementById(`selected-date-title`).textContent=r.toLocaleDateString(`fr-FR`,{weekday:`long`,day:`numeric`,month:`long`}),document.getElementById(`selected-date-subtitle`).textContent=`${t.length} réservation${t.length===1?``:`s`}`;let n=document.getElementById(`day-bookings`);if(t.length===0){n.innerHTML=`<p class="text-sm text-zinc-500 text-center py-8">Aucune réservation ce jour</p>`;return}n.innerHTML=t.map(e=>`
        <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3.5 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium text-sm text-white">${g(e.client_name)}</p>
              <p class="text-xs text-zinc-400 mt-0.5">${g(e.client_phone)}</p>
            </div>
            <span class="status-badge status-${e.status}">${h(e.status)}</span>
          </div>
          <div class="text-xs text-zinc-400 space-y-0.5">
            <p class="font-medium text-zinc-300">${e.booking_time}</p>
            <p>${g(e.services.join(`, `))}</p>
            <p class="text-amber-400 font-medium">${e.total_price}€</p>
            ${e.barber?`<p>Coiffeur: ${g(e.barber)}</p>`:``}
          </div>
          ${e.status===`pending`?`
            <div class="flex gap-2 pt-1">
              <button data-confirm="${e.id}" class="flex-1 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">Confirmer</button>
              <button data-cancel="${e.id}" class="flex-1 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Annuler</button>
            </div>
          `:`
            <button data-delete="${e.id}" class="w-full py-1.5 text-xs font-medium rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors mt-1">Supprimer</button>
          `}
        </div>
      `).join(``),d(n)}function m(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function h(e){return e===`pending`?`En attente`:e===`confirmed`?`Confirmée`:`Annulée`}function g(e){let t=document.createElement(`div`);return t.textContent=e||``,t.innerHTML}var _=document.getElementById(`tab-list`),v=document.getElementById(`tab-calendar`),y=document.getElementById(`view-list`),b=document.getElementById(`view-calendar`);_.addEventListener(`click`,()=>{_.className=`px-4 py-2 text-sm font-medium rounded-lg bg-white text-zinc-900 transition-colors`,v.className=`px-4 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:text-white transition-colors`,y.classList.remove(`hidden`),b.classList.add(`hidden`),u()}),v.addEventListener(`click`,()=>{v.className=`px-4 py-2 text-sm font-medium rounded-lg bg-white text-zinc-900 transition-colors`,_.className=`px-4 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:text-white transition-colors`,b.classList.remove(`hidden`),y.classList.add(`hidden`),f(),p()}),document.getElementById(`prev-month`).addEventListener(`click`,()=>{n.setMonth(n.getMonth()-1),f()}),document.getElementById(`next-month`).addEventListener(`click`,()=>{n.setMonth(n.getMonth()+1),f()}),document.querySelectorAll(`[data-filter]`).forEach(e=>{e.addEventListener(`click`,()=>{a=e.dataset.filter,document.querySelectorAll(`[data-filter]`).forEach(e=>{e.className=`filter-btn px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors`}),e.className=`filter-btn px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-zinc-900 transition-colors`,u()})}),c();