import {utilityIcons} from './utility-icons.js';
export const utilityTypes={
 smoke:{label:'烟雾弹',short:'烟',color:'#a9d7cb',targetLabel:'烟雾落点',icon:utilityIcons.smoke},
 flash:{label:'闪光弹',short:'闪',color:'#f4d981',targetLabel:'闪光爆点',icon:utilityIcons.flash},
 he:{label:'高爆手雷',short:'雷',color:'#ee827a',targetLabel:'手雷爆点',icon:utilityIcons.he},
 molotov:{label:'燃烧弹',short:'火',color:'#f6a166',targetLabel:'燃烧落点',icon:utilityIcons.molotov}
};
export const filterUtilities=(items,type,zone='all')=>items.filter(s=>s.type===type&&(zone==='all'||s.zone===zone));
