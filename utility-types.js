const svg=paths=>`<svg viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
export const utilityTypes={
 smoke:{label:'烟雾弹',short:'烟',color:'#a9d7cb',targetLabel:'烟雾落点',icon:svg('<path d="M9 3h6v4H9zM8 9h9l1 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V12zM15 4h4l1 7M8 14h9M8 20h9M10 17h5"/>')},
 flash:{label:'闪光弹',short:'闪',color:'#f4d981',targetLabel:'闪光爆点',icon:svg('<path d="M13 2 4 15h7l-1 11 10-15h-7z"/>')},
 he:{label:'高爆手雷',short:'雷',color:'#ee827a',targetLabel:'手雷爆点',icon:svg('<path d="M9 5h6v5H9zM15 5h4l1 7M7 11c-4 4-4 10 1 13h8c5-3 5-9 1-13zM7 15h10M6 19h12M10 11v13M14 11v13"/>')},
 molotov:{label:'燃烧弹',short:'火',color:'#f6a166',targetLabel:'燃烧落点',icon:svg('<path d="M13 2c1 6-5 7-3 12 2-1 3-3 3-5 5 4 8 8 5 13-2 4-10 4-13 0-3-5 2-11 4-13-1 4 0 5 1 5"/>')}
};
export const filterUtilities=(items,type,zone='all')=>items.filter(s=>s.type===type&&(zone==='all'||s.zone===zone));
