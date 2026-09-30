/* Pridex — бриф на Test-fit. Vanilla JS, без зависимостей. */
(() => {
'use strict';
const KEY = 'pridex-brief-v1';
const MAXMB = 30;
const ENDPOINT = () => (window.BRIEF_ENDPOINT || '').trim();

/* ---------- storage (best effort) ---------- */
const store = {
  get(){ try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ return null; } },
  set(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch(e){ return false; } },
  del(){ try { localStorage.removeItem(KEY); } catch(e){} }
};

let S = { lang:'ru', mode:null, step:0, a:{}, maxStep:0 };
const saved = store.get();
if (saved && saved.a) S = Object.assign(S, saved);
if (S.a.character != null && S.a.character <= 4 && S.a.character % 10) S.a.character = [10,20,50,70,90][S.a.character] ?? 20;
['hc3','hcUnknown','work','share','deskAdj'].forEach(k => delete S.a[k]);
const FILES = {};            // fieldId -> [File]
let view = 'intro';          // intro | wiz | sending | done | cab

/* ---------- i18n ---------- */
const T = {
  eyebrow:{ru:'Pridex · Test-fit офиса',en:'Pridex · Office Test-fit'},
  h1:{ru:'Бриф на планировку офиса',en:'Office layout brief'},
  lead:{ru:'Ответьте на несколько вопросов и приложите планировку shell&core. Мы подготовим Test-fit: расстановку рабочих мест, функциональное зонирование, проверку эвакуации и реальную вместимость этажа.',
        en:'Answer a few questions and attach the shell & core plan. We will prepare a Test-fit: workplace layout, functional zoning, evacuation check and the real capacity of the floor.'},
  shortT:{ru:'Сокращённый',en:'Short'}, shortTag:{ru:'≈ 5 минут',en:'≈ 5 minutes'},
  shortP:{ru:'Задача только формируется: численность, характер офиса, ключевые пожелания. Остальное предложим сами.',en:'The task is still taking shape: headcount, office character, key wishes. We will propose the rest.'},
  fullT:{ru:'Расширенный',en:'Detailed'}, fullTag:{ru:'≈ 20 минут',en:'≈ 20 minutes'},
  fullP:{ru:'Параметры известны: структура отделов, кабинеты, переговорные, сервис, стандарт и бюджет.',en:'You know the parameters: departments, private offices, meeting rooms, services, standard and budget.'},
  start:{ru:'Начать',en:'Start'},
  needH:{ru:'Что понадобится',en:'What you need'},
  need1:{ru:'<b>Планировка shell&core</b> — DWG, DXF или векторный PDF: колонны, фасад, ядро с экспликацией, конвекторы',en:'<b>Shell & core plan</b> — DWG, DXF or vector PDF: columns, façade, core with room schedule, convectors'},
  need2:{ru:'<b>Ваше ТЗ</b> — если оно уже есть, в любой форме',en:'<b>Your requirements</b> — if you have them, in any format'},
  need3:{ru:'Черновик сохраняется автоматически — можно вернуться позже',en:'Your draft is saved automatically — you can come back later'},
  resume:{ru:'У вас есть незаконченный бриф.',en:'You have an unfinished brief.'},
  cont:{ru:'Продолжить',en:'Continue'}, reset:{ru:'Начать заново',en:'Start over'},
  back:{ru:'Назад',en:'Back'}, next:{ru:'Далее',en:'Next'}, review:{ru:'Проверить',en:'Review'},
  send:{ru:'Отправить бриф',en:'Send brief'}, edit:{ru:'Изменить',en:'Edit'},
  step:{ru:'Шаг',en:'Step'}, of:{ru:'из',en:'of'},
  switchTo:{ru:'Перейти на',en:'Switch to'}, shortL:{ru:'сокращённый',en:'short'}, fullL:{ru:'расширенный',en:'detailed'},
  saved:{ru:'Черновик сохранён',en:'Draft saved'},
  required:{ru:'Обязательное поле',en:'Required field'},
  needFile:{ru:'Приложите планировку или дайте ссылку на файлы',en:'Attach the plan or give a link to the files'},
  badEmail:{ru:'Проверьте e-mail',en:'Check the e-mail'},
  dropB:{ru:'Перетащите файлы сюда',en:'Drop files here'}, dropS:{ru:'или нажмите, чтобы выбрать',en:'or click to choose'},
  tooBig:{ru:`Больше ${MAXMB} МБ — дайте ссылку на файл`,en:`Over ${MAXMB} MB — please share a link instead`},
  add:{ru:'+ Добавить строку',en:'+ Add row'}, total:{ru:'Итого',en:'Total'}, ppl:{ru:'чел.',en:'people'},
  reviewH:{ru:'Проверьте бриф',en:'Review your brief'},
  reviewS:{ru:'Всё верно? Нажмите «Изменить», чтобы поправить раздел.',en:'All correct? Use “Edit” to change a section.'},
  empty:{ru:'Не заполнено',en:'Not filled'},
  consent:{ru:'Я согласен на обработку персональных данных для подготовки предложения',en:'I agree to the processing of my personal data to prepare the proposal'},
  sending:{ru:'Отправляем бриф…',en:'Sending your brief…'},
  sendingF:{ru:'Загружаем файлы',en:'Uploading files'},
  doneH:{ru:'Спасибо, бриф получен',en:'Thank you, brief received'},
  doneP:{ru:'Мы изучим планировку и вернёмся с вопросами или готовым Test-fit. Обычно это занимает 2–3 рабочих дня.',en:'We will study the plan and come back with questions or a ready Test-fit. This usually takes 2–3 working days.'},
  demo:{ru:'Демо-режим: приём брифов ещё не подключён. Ниже — бриф в том виде, в каком он придёт.',en:'Demo mode: submission is not connected yet. Below is the brief exactly as it will arrive.'},
  errSend:{ru:'Не удалось отправить. Проверьте соединение и попробуйте ещё раз — ответы сохранены.',en:'Could not send. Check your connection and try again — your answers are saved.'},
  retry:{ru:'Повторить',en:'Retry'}, newBrief:{ru:'Заполнить новый бриф',en:'Fill in a new brief'},
  dl:{ru:'Скачать копию (brief.md)',en:'Download a copy (brief.md)'},
  foot:{ru:'Test-fit · зонирование · вместимость',en:'Test-fit · zoning · capacity'},
  clH:{ru:'Что должно быть видно на планировке',en:'What the plan must show'},
  files:{ru:'Файлы',en:'Files'},
  pathL:{ru:'Путь до отправки',en:'Path to sending'}, endL:{ru:'Отправка',en:'Send'},
  toShort:{ru:'Сокращённый бриф',en:'Short brief'}, toFull:{ru:'Расширенный бриф',en:'Detailed brief'},
  minLeft:{ru:'мин до отправки',en:'min to send'}, oneClick:{ru:'Остался один клик',en:'One click left'},
  sentL:{ru:'Бриф отправлен',en:'Brief sent'},
  navL:{ru:'Навигация по брифу',en:'Brief navigation'}, homeL:{ru:'На главную',en:'Home'}
};
const t = k => (T[k] ? (T[k][S.lang] || T[k].ru) : k);
const L = o => (o == null ? '' : typeof o === 'string' ? o : (o[S.lang] || o.ru));
const LR = o => (o == null ? '' : typeof o === 'string' ? o : o.ru);   // для отчёта всегда RU
const op = (v, ru, en, sm) => ({ v, l:{ru, en:en||ru}, s: sm });

/* ---------- schema ---------- */
const yesno = [op('yes','Нужна','Needed'), op('no','Не нужна','Not needed')];
const pctTxt = (v, ru) => (ru || S.lang!=='en') ? `Open space ${100-v} % · кабинеты ${v} %` : `Open space ${100-v}% · private offices ${v}%`;
const characterField = { id:'character', type:'range', min:0, max:100, step:10, def:20, split:1,
  l:{ru:'Open space и кабинеты',en:'Open space vs private offices'}, hint:{ru:'Передвиньте границу — как рабочие места делятся между open space и кабинетами',en:'Drag the divider to split workplaces between open space and private offices'},
  ends:[{ru:'Open space',en:'Open space'},{ru:'Кабинеты',en:'Private offices'}],
  fmt:v => pctTxt(v, false), fmtRu:v => pctTxt(v, true) };
const deskOpt = (v, w, d, tag, m2, eff) => ({ v, w, d, l:{ru:`${w} × ${d}`, en:`${w} × ${d}`}, tag, m2, eff });
const deskField = { id:'desk', type:'seg', desk:1, l:{ru:'Стандартный стол',en:'Standard desk'},
  hint:{ru:'Размер стола сильно влияет на плотность посадки. Схемы — в одном масштабе, с зоной кресла.',en:'Desk size strongly affects seating density. Drawings share one scale and show the chair zone.'},
  opts:[
    deskOpt('1200',1200,600,{ru:'Компактный',en:'Compact'},{ru:'≈ 6–6,5 м² на место',en:'≈ 6–6.5 m² per seat'},{ru:'на 10–15 % больше мест, чем с 1400',en:'10–15% more seats than 1400'}),
    deskOpt('1400',1400,700,{ru:'Стандарт',en:'Standard'},{ru:'≈ 7,5–8 м² на место',en:'≈ 7.5–8 m² per seat'},{ru:'рынок бизнес-центров класса А',en:'the Class A market norm'}),
    deskOpt('1600',1600,800,{ru:'Просторный',en:'Spacious'},{ru:'≈ 9 м² на место',en:'≈ 9 m² per seat'},{ru:'на 10–15 % меньше мест; 2 монитора, чертежи',en:'10–15% fewer seats; dual screens, drawings'}),
    { v:'unk', l:{ru:'Подберите сами',en:'Your call'}, tag:{ru:'Не знаю',en:'Not sure'}, m2:{ru:'Предложим по плотности',en:'We will suggest by density'}, eff:{ru:'по умолчанию 1400 × 700',en:'default 1400 × 700'} }
  ] };
const priorityField = { id:'priority', type:'chips', max:2, l:{ru:'Главный приоритет',en:'Main priority'}, hint:{ru:'Выберите до двух',en:'Choose up to two'},
  opts:[op('seats','Больше рабочих мест','More workplaces'), op('comfort','Комфорт сотрудников','Employee comfort'), op('image','Представительность','Prestige')] };
const G = (ru, en) => ({ ru, en });
const roomsField = { id:'special', type:'chips', l:{ru:'Особые помещения',en:'Special rooms'}, hint:{ru:'Отметьте всё, что нужно разместить на этаже',en:'Tick everything that must fit on the floor'},
  groups:[
    { g:G('Общие','General'), opts:[op('server','Серверная','Server room'), op('archive','Архив','Archive'), op('store','Склад','Storage'), op('event','Зал мероприятий / town hall','Event space / town hall'), op('training','Учебный класс','Training room'), op('mail','Почтовая / экспедиция','Mail room'), op('med','Медкабинет','First aid room'), op('showers','Душевые','Showers'), op('wellness','Фитнес / йога','Fitness / yoga')] },
    { g:G('Банки и финансы','Banking & finance'), opts:[op('board','Переговорная совета директоров','Board room'), op('dealing','Дилинговый зал','Trading floor'), op('sitroom','Ситуационный центр','Situation room'), op('vip','VIP-зона для клиентов','VIP client lounge'), op('cash','Кассовый узел','Cash desk'), op('security','Служба безопасности','Security office'), op('secure','Помещения с особым режимом доступа','Restricted-access rooms')] },
    { g:G('IT и технологии','IT & tech'), opts:[op('servicedesk','Сервис-деск / выдача техники','IT service desk'), op('lab','Тестовая лаборатория','Test lab'), op('studio','Студия записи / подкастов','Recording studio'), op('project','Проектные комнаты (war rooms)','Project war rooms'), op('game','Игровая зона','Game room')] },
    { g:G('Продажи и сервис','Sales & service'), opts:[op('callcenter','Колл-центр','Call centre'), op('show','Шоурум','Showroom'), op('client','Клиентская зона','Client area')] },
    { g:G('Креатив и производство','Creative & production'), opts:[op('models','Макетная / мастерская','Model workshop'), op('material','Материаловедческая библиотека','Material library'), op('photo','Фотостудия','Photo studio')] }
  ] };
roomsField.opts = roomsField.groups.flatMap(g => g.opts);
const teamBase = [
  { id:'hc', type:'number', half:true, l:{ru:'Сколько человек рассадить',en:'People to seat'}, hint:{ru:'если известно',en:'if known'}, min:1 },
  { id:'density', type:'number', half:true, l:{ru:'или плотность, м² NIA на человека',en:'or density, m² NIA per person'}, hint:{ru:'например, 8–10',en:'e.g. 8–10'}, min:1 },
  { id:'hcNote', type:'note', t:{ru:'Если не указать — покажем максимальную вместимость этажа.',en:'Leave blank and we will show the maximum capacity of the floor.'} }
];

const STEPS = [
 { id:'contacts', modes:'sf', t:{ru:'Контакты',en:'Contacts'}, sub:{ru:'Как с вами связаться.',en:'How to reach you.'}, fields:[
   { id:'company', type:'text', half:true, l:{ru:'Компания',en:'Company'}, auto:'organization' },
   { id:'name', type:'text', half:true, l:{ru:'Контактное лицо',en:'Contact person'}, auto:'name' },
   { id:'role', type:'text', half:true, l:{ru:'Должность',en:'Position'}, auto:'organization-title' },
   { id:'phone', type:'tel', half:true, l:{ru:'Телефон',en:'Phone'}, ph:'+7', auto:'tel' },
   { id:'email', type:'email', half:true, l:{ru:'E-mail',en:'E-mail'}, auto:'email' },
   { id:'tg', type:'text', half:true, l:{ru:'Telegram',en:'Telegram'}, ph:'@username' }
 ]},
 { id:'object', modes:'sf', t:{ru:'Объект',en:'Premises'}, sub:{ru:'Где будет офис и когда нужен Test-fit.',en:'Where the office will be and when you need the Test-fit.'}, fields:[
   { id:'objInFiles', type:'check', l:{ru:'Приложу всю информацию файлами',en:'I will attach all information as files'}, hint:{ru:'Адрес, этаж и площадь возьмём из ваших файлов — поля ниже можно не заполнять',en:'We will take the address, floor and area from your files — the fields below are optional'} },
   { id:'bc', type:'text', req:a => !a.objInFiles, half:true, l:{ru:'Бизнес-центр',en:'Building'}, ph:{ru:'БЦ «…»',en:'Building name'} },
   { id:'address', type:'text', req:a => !a.objInFiles, half:true, l:{ru:'Адрес',en:'Address'} },
   { id:'floor', type:'text', half:true, l:{ru:'Этаж / блок',en:'Floor / unit'}, ph:{ru:'например, 15 этаж, блок А',en:'e.g. 15th floor, unit A'} },
   { id:'area', type:'number', req:a => !a.objInFiles, half:true, l:{ru:'Площадь, м²',en:'Area, m²'}, min:1 },
   { id:'deadline', type:'seg', l:{ru:'Когда нужен Test-fit',en:'When you need the Test-fit'}, opts:[op('asap','Как можно скорее','ASAP'), op('3d','2–3 дня','2–3 days'), op('flex','Не срочно','No rush')] },
 ]},
 { id:'teamS', modes:'s', t:{ru:'Параметры пространства',en:'Space parameters'}, sub:{ru:'Сколько людей и каким вы видите офис.',en:'Headcount and how you see the office.'}, fields: teamBase },
 { id:'teamF', modes:'f', t:{ru:'Параметры пространства',en:'Space parameters'}, sub:{ru:'Сколько людей рассадить и как распределить подразделения.',en:'How many people to seat and how to arrange departments.'}, fields: teamBase.concat([
   { id:'deskPolicy', type:'seg', l:{ru:'Рабочие места',en:'Desk policy'}, opts:[op('fixed','Закреплённые','Assigned'), op('mixed','Частично свободные','Partly shared'), op('hot','Свободная рассадка (hot desk)','Hot desking')] },
   { id:'depts', type:'table', l:{ru:'Подразделения',en:'Departments'}, hint:{ru:'Кто с кем должен сидеть рядом — так мы сгруппируем отделы.',en:'Who should sit next to whom — this helps us group departments.'}, sumCol:'n',
     cols:[ {id:'name', l:{ru:'Подразделение',en:'Department'}, w:'2fr'}, {id:'n', l:{ru:'Чел.',en:'People'}, w:'.7fr', num:1}, {id:'cab', l:{ru:'Из них в кабинетах',en:'In offices'}, w:'1fr', num:1}, {id:'near', l:{ru:'Рядом с',en:'Next to'}, w:'1.4fr'} ] }
 ])},
 { id:'spaceS', modes:'s', t:{ru:'Пространство',en:'Space'}, sub:{ru:'Каким вы видите офис — в общих чертах.',en:'How you see the office — in broad strokes.'}, fields:[
   characterField,
   deskField,
   { id:'cabsN', type:'number', half:true, l:{ru:'Сколько нужно отдельных кабинетов',en:'How many private offices'}, hint:{ru:'Для руководителей и тех, кому нужна тишина',en:'For managers and those who need quiet'}, min:0 },
   { id:'meet', type:'seg', l:{ru:'Переговорные',en:'Meeting rooms'}, opts:[op('few','Минимум, 1–2','Minimum, 1–2'), op('mid','Средне, 1 на 20–25 чел.','Average, 1 per 20–25 people'), op('many','Много — часто встречаемся','Many — we meet a lot')] },
   { id:'reception', type:'seg', l:{ru:'Приём гостей',en:'Guests'}, opts:[op('rec','Ресепшн с зоной ожидания','Reception with waiting area'), op('wait','Достаточно зоны ожидания','A waiting area is enough'), op('no','Не нужно','Not needed')] },
   { id:'food', type:'seg', l:{ru:'Питание',en:'Food'}, opts:[op('coffee','Кофепоинты','Coffee points'), op('kitchen','Кухня-столовая','Kitchen & dining'), op('court','В здании есть столовая','Canteen in the building')] },
   roomsField,
   priorityField
 ]},
 { id:'work', modes:'f', t:{ru:'Рабочие места',en:'Workplaces'}, sub:{ru:'Характер офиса и оснащение рабочих мест.',en:'Office character and workplace set-up.'}, fields:[
   characterField,
   deskField,
   { id:'storage', type:'seg', l:{ru:'Персональное хранение',en:'Personal storage'}, opts:[op('ped','Тумба у стола','Pedestal'), op('locker','Локер','Locker'), op('both','Тумба + локер','Pedestal + locker'), op('none','Не нужно','None')] },
   { id:'guest', type:'number', half:true, l:{ru:'Гостевые / проектные места',en:'Guest / project desks'}, min:0 },
   { id:'zones', type:'chips', l:{ru:'Зоны для работы вне стола',en:'Spaces beyond the desk'}, opts:[op('lounge','Лаунж','Lounge'), op('cowork','Коворкинг-зона','Co-working zone'), op('town','Зона общих собраний','Town hall'), op('terrace','Терраса / балкон','Terrace / balcony'), op('library','Тихая библиотека','Quiet library')] }
 ]},
 { id:'cabs', modes:'f', t:{ru:'Кабинеты',en:'Private offices'}, sub:{ru:'Перечислите кабинеты. Если не нужны — оставьте пустым.',en:'List the private offices. Leave empty if none.'}, fields:[
   { id:'cabList', type:'table', l:{ru:'Кабинеты',en:'Offices'}, sumCol:'n',
     cols:[ {id:'role', l:{ru:'Должность / назначение',en:'Role / purpose'}, w:'2fr'}, {id:'n', l:{ru:'Мест',en:'Seats'}, w:'.6fr', num:1}, {id:'area', l:{ru:'≈ м²',en:'≈ m²'}, w:'.6fr', num:1}, {id:'extra', l:{ru:'Особенности',en:'Features'}, w:'1.6fr', ph:{ru:'приёмная, стол переговоров…',en:'anteroom, meeting table…'}} ] },
   { id:'cabFront', type:'seg', l:{ru:'Фронт кабинетов к коридору',en:'Office fronts to the corridor'}, opts:[op('glass','Стеклянный','Glazed'), op('solid','Глухой','Solid'), op('any','На ваше усмотрение','Your call')] }
 ]},
 { id:'meet', modes:'f', t:{ru:'Переговорные и тихие зоны',en:'Meeting & quiet rooms'}, sub:{ru:'Сколько и каких помещений для встреч и концентрации.',en:'How many rooms for meetings and focus work.'}, fields:[
   { id:'rooms', type:'counters', l:{ru:'Переговорные по вместимости',en:'Meeting rooms by capacity'}, items:[ {id:'m4', l:{ru:'на 4',en:'for 4'}}, {id:'m6', l:{ru:'на 6',en:'for 6'}}, {id:'m10', l:{ru:'на 8–10',en:'for 8–10'}}, {id:'m12', l:{ru:'на 12+',en:'for 12+'}}, {id:'mt', l:{ru:'трансформер',en:'flexible / training'}} ] },
   { id:'quiet', type:'counters', l:{ru:'Для тихой работы',en:'For focus work'}, items:[ {id:'booth', l:{ru:'телефонные будки',en:'phone booths'}}, {id:'focus', l:{ru:'фокус-комнаты на 1–2',en:'focus rooms for 1–2'}} ] },
   { id:'vks', type:'seg', l:{ru:'Видеосвязь в переговорных',en:'Video conferencing'}, opts:[op('all','Во всех','In all rooms'), op('some','В части','In some'), op('no','Не нужна','Not needed')] },
   { id:'booking', type:'check', l:{ru:'Нужна система бронирования переговорных',en:'Room booking system needed'} }
 ]},
 { id:'entry', modes:'f', t:{ru:'Входная группа',en:'Entrance'}, sub:{ru:'Как встречаем гостей и сотрудников.',en:'How guests and staff are welcomed.'}, fields:[
   { id:'recep', type:'seg', l:{ru:'Ресепшн',en:'Reception'}, opts:[op('0','Не нужен','Not needed'), op('1','1 оператор','1 operator'), op('2','2 оператора','2 operators')] },
   { id:'waiting', type:'seg', l:{ru:'Зона ожидания',en:'Waiting area'}, opts:yesno },
   { id:'guestWr', type:'seg', l:{ru:'Гардероб для гостей',en:'Guest cloakroom'}, opts:yesno },
   { id:'guestMeet', type:'seg', l:{ru:'Гостевая переговорная у входа',en:'Client meeting room at the entrance'}, opts:yesno },
   { id:'access', type:'seg', l:{ru:'Контроль доступа (СКУД)',en:'Access control'}, opts:[op('card','По картам','Cards'), op('bio','Биометрия / Face ID','Biometrics'), op('bc','Решает бизнес-центр','Provided by the building'), op('no','Не нужен','Not needed')] }
 ]},
 { id:'service', modes:'f', t:{ru:'Питание и сервис',en:'Food & services'}, sub:{ru:'Кухня, печать, хранение, IT.',en:'Kitchen, printing, storage, IT.'}, fields:[
   { id:'kitchen', type:'seg', l:{ru:'Кухня-столовая',en:'Kitchen & dining'}, opts:[op('no','Не нужна','Not needed'), op('small','Небольшая, до 20 мест','Small, up to 20 seats'), op('big','Полноценная столовая','Full canteen'), op('court','В здании есть столовая','Canteen in the building')] },
   { id:'seats', type:'number', half:true, show:a => a.kitchen==='small' || a.kitchen==='big', l:{ru:'Посадочных мест',en:'Seats'}, min:0 },
   { id:'coffee', type:'number', half:true, l:{ru:'Кофепоинтов',en:'Coffee points'}, min:0 },
   { id:'kitEq', type:'chips', show:a => a.kitchen && a.kitchen!=='no', l:{ru:'Оборудование кухни',en:'Kitchen equipment'}, opts:[op('fridge','Холодильники','Fridges'), op('micro','СВЧ-печи','Microwaves'), op('dish','Посудомоечная машина','Dishwasher'), op('coffee','Кофемашина','Coffee machine'), op('oven','Плита / духовой шкаф','Hob / oven'), op('water','Кулер / фильтр','Water cooler')] },
   { id:'printers', type:'number', half:true, l:{ru:'Принтерных зон',en:'Print rooms'}, min:0 },
   { id:'archive', type:'number', half:true, l:{ru:'Архив, пог. м стеллажей',en:'Archive, linear m of shelving'}, min:0 },
   { id:'storeA', type:'number', half:true, l:{ru:'Склад, м²',en:'Storage, m²'}, min:0 },
   { id:'wardrobe', type:'seg', l:{ru:'Гардероб сотрудников',en:'Staff cloakroom'}, opts:[op('room','Отдельная гардеробная','Separate cloakroom'), op('zones','Шкафы в рабочих зонах','Wardrobes in work zones'), op('lockers','В локерах','In lockers')] },
   { id:'it', type:'seg', l:{ru:'IT-помещение',en:'IT room'}, opts:[op('no','Не нужно','Not needed'), op('cross','Кроссовая','Comms room'), op('server','Серверная','Server room')] },
   { id:'racks', type:'number', half:true, show:a => a.it==='server', l:{ru:'Серверных стоек',en:'Server racks'}, min:0 }
 ]},
 { id:'special', modes:'f', t:{ru:'Особые требования',en:'Special requirements'}, sub:{ru:'Всё, что влияет на планировку помимо рабочих мест.',en:'Anything beyond workplaces that affects the layout.'}, fields:[
   roomsField,
   { id:'reqs', type:'chips', l:{ru:'Нужно предусмотреть',en:'Include'}, opts:[op('mgn','Доступность для маломобильных','Accessibility'), op('bike','Велопарковка','Bike parking'), op('pets','Pet-friendly','Pet-friendly')] },
   { id:'reqsText', type:'textarea', l:{ru:'Подробности',en:'Details'}, ph:{ru:'Например: серверная с отдельным кондиционированием, переговорная для совета директоров…',en:'E.g. server room with dedicated cooling, board room…'} }
 ]},
 { id:'standard', modes:'f', t:{ru:'Стандарт и бюджет',en:'Standard & budget'}, sub:{ru:'Уровень отделки, мебель и приоритеты.',en:'Finish level, furniture and priorities.'}, fields:[
   { id:'level', type:'seg', cards:1, l:{ru:'Уровень отделки',en:'Finish level'}, opts:[op('base','Базовый','Basic',{ru:'функционально',en:'functional'}), op('mid','Средний','Medium',{ru:'зоны, акустика, свет',en:'zones, acoustics, lighting'}), op('high','Высокий','High',{ru:'представительский',en:'representative'})] },
   { id:'budget', type:'text', half:true, l:{ru:'Ориентир бюджета, ₽/м²',en:'Budget guide, RUB/m²'}, ph:{ru:'например, 110 000',en:'e.g. 110,000'} },
   { id:'brand', type:'seg', l:{ru:'Брендбук / корпоративный стандарт',en:'Brand book / corporate standard'}, opts:[op('yes','Есть — приложу','Yes — will attach'), op('no','Нет','No')] },
   { id:'furniture', type:'seg', l:{ru:'Мебель',en:'Furniture'}, opts:[op('new','Новая','New'), op('own','Перевозим свою','Moving our own'), op('mix','Частично','Partly')] },
   priorityField
 ]},
 { id:'files', modes:'sf', t:{ru:'Планировка и материалы',en:'Plan & materials'}, sub:{ru:'Главное — планировка shell&core. Без неё Test-fit не сделать.',en:'The key item is the shell & core plan. We cannot do a Test-fit without it.'}, fields:[
   { id:'checklist', type:'static' },
   { id:'sc', type:'file', multiple:1, accept:'.dwg,.dxf,.pdf', l:{ru:'Планировка shell&core',en:'Shell & core plan'}, hint:{ru:`DWG / DXF или векторный PDF (не скан) — до ${MAXMB} МБ на файл`,en:`DWG / DXF or vector PDF (not a scan) — up to ${MAXMB} MB per file`}, req:a => !(a.scLink||'').trim(), reqMsg:'needFile' },
   { id:'scLink', type:'url', l:{ru:'Или ссылка на файлы',en:'Or a link to the files'}, ph:{ru:'Яндекс Диск, Google Drive, Dropbox…',en:'Google Drive, Dropbox…'}, hint:{ru:`Если файлы больше ${MAXMB} МБ`,en:`If files are over ${MAXMB} MB`} },
   { id:'tz', type:'file', multiple:1, accept:'', l:{ru:'Ваше ТЗ',en:'Your requirements'}, hint:{ru:'Если есть — в любой форме: Word, Excel, PDF',en:'If you have one — any format: Word, Excel, PDF'} },
   { id:'refs', type:'file', multiple:1, accept:'image/*,.pdf', l:{ru:'Референсы, брендбук, фото',en:'References, brand book, photos'} },
   { id:'wishes', type:'textarea', l:{ru:'Пожелания',en:'Wishes'}, ph:{ru:'Что важно, что точно не нравится, ссылки на примеры…',en:'What matters, what you dislike, links to examples…'} }
 ]},
 { id:'review', modes:'sf', t:{ru:'Проверка и отправка',en:'Review & send'}, fields:[] }
];
const CHECK = [
  {ru:'Колонны и оси с размерами',en:'Columns and grid with dimensions'},
  {ru:'Фасад и витраж с импостами',en:'Façade and curtain wall mullions'},
  {ru:'Ядро с экспликацией помещений',en:'Core with room schedule'},
  {ru:'Лестницы и лифтовые холлы',en:'Stairs and lift lobbies'},
  {ru:'Шахты и пожарные краны',en:'Shafts and fire hose cabinets'},
  {ru:'Конвекторы / радиаторы',en:'Convectors / radiators'}
];

const byId = id => STEPS.find(s => s.id === id);
const merge = (id, modes, t, sub, ids) => ({ id, modes, t, sub, fields: ids.flatMap(i => byId(i).fields) });
/* Порядок шагов: контакты пока не спрашиваем, смежные разделы объединены — меньше кликов */
const FLOW = [
  byId('object'),
  merge('teamSpace','s',{ru:'Параметры пространства',en:'Space parameters'},{ru:'Сколько людей и каким вы видите офис.',en:'Headcount and how you see the office.'},['teamS','spaceS']),
  byId('teamF'),
  merge('workCabs','f',{ru:'Рабочие места и кабинеты',en:'Workplaces & offices'},{ru:'Характер офиса, оснащение мест и перечень кабинетов.',en:'Office character, workplace set-up and private offices.'},['work','cabs']),
  byId('meet'),
  merge('entryService','f',{ru:'Входная группа и сервис',en:'Entrance & services'},{ru:'Приём гостей, кухня, печать, хранение, IT.',en:'Guests, kitchen, printing, storage, IT.'},['entry','service']),
  merge('specialStd','f',{ru:'Особые требования и бюджет',en:'Special requirements & budget'},{ru:'Всё, что влияет на планировку, уровень отделки и приоритеты.',en:'Anything that affects the layout, finish level and priorities.'},['special','standard']),
  byId('files'),
  byId('review')
];
const steps = () => FLOW.filter(s => s.modes.includes(S.mode === 'f' ? 'f' : 's'));
const visible = f => !f.show || f.show(S.a);
const isReq = f => typeof f.req === 'function' ? f.req(S.a) : !!f.req;

/* ---------- helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtSize = b => b > 1048576 ? (b/1048576).toFixed(1).replace('.', ',')+' МБ' : Math.max(1, Math.round(b/1024))+' КБ';
let saveTimer;
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const ok = store.set({ lang:S.lang, mode:S.mode, step:S.step, a:S.a, maxStep:S.maxStep });
    const el = $('#saveState'); if (el && ok && view==='wiz'){ el.textContent = t('saved'); clearTimeout(el._t); el._t = setTimeout(()=>el.textContent='', 1800); }
  }, 300);
}
function setProgress(){
  const bar = $('#progressBar'); if (!bar) return;
  if (view !== 'wiz'){ bar.style.width = view==='done' ? '100%' : '0'; return; }
  const n = steps().length; bar.style.width = Math.round((S.step+1)/n*100)+'%';
}

/* ---------- render ---------- */
const app = $('#app');
function render(){
  document.documentElement.lang = S.lang;
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang===S.lang));
  $('#footNote').textContent = t('foot');
  document.body.classList.toggle('in-wiz', view!=='intro' && view!=='cab');
  document.body.classList.toggle('is-done', view==='done');
  document.body.classList.toggle('in-cab', view==='cab');
  updateCabBtn();
  if (view==='intro') renderIntro();
  else if (view==='wiz') renderWiz();
  else if (view==='cab') renderCab();
  setProgress();
}

function renderIntro(){
  const has = S.mode && Object.keys(S.a).length > 0;
  app.innerHTML = `
  <section class="intro">
    <p class="eyebrow">${t('eyebrow')}</p>
    <h1>${t('h1')}</h1>
    <p class="lead">${t('lead')}</p>
    ${has ? `<div class="resume"><span>${t('resume')}</span><button class="btn" data-act="resume">${t('cont')}</button><button class="link" data-act="reset">${t('reset')}</button></div>` : ''}
    <div class="modes">
      <button class="mode" data-mode="s"><span class="tag">${t('shortTag')}</span><h3>${t('shortT')}</h3><p>${t('shortP')}</p><span class="go">${t('start')}</span></button>
      <button class="mode dark" data-mode="f"><span class="tag">${t('fullTag')}</span><h3>${t('fullT')}</h3><p>${t('fullP')}</p><span class="go">${t('start')}</span></button>
    </div>
    <div class="need"><h4>${t('needH')}</h4><ul><li><span>${t('need1')}</span></li><li><span>${t('need2')}</span></li><li><span>${t('need3')}</span></li></ul></div>
  </section>`;
}

function fieldHTML(f){
  const v = S.a[f.id];
  const req = isReq(f) ? `<span class="req">*</span>` : '';
  const lab = f.l ? `<label for="f_${f.id}">${esc(L(f.l))}${req}</label>` : '';
  const lbl = f.l ? `<div class="lbl">${esc(L(f.l))}${req}</div>` : '';
  const hint = f.hint ? `<div class="hint">${esc(L(f.hint))}</div>` : '';
  const err = `<div class="err"></div>`;
  const ph = f.ph ? ` placeholder="${esc(L(f.ph))}"` : '';
  switch (f.type){
    case 'text': case 'email': case 'tel': case 'url': case 'number': case 'month':
      return `<div class="f" data-f="${f.id}">${lab}${hint}<input id="f_${f.id}" type="${f.type}" value="${esc(v ?? '')}"${ph}${f.auto?` autocomplete="${f.auto}"`:''}${f.type==='number'?` inputmode="numeric" min="${f.min??0}"`:''}>${err}</div>`;
    case 'textarea':
      return `<div class="f" data-f="${f.id}">${lab}${hint}<textarea id="f_${f.id}"${ph}>${esc(v ?? '')}</textarea>${err}</div>`;
    case 'check':
      return `<div class="f${f.hint?' opt':''}" data-f="${f.id}"><label class="check"><input type="checkbox" id="f_${f.id}" ${v?'checked':''}><span>${esc(L(f.l))}${f.hint?`<small>${esc(L(f.hint))}</small>`:''}</span></label></div>`;
    case 'seg': case 'chips': {
      if (f.desk) return deskHTML(f, v, lbl, hint, err);
      const multi = f.type==='chips';
      const sel = multi ? (v || []) : v;
      const btn = o => {
        const on = multi ? sel.includes(o.v) : sel===o.v;
        return `<button type="button" class="${multi?'chip ':''}${on?'on':''}" data-v="${esc(o.v)}" aria-pressed="${on}">${esc(L(o.l))}${o.s?`<small>${esc(L(o.s))}</small>`:''}</button>`;
      };
      if (f.groups) return `<div class="f" data-f="${f.id}">${lbl}${hint}${f.groups.map(g => `<div class="cgroup"><div class="cg-l">${esc(L(g.g))}</div><div class="seg" role="group">${g.opts.map(btn).join('')}</div></div>`).join('')}${err}</div>`;
      const btns = f.opts.map(btn).join('');
      return `<div class="f" data-f="${f.id}">${lbl}${hint}<div class="seg${f.cards?' cards':''}" role="group">${btns}</div>${err}</div>`;
    }
    case 'range': {
      if (v == null) S.a[f.id] = f.def;
      if (f.split) return splitHTML(f, lbl, hint);
      const val = S.a[f.id];
      return `<div class="f" data-f="${f.id}">${lbl}${hint}<div class="range"><div class="val">${esc(f.fmt(val))}</div><input id="f_${f.id}" type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${val}">${f.ticks?`<div class="ticks" aria-hidden="true">${Array.from({length:(f.max-f.min)/f.step+1},(_,k)=>{const tv=f.min+k*f.step;return `<span class="${tv===val?'on':''}" data-t="${tv}">${tv}%</span>`;}).join('')}</div>`:''}<div class="ends"><span>${esc(L(f.ends[0]))}</span><span>${esc(L(f.ends[1]))}</span></div></div></div>`;
    }
    case 'counters': {
      const o = v || {};
      return `<div class="f" data-f="${f.id}">${lbl}${hint}<div class="counters">${f.items.map(it => `<div class="ctr"><div class="cl">${esc(L(it.l))}</div><div class="cc"><button type="button" data-d="-1" data-k="${it.id}" aria-label="−">−</button><output>${o[it.id]||0}</output><button type="button" data-d="1" data-k="${it.id}" aria-label="+">+</button></div></div>`).join('')}</div></div>`;
    }
    case 'table': {
      const rows = (v && v.length) ? v : [{}];
      const cols = f.cols.map(c => c.w).join(' ') + ' 36px';
      const head = `<div class="tr th" style="grid-template-columns:${cols}">${f.cols.map(c=>`<div>${esc(L(c.l))}</div>`).join('')}<div></div></div>`;
      const body = rows.map((r,i) => `<div class="tr" style="grid-template-columns:${cols}">${f.cols.map(c=>`<input type="${c.num?'number':'text'}" ${c.num?'inputmode="numeric" min="0"':''} data-r="${i}" data-c="${c.id}" value="${esc(r[c.id]??'')}" aria-label="${esc(L(c.l))}"${c.ph?` placeholder="${esc(L(c.ph))}"`:''}>`).join('')}<button type="button" class="x" data-del="${i}" aria-label="×">×</button></div>`).join('');
      const sum = f.sumCol ? rows.reduce((s,r)=>s+(+r[f.sumCol]||0),0) : 0;
      return `<div class="f" data-f="${f.id}">${lbl}${hint}<div class="tbl">${head}${body}</div><button type="button" class="add">${t('add')}</button>${f.sumCol?`<div class="tsum">${t('total')}: <b>${sum}</b></div>`:''}</div>`;
    }
    case 'file': {
      const list = (FILES[f.id]||[]).map((fl,i) => {
        const ext = (fl.name.split('.').pop()||'').slice(0,4);
        const big = fl.size > MAXMB*1048576;
        return `<li><span class="ext">${esc(ext)}</span><span class="nm">${esc(fl.name)}${big?`<span class="warn">${t('tooBig')}</span>`:''}</span><span class="sz">${fmtSize(fl.size)}</span><button type="button" data-rm="${i}" aria-label="×">×</button></li>`;
      }).join('');
      return `<div class="f" data-f="${f.id}">${lbl}${hint}<label class="drop"><input type="file" ${f.multiple?'multiple':''} ${f.accept?`accept="${f.accept}"`:''}><b>${t('dropB')}</b><span>${t('dropS')}</span></label><ul class="files">${list}</ul>${err}</div>`;
    }
    case 'note':
      return `<p class="fnote">${esc(L(f.t))}</p>`;
    case 'static':
      return `<div class="cl-box"><h5>${t('clH')}</h5><ul>${CHECK.map(c=>`<li>${esc(L(c))}</li>`).join('')}</ul></div>`;
  }
  return '';
}

function splitHTML(f, lbl, hint){
  const cab = S.a[f.id], os = 100 - cab;
  const ticks = Array.from({length:11}, (_,k) => `<i style="left:${k*10}%"></i>`).join('');
  return `<div class="f" data-f="${f.id}">${lbl}${hint}
    <div class="split">
      <div class="split-bar">
        <div class="sp-os${os<16?' tight':''}" style="width:${os}%"><b>${os} %</b></div>
        <div class="sp-cab${cab<16?' tight':''}"><b>${cab} %</b></div>
        <div class="sp-handle" style="left:${os}%"><span></span></div>
        <input type="range" id="f_${f.id}" min="0" max="100" step="10" value="${os}" aria-label="${esc(L({ru:'Доля open space, %',en:'Open space share, %'}))}" aria-valuetext="${esc(f.fmt(cab))}">
      </div>
      <div class="split-ticks" aria-hidden="true">${ticks}</div>
      <div class="split-lg"><span><i class="lg-os"></i>Open space <b class="v-os">${os} %</b></span><span>${esc(L({ru:'Кабинеты',en:'Private offices'}))} <b class="v-cab">${cab} %</b><i class="lg-cab"></i></span></div>
    </div></div>`;
}
function updateSplit(fEl, f, os){
  const cab = 100 - os; S.a[f.id] = cab;
  const a = fEl.querySelector('.sp-os'), b = fEl.querySelector('.sp-cab');
  a.style.width = os + '%'; a.classList.toggle('tight', os < 16); b.classList.toggle('tight', cab < 16);
  a.querySelector('b').textContent = os + ' %'; b.querySelector('b').textContent = cab + ' %';
  fEl.querySelector('.sp-handle').style.left = os + '%';
  fEl.querySelector('.v-os').textContent = os + ' %'; fEl.querySelector('.v-cab').textContent = cab + ' %';
  fEl.querySelector('input').setAttribute('aria-valuetext', f.fmt(cab));
}
function deskSVG(o){
  // масштаб 1 : 20 (1 ед. = 20 мм); общий для всех вариантов
  const k = 20, W = 1700/k, cx = W/2;
  const w = o.w/k, d = o.d/k, x = cx - w/2, y = 14;
  const chW = 620/k, chD = 560/k, chY = y + d - 6;
  const zone = 800/k;                       // зона кресла 800 мм
  const H = y + 900/k + zone + 6;
  return `<svg class="desk-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <line class="dim" x1="${x}" y1="6" x2="${x+w}" y2="6"/><line class="dim" x1="${x}" y1="3" x2="${x}" y2="9"/><line class="dim" x1="${x+w}" y1="3" x2="${x+w}" y2="9"/>
    <rect class="zone" x="${x}" y="${y+d}" width="${w}" height="${zone}" rx="2"/>
    <rect class="top" x="${x}" y="${y}" width="${w}" height="${d}" rx="1.5"/>
    <line class="mon" x1="${cx-12}" y1="${y+5}" x2="${cx+12}" y2="${y+5}"/>
    <rect class="chair" x="${cx-chW/2}" y="${chY}" width="${chW}" height="${chD}" rx="7"/>
    <path class="chair" d="M${cx-chW/2+4} ${chY+chD-4} h${chW-8}" />
  </svg>`;
}
function deskHTML(f, v, lbl, hint, err){
  const cards = f.opts.map(o => {
    const on = v === o.v;
    const pic = o.w ? deskSVG(o) : `<div class="desk-q">?</div>`;
    return `<button type="button" class="desk${on?' on':''}" data-v="${esc(o.v)}" aria-pressed="${on}">
      <span class="desk-pic">${pic}</span>
      <span class="desk-tag">${esc(L(o.tag))}</span>
      <span class="desk-t">${esc(L(o.l))}${o.w?` <i>${L({ru:'мм',en:'mm'})}</i>`:''}</span>
      <span class="desk-m">${esc(L(o.m2))}</span>
      <span class="desk-e">${esc(L(o.eff))}</span>
    </button>`;
  }).join('');
  return `<div class="f" data-f="${f.id}">${lbl}${hint}<div class="seg desks" role="group">${cards}</div><div class="desk-legend"><span><i class="lg-top"></i>${esc(L({ru:'стол',en:'desk'}))}</span><span><i class="lg-zone"></i>${esc(L({ru:'зона кресла 0,8 м',en:'chair zone 0.8 m'}))}</span><span>${esc(L({ru:'масштаб единый',en:'same scale'}))}</span></div>${err}</div>`;
}

function fieldsHTML(fields){
  let out = '', buf = [];
  const flush = () => { if (buf.length){ out += buf.length>1 ? `<div class="row">${buf.join('')}</div>` : buf[0]; buf = []; } };
  fields.filter(visible).forEach(f => {
    const h = fieldHTML(f);
    if (f.half){ buf.push(h); if (buf.length===2) flush(); }
    else { flush(); out += h; }
  });
  flush();
  return out;
}

const SHORT = { object:{ru:'Объект',en:'Premises'}, teamSpace:{ru:'Параметры',en:'Parameters'}, teamF:{ru:'Параметры',en:'Parameters'},
  workCabs:{ru:'Рабочие места',en:'Workplaces'}, meet:{ru:'Переговорные',en:'Meetings'}, entryService:{ru:'Сервис',en:'Services'},
  specialStd:{ru:'Бюджет',en:'Budget'}, files:{ru:'Файлы',en:'Files'}, review:{ru:'Проверка',en:'Review'} };
let lastSig = '', lastVis = [], lastStep = -1;
const sigOf = () => steps()[S.step].fields.filter(visible).map(f => f.id + (isReq(f) ? '*' : '')).join('|');

function renderWiz(){
  const st = steps(); S.step = Math.min(S.step, st.length-1);
  let root = $('#wizRoot');
  if (!root || root.dataset.mode !== S.mode || root.dataset.lang !== S.lang){
    app.innerHTML = `<div class="wiz" id="wizRoot" data-mode="${S.mode}" data-lang="${S.lang}">
      <nav class="tl" id="tl" aria-label="${esc(t('pathL'))}"></nav>
      <div class="stage" id="stage"><div class="track" id="track">${st.map((s,i) => `<section class="card" data-i="${i}"><div class="card-in"></div></section>`).join('')}</div></div>
      <nav class="bbar" id="bbar" aria-label="${esc(t('navL'))}"></nav></div>`;
    buildTimeline(); buildBar();
    st.forEach((_, i) => renderCard(i, false));
    lastStep = -1; setCards(); placeTrack(false);
  } else if (st[S.step].id === 'review') renderCard(S.step, false);
  document.body.classList.add('in-wiz');
  updateTimeline(); updateBar(); setCards(); placeTrack(true);
  lastStep = S.step;
}

/* Карточки шагов: текущая активна, соседние — в дымке; лента сдвигается плавно */
function renderCard(i, soft){
  const st = steps(), s = st[i]; if (!s) return;
  const card = $(`.card[data-i="${i}"]`); if (!card) return;
  const box = card.querySelector('.card-in');
  const prevVis = soft ? lastVis : [];
  const body = s.id==='review' ? reviewHTML() : fieldsHTML(s.fields);
  box.innerHTML = `<div class="card-no">${t('step')} ${i+1} ${t('of')} ${st.length}</div>
    <h2>${esc(s.id==='review'?t('reviewH'):L(s.t))}</h2>
    <p class="sub">${esc(s.id==='review'?t('reviewS'):L(s.sub))}</p>
    <form novalidate onsubmit="return false">${body}</form>`;
  if (i === S.step){
    const vis = s.fields.filter(visible).map(f => f.id);
    if (soft) vis.filter(id => !prevVis.includes(id)).forEach(id => { const el = box.querySelector(`[data-f="${id}"]`); if (el) el.classList.add('appear'); });
    lastVis = vis; lastSig = sigOf();
  }
}
function setCards(){
  document.querySelectorAll('.card').forEach(c => {
    const i = +c.dataset.i, d = i - S.step;
    c.classList.toggle('cur', d===0); c.classList.toggle('prev', d===-1); c.classList.toggle('next', d===1); c.classList.toggle('far', Math.abs(d)>1);
    c.inert = d !== 0; c.setAttribute('aria-hidden', d !== 0);
  });
  const cur = steps()[S.step];
  lastVis = cur.fields.filter(visible).map(f => f.id); lastSig = sigOf();
}
function placeTrack(anim){
  const stage = $('#stage'), track = $('#track'); if (!stage || !track || !track.children.length) return;
  const cw = track.children[0].offsetWidth, gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const x = stage.clientWidth/2 - (S.step*(cw+gap) + cw/2);
  if (!anim){ track.style.transition = 'none'; }
  track.style.transform = `translate3d(${Math.round(x)}px,0,0)`;
  if (!anim){ void track.offsetWidth; track.style.transition = ''; }
}
function buildBar(){
  const st = steps();
  $('#bbar').innerHTML = `<div class="bb-in">
    <button type="button" class="bb-ico" data-act="home" aria-label="${esc(t('homeL'))}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 9.2 10 3.8l6.5 5.4V16a.8.8 0 0 1-.8.8h-3.4v-4.4H7.7v4.4H4.3a.8.8 0 0 1-.8-.8z"/></svg></button>
    <button type="button" class="btn ghost bb-prev" data-act="prev"><span class="ar">←</span><span class="tx">${t('back')}</span></button>
    <ol class="bb-steps">${st.map((s,i) => `<li><button type="button" class="bb-step" data-step="${i}" aria-label="${esc(L(s.t))}"><span class="n">${i+1}</span><span class="l">${esc(L(SHORT[s.id]||s.t))}</span></button></li>`).join('')}</ol>
    <button type="button" class="btn bb-next" data-act="next"></button>
  </div>`;
}
function updateBar(){
  const st = steps(), n = st.length, bar = $('#bbar'); if (!bar) return;
  bar.classList.toggle('hidden', view==='done');
  const pv = bar.querySelector('.bb-prev'); pv.disabled = S.step === 0;
  const nx = bar.querySelector('.bb-next');
  if (S.step === n-1){ nx.dataset.act = 'send'; nx.innerHTML = `<span class="tx">${t('send')}</span><span class="ar">↗</span>`; }
  else { nx.dataset.act = 'next'; nx.innerHTML = `<span class="tx">${S.step===n-2 ? t('review') : t('next')}</span><span class="ar">→</span>`; }
  bar.querySelectorAll('.bb-step').forEach(b => { const i = +b.dataset.step; b.classList.toggle('cur', i===S.step); b.classList.toggle('done', i!==S.step && i<=S.maxStep); b.setAttribute('aria-current', i===S.step ? 'step' : 'false'); });
}
window.addEventListener('resize', () => { if (view==='wiz' || view==='done') placeTrack(false); });

function buildTimeline(){
  const st = steps();
  const nodes = st.map((s,i) => `<li><button type="button" class="tl-node" data-step="${i}" aria-label="${esc(L(s.t))}"><span class="dot"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-4.9"/></svg><b>${i+1}</b></span><span class="lbl">${esc(L(SHORT[s.id]||s.t))}</span></button></li>`).join('');
  $('#tl').innerHTML = `<div class="tl-in">
    <div class="tl-bar"><div class="tl-track"><i class="tl-fill" id="tlFill"></i></div>
      <ol class="tl-nodes">${nodes}<li class="tl-end"><span class="tl-node end"><span class="dot"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.2 14 2.5 10.6 14l-2.4-4.6L2 8.2z"/></svg></span><span class="lbl">${t('endL')}</span></span></li></ol></div>
    <div class="tl-meta"><span id="tlNow"></span><span class="tl-right"><span id="tlLeft"></span><button type="button" class="link" data-act="switch">${S.mode==='f'?t('toShort'):t('toFull')}</button></span></div>
  </div>`;
}

function updateTimeline(){
  const st = steps(), n = st.length;
  const fill = $('#tlFill'); if (fill) fill.style.width = (view==='done' ? 100 : (S.step / n) * 100) + '%';
  document.querySelectorAll('.tl-node[data-step]').forEach(b => {
    const i = +b.dataset.step;
    b.classList.toggle('cur', i===S.step && view!=='done');
    b.classList.toggle('done', view==='done' || (i!==S.step && i<=S.maxStep));
    b.setAttribute('aria-current', i===S.step ? 'step' : 'false');
  });
  const end = $('.tl-node.end'); if (end) end.classList.toggle('done', view==='done');
  const tl = $('#tl'); if (tl) tl.classList.toggle('is-done', view==='done');
  const now = $('#tlNow'); if (now) now.innerHTML = view==='done' ? t('sentL') : `${t('step')} ${S.step+1} ${t('of')} ${n} · <b>${esc(L(st[S.step].t))}</b>`;
  const per = S.mode==='f' ? 2.5 : 1.2;
  const left = Math.max(1, Math.round((n-1-S.step) * per));
  const lf = $('#tlLeft'); if (lf) lf.textContent = view==='done' ? '' : (S.step===n-1 ? t('oneClick') : `≈ ${left} ${t('minLeft')}`);
}

/* Плавное обновление: если набор полей не изменился — правим DOM на месте, без перерисовки */
function refresh(fEl, f){
  if (view !== 'wiz'){ render(); return; }
  if (sigOf() === lastSig && fEl && f){
    if (f.type==='seg' || f.type==='chips'){
      const cur = S.a[f.id];
      fEl.querySelectorAll('[data-v]').forEach(b => { const on = f.type==='chips' ? (cur||[]).includes(b.dataset.v) : cur===b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      fEl.classList.remove('bad');
      return;
    }
    if (f.type==='check') return;
  }
  const cur = steps()[S.step];
  const vis = cur.fields.filter(visible).map(x => x.id);
  if (vis.join('|') === lastVis.join('|')){          // изменилась только обязательность — меняем звёздочки на месте
    cur.fields.filter(visible).forEach(x => {
      const el = app.querySelector(`[data-f="${x.id}"]`); if (!el) return;
      const head = el.querySelector(':scope > label, :scope > .lbl'); if (!head) return;
      let star = head.querySelector('.req');
      if (isReq(x) && !star){ star = document.createElement('span'); star.className = 'req'; star.textContent = '*'; head.appendChild(star); }
      if (!isReq(x) && star){ star.remove(); el.classList.remove('bad'); }
    });
    lastSig = sigOf(); return;
  }
  const y = window.scrollY; renderCard(S.step, true); window.scrollTo(0, y);
}

/* ---------- value formatting (for review & report) ---------- */
function valText(f, ru){
  const v = S.a[f.id]; const LL = ru ? LR : L;
  const optL = x => { const o = f.opts.find(o=>o.v===x); return o ? LL(o.l) : x; };
  switch (f.type){
    case 'check': return v ? (ru?'Да':L({ru:'Да',en:'Yes'})) : '';
    case 'seg': return v ? optL(v) : '';
    case 'chips': return (v&&v.length) ? v.map(optL).join(', ') : '';
    case 'range': return v==null ? '' : (ru ? f.fmtRu(v) : f.fmt(v));
    case 'counters': { const o=v||{}; const p=f.items.filter(i=>o[i.id]).map(i=>`${LL(i.l)} — ${o[i.id]}`); return p.join('; '); }
    case 'table': {
      const rows=(v||[]).filter(r=>Object.values(r).some(x=>String(x??'').trim())); if(!rows.length) return '';
      return rows.map(r=>f.cols.map(c=>r[c.id]).filter(x=>String(x??'').trim()).join(' · ')).join('\n');
    }
    case 'file': return (FILES[f.id]||[]).map(x=>`${x.name} (${fmtSize(x.size)})`).join('\n');
    case 'static': case 'note': return '';
    default: return v==null ? '' : String(v).trim();
  }
}
function reviewHTML(){
  const st = steps().filter(s=>s.id!=='review');
  const secs = st.map((s,i) => {
    const rows = s.fields.filter(f=>visible(f)&&f.type!=='static'&&f.type!=='note').map(f=>({f, v:valText(f,false)})).filter(x=>x.v);
    return `<div class="rv"><h3>${esc(L(s.t))}<button type="button" class="link" data-step="${i}">${t('edit')}</button></h3>${rows.length?`<dl>${rows.map(x=>`<dt>${esc(L(x.f.l)||'')}</dt><dd>${esc(x.v)}</dd>`).join('')}</dl>`:`<div class="empty">${t('empty')}</div>`}</div>`;
  }).join('');
  return secs;
}

/* ---------- validation ---------- */
function validateStep(i, mark=true){
  const s = steps()[i]; let ok = true, first = null;
  s.fields.filter(visible).forEach(f => {
    let msg = '';
    const v = S.a[f.id];
    if (isReq(f)){
      if (f.type==='file'){ if (!(FILES[f.id]||[]).some(x=>x.size<=MAXMB*1048576)) msg = t(f.reqMsg||'required'); }
      else if (v==null || String(v).trim()==='' || (Array.isArray(v)&&!v.length)) msg = t('required');
    }
    if (!msg && f.type==='email' && v && !/^\S+@\S+\.\S+$/.test(v)) msg = t('badEmail');
    if (mark){
      const el = app.querySelector(`[data-f="${f.id}"]`);
      if (el){ el.classList.toggle('bad', !!msg); const e = el.querySelector('.err'); if (e) e.textContent = msg; if (msg && !first) first = el; }
    }
    if (msg) ok = false;
  });
  if (first){ first.scrollIntoView({behavior:'smooth', block:'center'}); const inp = first.querySelector('input,textarea,button'); if (inp) setTimeout(()=>inp.focus({preventScroll:true}), 300); }
  return ok;
}

/* ---------- events ---------- */
function fieldById(id){ for (const s of STEPS) for (const f of s.fields) if (f.id===id) return f; return null; }
function go(i){ const n = steps().length; if (i < 0 || i >= n) return; S.step = i; S.maxStep = Math.max(S.maxStep, i); save(); render(); if (window.scrollY > 0) window.scrollTo({top:0, behavior:'smooth'}); }
function rerenderKeepFocus(){ refresh(); }

document.addEventListener('click', e => {
  const b = e.target.closest('button, a[data-go]'); if (!b) return;
  if (b.dataset.lang){ S.lang = b.dataset.lang; save(); render(); return; }
  if (b.dataset.go==='intro'){ e.preventDefault(); leaveCab(); view='intro'; render(); return; }
  if (cabClick(b, e)) return;
  if (b.dataset.mode){ S.mode = b.dataset.mode; S.step = 0; S.maxStep = Math.max(S.maxStep,0); view='wiz'; save(); render(); window.scrollTo(0,0); return; }
  const act = b.dataset.act;
  if (act==='resume'){ view='wiz'; render(); return; }
  if (act==='reset'){ if (!confirmReset()) return; S = { lang:S.lang, mode:null, step:0, a:{}, maxStep:0 }; for (const k in FILES) delete FILES[k]; store.del(); render(); return; }
  if (act==='home'){ leaveCab(); view='intro'; render(); window.scrollTo(0,0); return; }
  if (act==='prev'){ go(S.step-1); return; }
  if (act==='next'){ if (validateStep(S.step)) go(S.step+1); return; }
  if (act==='switch'){ const curId = steps()[S.step].id; S.mode = S.mode==='f'?'s':'f'; const st = steps(); const alias = {teamSpace:'teamF', teamF:'teamSpace'}; let j = st.findIndex(s=>s.id===curId); if (j<0) j = st.findIndex(s=>s.id===alias[curId]); S.step = j>=0?j:0; S.maxStep = Math.max(S.step, Math.min(S.maxStep, st.length-1)); save(); render(); return; }
  if (act==='send'){ submit(); return; }
  if (act==='retry'){ submit(); return; }
  if (act==='again'){ S = { lang:S.lang, mode:null, step:0, a:{}, maxStep:0 }; for (const k in FILES) delete FILES[k]; store.del(); view='intro'; render(); return; }
  if (act==='dl'){ download('brief.md', buildMD(), 'text/markdown'); return; }
  if (b.dataset.step != null){ go(+b.dataset.step); return; }

  const fEl = b.closest('[data-f]'); if (!fEl) return;
  const f = fieldById(fEl.dataset.f); if (!f) return;
  if (f.type==='seg' && b.dataset.v != null){ S.a[f.id] = S.a[f.id]===b.dataset.v ? null : b.dataset.v; save(); refresh(fEl, f); return; }
  if (f.type==='chips' && b.dataset.v != null){
    const arr = (S.a[f.id]||[]).slice(); const k = arr.indexOf(b.dataset.v);
    if (k>=0) arr.splice(k,1); else { arr.push(b.dataset.v); if (f.max && arr.length>f.max) arr.shift(); }
    S.a[f.id] = arr; save(); refresh(fEl, f); return;
  }
  if (f.type==='counters' && b.dataset.k){ const o = Object.assign({}, S.a[f.id]); o[b.dataset.k] = Math.max(0, (o[b.dataset.k]||0) + (+b.dataset.d)); S.a[f.id] = o; save(); b.parentElement.querySelector('output').textContent = o[b.dataset.k]; return; }
  if (f.type==='table'){
    const rows = (S.a[f.id]&&S.a[f.id].length) ? S.a[f.id].slice() : [{}];
    if (b.classList.contains('add')){ rows.push({}); S.a[f.id]=rows; save(); rerenderKeepFocus(); const ins = fEl.parentElement.querySelectorAll(`[data-f="${f.id}"] .tr:last-child input`); if (ins[0]) ins[0].focus(); return; }
    if (b.dataset.del != null){ rows.splice(+b.dataset.del,1); S.a[f.id]=rows.length?rows:[{}]; save(); rerenderKeepFocus(); return; }
  }
  if (f.type==='file' && b.dataset.rm != null){ FILES[f.id].splice(+b.dataset.rm,1); rerenderKeepFocus(); return; }
});
function confirmReset(){ return true; }

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id==='f__consent'){ S.a._consent = el.checked; save(); const s = app.querySelector('[data-act="send"]'); if (s) s.disabled = !el.checked; return; }
  const fEl = el.closest('[data-f]'); if (!fEl) return;
  const f = fieldById(fEl.dataset.f); if (!f) return;
  if (f.type==='table'){
    const rows = (S.a[f.id]&&S.a[f.id].length) ? S.a[f.id].slice() : [{}];
    const r = +el.dataset.r; rows[r] = Object.assign({}, rows[r], {[el.dataset.c]: el.value}); S.a[f.id] = rows; save();
    if (f.sumCol){ const s = fEl.querySelector('.tsum b'); if (s) s.textContent = rows.reduce((a,x)=>a+(+x[f.sumCol]||0),0); }
    return;
  }
  if (f.type==='file') return;
  if (f.type==='check'){ S.a[f.id] = el.checked; save(); refresh(fEl, f); return; }
  if (f.type==='range' && f.split){ updateSplit(fEl, f, +el.value); save(); return; }
  if (f.type==='range'){ S.a[f.id] = +el.value; fEl.querySelector('.val').textContent = f.fmt(+el.value); fEl.querySelectorAll('.ticks span').forEach(x => x.classList.toggle('on', +x.dataset.t === +el.value)); save(); return; }
  S.a[f.id] = el.value; save();
  if (fEl.classList.contains('bad') && String(el.value).trim()){ fEl.classList.remove('bad'); }
  if (f.id==='scLink'){ const sc = app.querySelector('[data-f="sc"] .req'); if (sc) sc.style.visibility = el.value.trim() ? 'hidden' : ''; }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || view !== 'wiz' || e.shiftKey || e.isComposing) return;
  const el = e.target; if (!el || el.tagName !== 'INPUT' || ['checkbox','file','range'].includes(el.type)) return;
  e.preventDefault(); const nx = app.querySelector('[data-act="next"]'); if (nx) nx.click();
});
document.addEventListener('change', e => {
  const el = e.target; if (el.type!=='file') return;
  const fEl = el.closest('[data-f]'); if (!fEl) return; addFiles(fEl.dataset.f, el.files); el.value='';
});
function addFiles(id, list){
  FILES[id] = (FILES[id]||[]).concat(Array.from(list||[]));
  const f = fieldById(id); if (!f.multiple) FILES[id] = FILES[id].slice(-1);
  rerenderKeepFocus();
}
['dragenter','dragover'].forEach(ev => document.addEventListener(ev, e => { const d = e.target.closest && e.target.closest('.drop'); if (d){ e.preventDefault(); d.classList.add('over'); } }));
['dragleave','drop'].forEach(ev => document.addEventListener(ev, e => { const d = e.target.closest && e.target.closest('.drop'); if (d){ e.preventDefault(); d.classList.remove('over'); if (ev==='drop') addFiles(d.closest('[data-f]').dataset.f, e.dataTransfer.files); } }));
let tx0 = null, ty0 = 0;
document.addEventListener('touchstart', e => { if (!e.target.closest('#stage') || e.target.closest('input,textarea,.split-bar')) { tx0 = null; return; } tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, {passive:true});
document.addEventListener('touchend', e => {
  if (tx0 == null || view !== 'wiz') return;
  const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0; tx0 = null;
  if (Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
  if (dx < 0){ if (S.step < steps().length-1 && validateStep(S.step)) go(S.step+1); } else go(S.step-1);
}, {passive:true});
window.addEventListener('scroll', () => { const h = $('.top'); if (h) h.classList.toggle('scrolled', window.scrollY > 4); }, {passive:true});

/* ---------- report ---------- */
function reportSections(){
  return steps().filter(s=>s.id!=='review').map(s => ({
    title: LR(s.t),
    rows: s.fields.filter(f=>visible(f)&&f.type!=='static'&&f.type!=='note').map(f => ({ f, label: LR(f.l), value: valText(f, true) })).filter(r => r.value)
  }));
}
const today = () => { const d = new Date(); return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}); };
function mdTable(f){
  const rows = (S.a[f.id]||[]).filter(r=>Object.values(r).some(x=>String(x??'').trim()));
  const head = '| ' + f.cols.map(c=>LR(c.l)).join(' | ') + ' |\n|' + f.cols.map(()=>'---').join('|') + '|\n';
  let out = head + rows.map(r => '| ' + f.cols.map(c=>String(r[c.id]??'').replace(/\|/g,'/')).join(' | ') + ' |').join('\n');
  if (f.sumCol) out += `\n\nИтого: ${rows.reduce((a,x)=>a+(+x[f.sumCol]||0),0)}`;
  return out;
}
function buildMD(){
  const a = S.a;
  const nm = [a.company,a.bc].filter(Boolean).join(', ');
  let md = `# Бриф на Test-fit офиса${nm ? ' — '+nm : ''}\n\n`;
  md += `- Формат брифа: ${S.mode==='f'?'расширенный':'сокращённый'}\n- Дата: ${today()}\n- Объект: ${[a.bc,a.address,a.floor].filter(Boolean).join(', ') || (a.objInFiles ? 'см. приложенные файлы' : '—')}\n- Язык заполнения: ${S.lang.toUpperCase()}\n\n`;
  reportSections().forEach((s,i) => {
    md += `## ${i+1}. ${s.title}\n\n`;
    const tables = [];
    s.rows.forEach(r => { if (r.f.type==='table') tables.push(r); else md += `- **${r.label}:** ${r.value.replace(/\n/g,'; ')}\n`; });
    tables.forEach(r => { md += `\n**${r.label}**\n\n${mdTable(r.f)}\n`; });
    if (!s.rows.length) md += `_не заполнено_\n`;
    md += '\n';
  });
  md += `---\nДля Test-fit: исходные данные — планировка shell&core (раздел «Планировка и материалы»); перед планировкой выполнить детальный разбор S&C и карту примыканий перегородок к фасаду.\n`;
  return md;
}
function buildHTML(){
  const a = S.a;
  const sec = reportSections().map((s,i) => `<h2>${i+1}. ${esc(s.title)}</h2>` + (s.rows.length ? `<table>${s.rows.map(r => r.f.type==='table'
      ? `<tr><th>${esc(r.label)}</th><td>${tableHTML(r.f)}</td></tr>`
      : `<tr><th>${esc(r.label)}</th><td>${esc(r.value).replace(/\n/g,'<br>')}</td></tr>`).join('')}</table>` : `<p class="e">не заполнено</p>`)).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11pt;margin:28px}
  h1{font-size:20pt;margin:0 0 4px} .m{color:#777;margin:0 0 18px} h2{font-size:12pt;margin:20px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}
  table{border-collapse:collapse;width:100%} th{width:36%;text-align:left;font-weight:normal;color:#666;vertical-align:top;padding:4px 10px 4px 0} td{padding:4px 0;vertical-align:top}
  table table th,table table td{border:1px solid #ddd;padding:3px 6px;width:auto;color:#111} .e{color:#999}
  </style></head><body><div style="font-weight:bold;font-size:14pt;letter-spacing:-.02em">Pridex</div>
  <h1>Бриф на Test-fit офиса</h1><p class="m">${esc(a.company||'')} · ${esc([a.bc,a.address,a.floor].filter(Boolean).join(', '))} · ${S.mode==='f'?'расширенный':'сокращённый'} · ${today()}</p>${sec}</body></html>`;
}
function tableHTML(f){
  const rows = (S.a[f.id]||[]).filter(r=>Object.values(r).some(x=>String(x??'').trim()));
  return `<table><tr>${f.cols.map(c=>`<th>${esc(LR(c.l))}</th>`).join('')}</tr>${rows.map(r=>`<tr>${f.cols.map(c=>`<td>${esc(r[c.id]??'')}</td>`).join('')}</tr>`).join('')}</table>`;
}
function download(name, text, type){
  const blob = new Blob([text], {type: type+';charset=utf-8'});
  const u = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u), 2000);
}

/* ---------- submit ---------- */
const b64 = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]||''); r.onerror = rej; r.readAsDataURL(file); });
const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
async function post(body){
  // rid делает повтор безопасным: скрипт не выполнит действие дважды
  const payload = JSON.stringify(Object.assign({ rid: rid() }, body));
  let last;
  for (let i = 0; i < 4; i++){
    try {
      const r = await fetch(ENDPOINT(), { method:'POST', body: payload });   // text/plain → без preflight
      const j = await r.json();
      if (!j.ok) throw Object.assign(new Error(j.error||'error'), { final:true });
      return j;
    } catch(err){ last = err; if (err.final) throw err; await new Promise(res => setTimeout(res, 1500 * (i + 1))); }
  }
  throw last;
}
async function submit(){
  const st = steps();
  for (let i=0;i<st.length-1;i++){ if (!validateStep(i,false)){ go(i); setTimeout(()=>validateStep(i),50); return; } }
  view = 'sending'; setProgress();
  ($('.card.cur .card-in')||app).innerHTML = `<section class="sending"><h2 style="font:700 32px/1.1 var(--display);margin:0">${t('sending')}</h2><div class="bar"><i id="upBar"></i></div><div class="hint" id="upTxt"></div></section>`;
  const md = buildMD();
  if (!ENDPOINT()){
    await new Promise(r=>setTimeout(r,500)); showDone(true, md); return;
  }
  try{
    const up = []; ['sc','tz','refs'].forEach(k => (FILES[k]||[]).forEach(f => { if (f.size <= MAXMB*1048576) up.push({role:k, file:f}); }));
    const total = up.reduce((s,x)=>s+x.file.size,0) || 1; let sent = 0;
    const bar = $('#upBar'), txt = $('#upTxt');
    const init = await post({ action:'init', company:S.a.company||'', bc:S.a.bc||'', key:KEYV });
    for (const x of up){
      txt.textContent = `${t('sendingF')}: ${x.file.name}`;
      await post({ action:'file', sid:init.sid, role:x.role, name:x.file.name, mime:x.file.type||'application/octet-stream', data: await b64(x.file) });
      sent += x.file.size; bar.style.width = Math.round(sent/total*90)+'%';
    }
    const fin = await post({ action:'finish', sid:init.sid, key:KEYV, md, html: buildHTML(), answers:S.a, mode:S.mode, lang:S.lang,
                 contact:{ company:S.a.company||S.a.bc, name:S.a.name, email:S.a.email, phone:S.a.phone } });
    bar.style.width='100%'; CAB.jobs = null; if (fin.id) CAB.sel = fin.id; showDone(false);
  } catch(err){
    console.error(err);
    ($('.card.cur .card-in')||app).innerHTML = `<section class="sending"><h2 style="font:700 28px/1.2 var(--display);margin:0 0 14px">${t('errSend')}</h2><div class="nav" style="border:0"><button class="btn" data-act="retry">${t('retry')}</button><button class="btn ghost" data-act="dl">${t('dl')}</button></div></section>`;
    view = 'wiz';
  }
}
function showDone(demo, md){
  view = 'done'; setProgress(); updateTimeline(); document.body.classList.add('is-done');
  const host = $('.card.cur .card-in') || app; updateBar();
  host.innerHTML = `<section class="done"><div class="ok">✓</div><h1 style="font-size:clamp(32px,5vw,48px)">${t('doneH')}</h1><p class="lead">${KEYV && !demo ? t('doneK') : t('doneP')}</p>${demo?`<div class="note">${t('demo')}</div><details class="mdv"><summary>brief.md</summary><pre>${esc(md||'')}</pre></details>`:''}<div class="nav" style="border:0;justify-content:flex-start;gap:16px;flex-wrap:wrap">${hasCab()?`<button class="btn" data-act="cab">${t('cabGo')} →</button>`:''}<button class="btn ghost" data-act="dl">${t('dl')}</button><button class="link" data-act="again">${t('newBrief')}</button></div></section>`;
  if (!demo){ const keepLang = S.lang; store.del(); S.lang = keepLang; }
}

/* ---------- кабинет сотрудника ---------- */
const KKEY = 'pridex-key';
const kstore = {
  get(){ try { return localStorage.getItem(KKEY) || ''; } catch(e){ return ''; } },
  set(v){ try { v ? localStorage.setItem(KKEY, v) : localStorage.removeItem(KKEY); } catch(e){} }
};
let KEYV = kstore.get();
(function takeKeyFromUrl(){
  try {
    const u = new URL(location.href); const k = u.searchParams.get('k');
    if (k){ KEYV = k.trim(); kstore.set(KEYV); u.searchParams.delete('k'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  } catch(e){}
})();
const CT = {
  cabBtn:{ru:'Мои заявки',en:'My requests'}, cabEy:{ru:'Pridex · кабинет',en:'Pridex · workspace'},
  cabH:{ru:'Мои заявки',en:'My requests'}, cabNew:{ru:'Новый бриф',en:'New brief'},
  cabAll:{ru:'Все',en:'All'}, cabAct:{ru:'Ждут вас',en:'Need you'}, cabWork:{ru:'В работе',en:'In progress'}, cabDone:{ru:'Принято',en:'Accepted'},
  cabEmpty:{ru:'Заявок пока нет. Заполните бриф — он появится здесь со статусом.',en:'No requests yet. Fill in a brief and it will appear here with its status.'},
  cabNone:{ru:'В этом фильтре пусто',en:'Nothing here'},
  cabPick:{ru:'Выберите заявку слева',en:'Select a request'},
  upd:{ru:'обновлено',en:'updated'}, ver:{ru:'Версия',en:'Version'}, prevV:{ru:'Предыдущие версии',en:'Previous versions'},
  res:{ru:'Результаты',en:'Results'}, noRes:{ru:'Файлов пока нет — появятся, когда Claude закончит.',en:'No files yet — they will appear when Claude is done.'},
  hist:{ru:'История',en:'History'}, dlF:{ru:'Скачать',en:'Download'},
  fbH:{ru:'Замечания к версии',en:'Comments on version'}, ansH:{ru:'Ваш ответ',en:'Your answer'}, reopenH:{ru:'Нужны ещё правки?',en:'Need more changes?'},
  fbPh:{ru:'Что поправить? Например: переговорную на 12 мест перенести к ядру, добавить 2 кабинета у фасада…',en:'What to change? E.g. move the 12-seat meeting room next to the core, add 2 offices by the façade…'},
  ansPh:{ru:'Ответ на вопрос Claude',en:'Answer to Claude’s question'},
  attach:{ru:'Приложить разметку',en:'Attach markup'}, sendFb:{ru:'Отправить замечания',en:'Send comments'}, sendAns:{ru:'Ответить',en:'Reply'},
  accept:{ru:'Принять Test-fit',en:'Accept Test-fit'}, sentOk:{ru:'Отправлено — Claude подхватит при следующем запуске',en:'Sent — Claude will pick it up on the next run'},
  accOk:{ru:'Test-fit принят',en:'Test-fit accepted'},
  hint_new:{ru:'Заявка в очереди. Claude проверяет новые заявки каждый час.',en:'Queued. Claude checks new requests every hour.'},
  hint_work:{ru:'Claude готовит Test-fit. Когда будет готово, придёт письмо.',en:'Claude is preparing the Test-fit. You’ll get an email when it’s ready.'},
  hint_feedback:{ru:'Замечания приняты — Claude готовит следующую версию.',en:'Comments received — Claude is preparing the next version.'},
  hint_ready:{ru:'Готово. Посмотрите файлы и примите вариант или отправьте замечания.',en:'Ready. Review the files, then accept or send comments.'},
  hint_question:{ru:'Claude задал вопрос — ответьте ниже, и работа продолжится.',en:'Claude has a question — reply below to continue.'},
  hint_accepted:{ru:'Вариант принят. Если понадобятся правки — напишите ниже.',en:'Accepted. If you need changes, write below.'},
  hint_error:{ru:'При обработке возникла ошибка — мы уже в курсе.',en:'Processing failed — we have been notified.'},
  loginH:{ru:'Вход в кабинет',en:'Sign in'}, loginP:{ru:'Откройте личную ссылку из письма или вставьте ключ доступа.',en:'Open your personal link from the email or paste your access key.'},
  loginB:{ru:'Войти',en:'Sign in'}, badKey:{ru:'Ключ не подошёл',en:'Invalid key'}, logout:{ru:'Выйти',en:'Sign out'},
  loadErr:{ru:'Не удалось загрузить заявки. Проверьте соединение.',en:'Could not load requests. Check your connection.'},
  demoCab:{ru:'Демо-кабинет: так сотрудник видит заявки после подключения. Действия работают локально.',en:'Demo workspace: this is how requests look once connected. Actions work locally.'},
  demoDl:{ru:'В демо файлы не скачиваются',en:'Files are not downloadable in the demo'},
  back2:{ru:'Все заявки',en:'All requests'},
  s_new:{ru:'Получена',en:'Received'}, s_work:{ru:'В работе',en:'In progress'}, s_ready:{ru:'Готово',en:'Ready'}, s_feedback:{ru:'Замечания',en:'Comments'},
  s_question:{ru:'Нужны уточнения',en:'Question'}, s_accepted:{ru:'Принято',en:'Accepted'}, s_error:{ru:'Ошибка',en:'Error'},
  e_created:{ru:'Заявка создана',en:'Request created'}, e_taken:{ru:'Взята в работу',en:'Taken into work'}, e_result:{ru:'Готова версия',en:'Version ready'},
  e_question:{ru:'Вопрос',en:'Question'}, e_comment:{ru:'Замечания',en:'Comments'}, e_accepted:{ru:'Принято',en:'Accepted'}, e_error:{ru:'Ошибка',en:'Error'},
  tr1:{ru:'Получена',en:'Received'}, tr2:{ru:'В работе',en:'In progress'}, tr3:{ru:'Готово',en:'Ready'}, tr4:{ru:'Принято',en:'Accepted'}
};
Object.assign(T, CT);
T.cabGo = {ru:'Открыть мои заявки',en:'Open my requests'};
T.heldP = {ru:'Рабочие файлы DXF ({n} шт.) откроются после согласования PDF — кнопка «Принять Test-fit».',en:'Working DXF files ({n}) unlock once the PDF is approved — use “Accept Test-fit”.'};
T.doneK = {ru:'Заявка передана в работу — Claude возьмёт её в течение часа. Статус, файлы и замечания — в «Мои заявки», о готовности придёт письмо.',en:'Your request is queued — Claude will pick it up within an hour. Status, files and comments are in “My requests”; you’ll get an email when it’s ready.'};

const setHash = h => { try { history.replaceState(null, '', location.pathname + location.search + h); } catch(e){} };
const CAB = { jobs:null, name:'', sel:null, filter:'all', err:'', busy:false, drafts:{}, att:{}, toast:'', timer:null };
const isDemo = () => !ENDPOINT();
const hasCab = () => !!KEYV || isDemo();
const ACTION = ['ready','question'], WORK = ['new','work','feedback'];
const stage = s => ({new:0, work:1, feedback:1, ready:2, question:2, accepted:3, error:1}[s] ?? 0);
const fdt = iso => { try { return new Date(iso).toLocaleString(S.lang==='ru'?'ru-RU':'en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}); } catch(e){ return ''; } };

function demoJobs(){
  const h = n => new Date(Date.now() - n*3600e3).toISOString();
  return [
    { id:'TF-0007', status:'ready', version:2, object:'БЦ «Сидней Сити», 15 этаж', mode:'расширенный', created:h(30), updated:h(1),
      results:[{v:2, files:[{id:'d1',name:'TF-0007_v2_test-fit.pdf',size:4.2e6,mime:'application/pdf'},{id:'d2',name:'TF-0007_v2_спецификация.pdf',size:.6e6,mime:'application/pdf'}], held:1},
               {v:1, files:[{id:'d3',name:'TF-0007_v1_test-fit.pdf',size:4.0e6,mime:'application/pdf'}]}],
      events:[{at:h(30),who:'Анна',type:'created',v:0,text:'',files:[]},{at:h(29),who:'Claude',type:'taken',v:0,text:'',files:[]},
              {at:h(27),who:'Claude',type:'result',v:1,text:'Вариант 1: 186 рабочих мест, 9 м² NIA/чел., 6 переговорных, 4 кабинета. Перегородки к фасаду — только в импосты.',files:['TF-0007_v1_test-fit.pdf']},
              {at:h(5),who:'Анна',type:'comment',v:1,text:'Переговорную на 12 мест перенести к ядру, у фасада добавить 2 кабинета.',files:['разметка.png']},
              {at:h(1),who:'Claude',type:'result',v:2,text:'Версия 2: переговорная 12 мест у ядра, +2 кабинета по фасаду (оси 3–4, 7–8). Мест — 180.',files:['TF-0007_v2_test-fit.pdf','TF-0007_v2_спецификация.pdf']}] },
    { id:'TF-0008', status:'work', version:0, object:'Лихачёва, 8 — 6 этаж', mode:'сокращённый', created:h(2), updated:h(.5), results:[],
      events:[{at:h(2),who:'Анна',type:'created',v:0,text:'',files:[]},{at:h(.5),who:'Claude',type:'taken',v:0,text:'',files:[]}] },
    { id:'TF-0005', status:'accepted', version:1, object:'БЦ «Neva Towers», блок 2', mode:'сокращённый', created:h(200), updated:h(150),
      results:[{v:1, files:[{id:'d4',name:'TF-0005_v1_test-fit.pdf',size:3.1e6,mime:'application/pdf'}]}],
      events:[{at:h(200),who:'Анна',type:'created',v:0,text:'',files:[]},{at:h(190),who:'Claude',type:'result',v:1,text:'Вариант 1: 64 места, open space 80 %.',files:['TF-0005_v1_test-fit.pdf']},{at:h(150),who:'Анна',type:'accepted',v:1,text:'',files:[]}] }
  ];
}

async function cabLoad(silent){
  if (isDemo()){ if (!CAB.jobs){ CAB.jobs = demoJobs(); CAB.name = 'Анна'; } if (!silent) renderCab(); return; }
  if (!KEYV){ renderCab(); return; }
  if (!silent){ CAB.busy = true; renderCab(); }
  try {
    const r = await post({ action:'list', key:KEYV });
    CAB.jobs = r.jobs; CAB.name = r.name; CAB.err = '';
  } catch(err){
    if (String(err.message) === 'bad key'){ KEYV = ''; kstore.set(''); CAB.err = t('badKey'); }
    else CAB.err = t('loadErr');
  }
  CAB.busy = false;
  if (view === 'cab') renderCab(silent);
}

function openCab(id){
  view = 'cab'; if (id) CAB.sel = id;
  const h = '#cab' + (CAB.sel ? '/' + CAB.sel : ''); if (location.hash !== h) setHash(h);
  render(); window.scrollTo(0, 0);
  cabLoad(!!CAB.jobs);
  clearInterval(CAB.timer);
  CAB.timer = setInterval(() => { if (view === 'cab' && !document.hidden && !isDemo()) cabLoad(true); }, 60000);
}
function leaveCab(){ clearInterval(CAB.timer); if (location.hash.startsWith('#cab')) setHash(''); }

function pill(s){ return `<span class="pill p-${s}"><i></i>${esc(t('s_'+s))}</span>`; }
function counts(){
  const j = CAB.jobs || [];
  return { all:j.length, act:j.filter(x=>ACTION.includes(x.status)).length, work:j.filter(x=>WORK.includes(x.status)).length, done:j.filter(x=>x.status==='accepted').length };
}
function filtered(){
  const j = CAB.jobs || [], f = CAB.filter;
  return f==='act' ? j.filter(x=>ACTION.includes(x.status)) : f==='work' ? j.filter(x=>WORK.includes(x.status)) : f==='done' ? j.filter(x=>x.status==='accepted') : j;
}

function renderCab(soft){
  updateCabBtn();
  if (!isDemo() && !KEYV){
    app.innerHTML = `<section class="cab cab-login"><p class="eyebrow">${t('cabEy')}</p><h1>${t('loginH')}</h1><p class="lead">${t('loginP')}</p>
      <form class="login" data-act-form="login"><input id="cabKey" type="text" autocomplete="off" spellcheck="false" placeholder="••••••••••••"><button class="btn" data-act="cabLogin">${t('loginB')}</button></form>
      ${CAB.err?`<p class="err-t">${esc(CAB.err)}</p>`:''}</section>`;
    return;
  }
  const keepScroll = soft ? ($('.cab-detail')||{}).scrollTop : 0;
  const c = counts(), list = filtered();
  if (CAB.sel && CAB.jobs && !CAB.jobs.some(x=>x.id===CAB.sel)) CAB.sel = null;
  const sel = CAB.jobs && CAB.jobs.find(x=>x.id===CAB.sel);
  app.innerHTML = `<section class="cab${sel?' has-sel':''}">
    <div class="cab-head">
      <div><p class="eyebrow">${t('cabEy')}${CAB.name?` · ${esc(CAB.name)}`:''}</p><h1>${t('cabH')}</h1></div>
      <div class="cab-head-r">${!isDemo()?`<button class="link" data-act="cabLogout">${t('logout')}</button>`:''}<button class="btn" data-act="cabNew">${t('cabNew')} <span aria-hidden="true">＋</span></button></div>
    </div>
    ${isDemo()?`<div class="note cab-demo">${t('demoCab')}</div>`:''}
    ${CAB.err?`<div class="note err-n">${esc(CAB.err)}</div>`:''}
    <div class="cab-tabs" role="tablist">
      ${[['all','cabAll'],['act','cabAct'],['work','cabWork'],['done','cabDone']].map(([k,l]) => `<button role="tab" class="${CAB.filter===k?'on':''}${k==='act'&&c.act?' hot':''}" data-cf="${k}">${t(l)}<b>${c[k]}</b></button>`).join('')}
    </div>
    <div class="cab-grid">
      <div class="cab-list">${CAB.busy && !CAB.jobs ? `<div class="skel"></div><div class="skel"></div><div class="skel"></div>`
        : !(CAB.jobs||[]).length ? `<p class="cab-empty">${t('cabEmpty')}</p>`
        : !list.length ? `<p class="cab-empty">${t('cabNone')}</p>`
        : list.map(jobRow).join('')}</div>
      <div class="cab-detail">${sel ? jobDetail(sel) : `<div class="cab-pick">${t('cabPick')}</div>`}</div>
    </div>
    ${CAB.toast?`<div class="toast" role="status">${esc(CAB.toast)}</div>`:''}
  </section>`;
  if (soft && keepScroll) { const d = $('.cab-detail'); if (d) d.scrollTop = keepScroll; }
  const ta = $('#cabText'); if (ta && sel) ta.value = CAB.drafts[sel.id] || '';
}

function jobRow(x){
  return `<button class="jrow${x.id===CAB.sel?' on':''}${ACTION.includes(x.status)?' act':''}" data-job="${esc(x.id)}">
    <span class="jr-top"><span class="jid">${esc(x.id)}</span>${pill(x.status)}</span>
    <span class="jr-obj">${esc(x.object)}</span>
    <span class="jr-meta">${esc(x.mode)}${x.version?` · v${x.version}`:''} · ${t('upd')} ${fdt(x.updated)}</span></button>`;
}

function track(s){
  const k = stage(s), labels = ['tr1','tr2','tr3','tr4'];
  return `<ol class="jtrack">${labels.map((l,i)=>`<li class="${i<k?'t-done':i===k?'t-cur':''}${i===k&&s==='error'?' t-bad':''}"><i></i><span>${t(l)}</span></li>`).join('')}</ol>`;
}

function fileRow(x, f){
  const ext = (f.name.split('.').pop()||'').slice(0,4).toUpperCase();
  return `<li><span class="ext">${esc(ext)}</span><span class="nm">${esc(f.name)}</span><span class="sz">${f.size?fmtSize(f.size):''}</span>
    <button class="btn ghost sm" data-act="cabDl" data-job="${esc(x.id)}" data-fid="${esc(f.id)}" data-name="${esc(f.name)}">${t('dlF')} ↓</button></li>`;
}

function jobDetail(x){
  const res = x.results || [], last = res[0], older = res.slice(1);
  const canFb = ['ready','question','accepted','error'].includes(x.status);
  const isQ = x.status === 'question';
  const att = CAB.att[x.id] || [];
  const who = e => e.who === 'Claude' ? `<span class="av c">C</span>` : `<span class="av">${esc((e.who||'?').trim().charAt(0).toUpperCase())}</span>`;
  return `<article class="jd">
    <button class="link jd-back" data-act="cabBack">← ${t('back2')}</button>
    <div class="jd-top"><span class="jid">${esc(x.id)} · ${esc(x.mode)}</span>${pill(x.status)}</div>
    <h2>${esc(x.object)}</h2>
    ${track(x.status)}
    <p class="jd-hint">${t('hint_'+x.status)}</p>

    <h3>${t('res')}</h3>
    ${last ? `<div class="vcard"><div class="vh">${t('ver')} ${last.v}</div><ul class="files">${last.files.map(f=>fileRow(x,f)).join('')}</ul>${last.held ? `<p class="held">${t('heldP').replace('{n}', last.held)}</p>` : ''}</div>`
           : `<p class="muted">${t('noRes')}</p>`}
    ${older.length ? `<details class="older"><summary>${t('prevV')} (${older.length})</summary>${older.map(r=>`<div class="vcard old"><div class="vh">${t('ver')} ${r.v}</div><ul class="files">${r.files.map(f=>fileRow(x,f)).join('')}</ul></div>`).join('')}</details>` : ''}

    ${canFb ? `<div class="fb${x.status==='accepted'?' quiet':''}">
      <h3>${isQ ? t('ansH') : x.status==='accepted' ? t('reopenH') : `${t('fbH')} v${x.version}`}</h3>
      <textarea id="cabText" data-job="${esc(x.id)}" rows="4" placeholder="${esc(isQ?t('ansPh'):t('fbPh'))}"></textarea>
      ${att.length ? `<ul class="files att">${att.map((f,i)=>`<li><span class="ext">${esc((f.name.split('.').pop()||'').slice(0,4).toUpperCase())}</span><span class="nm">${esc(f.name)}</span><span class="sz">${fmtSize(f.size)}</span><button type="button" data-act="cabRm" data-i="${i}" aria-label="×">×</button></li>`).join('')}</ul>` : ''}
      <div class="fb-bar">
        <label class="link attach"><input type="file" id="cabFile" multiple hidden>＋ ${t('attach')}</label>
        <span class="sp"></span>
        ${x.status==='ready' ? `<button class="btn ghost" data-act="cabAccept" data-job="${esc(x.id)}">✓ ${t('accept')}</button>` : ''}
        <button class="btn" data-act="cabSend" data-job="${esc(x.id)}">${isQ?t('sendAns'):t('sendFb')}</button>
      </div></div>` : ''}

    <h3>${t('hist')}</h3>
    <ol class="hist">${(x.events||[]).slice().reverse().map(e=>`<li class="ev ev-${e.type}">${who(e)}<div class="evb"><div class="evh"><b>${esc(t('e_'+e.type))}${e.type==='result'?` v${e.v}`:''}</b><span>${esc(e.who)} · ${fdt(e.at)}</span></div>${e.text?`<p>${esc(e.text).replace(/\n/g,'<br>')}</p>`:''}${(e.files||[]).length?`<div class="evf">${e.files.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`:''}</div></li>`).join('')}</ol>
  </article>`;
}

function toast(msg){ CAB.toast = msg; renderCab(true); setTimeout(() => { CAB.toast = ''; const el = $('.toast'); if (el) el.remove(); }, 3200); }

async function cabDownload(b){
  if (isDemo()){ toast(t('demoDl')); return; }
  b.disabled = true; const old = b.innerHTML; b.textContent = '…';
  try {
    const r = await post({ action:'getfile', key:KEYV, id:b.dataset.job, fileId:b.dataset.fid });
    const bin = atob(r.data), u8 = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], {type:r.mime||'application/octet-stream'}));
    const a = document.createElement('a'); a.href = url; a.download = r.name || b.dataset.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
  } catch(err){ toast(t('loadErr')); }
  b.disabled = false; b.innerHTML = old;
}

async function cabSend(id, accept){
  const x = CAB.jobs.find(j=>j.id===id); if (!x) return;
  const text = (CAB.drafts[id]||'').trim(), att = CAB.att[id] || [];
  if (!accept && !text && !att.length){ const ta = $('#cabText'); if (ta){ ta.classList.add('bad'); ta.focus(); } return; }
  const btns = app.querySelectorAll('.fb-bar .btn'); btns.forEach(b=>b.disabled=true);
  const who = CAB.name || 'Сотрудник', at = new Date().toISOString();
  try {
    if (!isDemo()){
      if (accept) await post({ action:'accept', key:KEYV, id });
      else {
        const files = []; for (const f of att) if (f.size <= MAXMB*1048576) files.push({ name:f.name, mime:f.type||'application/octet-stream', data: await b64(f) });
        await post({ action:'comment', key:KEYV, id, text, files });
      }
    }
    if (accept){ x.status = 'accepted'; x.events.push({at, who, type:'accepted', v:x.version, text:'', files:[]}); }
    else { x.status = 'feedback'; x.events.push({at, who, type:'comment', v:x.version, text, files:att.map(f=>f.name)}); CAB.drafts[id] = ''; CAB.att[id] = []; }
    x.updated = at;
    toast(accept ? t('accOk') : t('sentOk'));
    if (!isDemo()) cabLoad(true);
  } catch(err){ btns.forEach(b=>b.disabled=false); toast(t('loadErr')); }
}

function updateCabBtn(){
  const b = $('#cabBtn'); if (!b) return;
  b.hidden = !hasCab(); b.textContent = t('cabBtn'); b.classList.toggle('on', view==='cab');
  const n = (CAB.jobs||[]).filter(x=>ACTION.includes(x.status)).length;
  b.dataset.n = n || '';
}

function cabClick(b, e){
  const act = b.dataset.act;
  if (act==='cab'){ openCab(); return true; }
  if (b.dataset.cf){ CAB.filter = b.dataset.cf; renderCab(true); return true; }
  if (b.dataset.job && !act){ CAB.sel = b.dataset.job; setHash('#cab/'+CAB.sel); renderCab(); if (innerWidth < 900) window.scrollTo(0,0); return true; }
  if (act==='cabBack'){ CAB.sel = null; setHash('#cab'); renderCab(); return true; }
  if (act==='cabNew'){ leaveCab(); S = { lang:S.lang, mode:null, step:0, a:{}, maxStep:0 }; for (const k in FILES) delete FILES[k]; store.del(); view='intro'; render(); window.scrollTo(0,0); return true; }
  if (act==='cabDl'){ cabDownload(b); return true; }
  if (act==='cabSend'){ cabSend(b.dataset.job, false); return true; }
  if (act==='cabAccept'){ cabSend(b.dataset.job, true); return true; }
  if (act==='cabRm'){ (CAB.att[CAB.sel]||[]).splice(+b.dataset.i,1); renderCab(true); return true; }
  if (act==='cabLogin'){ e.preventDefault(); const v = ($('#cabKey')||{}).value||''; if (v.trim()){ KEYV = v.trim(); kstore.set(KEYV); CAB.err=''; CAB.jobs=null; cabLoad(); } return true; }
  if (act==='cabLogout'){ KEYV=''; kstore.set(''); CAB.jobs=null; CAB.sel=null; renderCab(); return true; }
  return false;
}
document.addEventListener('input', e => { if (e.target.id==='cabText'){ CAB.drafts[e.target.dataset.job] = e.target.value; e.target.classList.remove('bad'); } }, true);
document.addEventListener('change', e => { if (e.target.id==='cabFile'){ const id = CAB.sel; CAB.att[id] = (CAB.att[id]||[]).concat(Array.from(e.target.files||[])); renderCab(true); } }, true);
document.addEventListener('submit', e => { if (e.target.closest('.login')) e.preventDefault(); });
window.addEventListener('hashchange', () => { const m = location.hash.match(/^#cab(?:\/(.+))?$/); if (m && hasCab()) openCab(m[1] ? decodeURIComponent(m[1]) : null); });

/* ---------- boot ---------- */
if (S.mode && saved && Object.keys(S.a).length) view = 'intro';
{ const m = location.hash.match(/^#cab(?:\/(.+))?$/); if (m && hasCab()){ if (m[1]) CAB.sel = decodeURIComponent(m[1]); view = 'cab'; } }
render();
if (view === 'cab') openCab(CAB.sel);
})();
