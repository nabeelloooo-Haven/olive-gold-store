let currentStep = 1;
const maxStep = 4;
const formSteps = [...document.querySelectorAll('.form-step')];
const sideSteps = [...document.querySelectorAll('.step')];
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const progressBar = document.getElementById('progressBar');

function updateStepUI(){
  formSteps.forEach(el=>el.classList.toggle('active', Number(el.dataset.panel)===currentStep));
  sideSteps.forEach((el,i)=>el.classList.toggle('active', i===currentStep-1));
  progressBar.style.width = `${(currentStep/maxStep)*100}%`;
  prevBtn.disabled = currentStep===1;
  nextBtn.textContent = currentStep===maxStep ? 'اعرض الاقتراحات' : 'التالي';
}

nextBtn.addEventListener('click', ()=>{
  if(currentStep===1){
    const land = Number(document.getElementById('landArea').value);
    if(!land || land<100){ alert('أدخل مساحة أرض صحيحة لا تقل عن 100 م²'); return; }
  }
  if(currentStep<maxStep){currentStep++;updateStepUI();}
  else generateResults();
});
prevBtn.addEventListener('click', ()=>{if(currentStep>1){currentStep--;updateStepUI();}});

document.querySelectorAll('.counter').forEach(counter=>{
  const input=counter.querySelector('input');
  counter.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    let val=Number(input.value);
    if(btn.dataset.action==='plus') val=Math.min(val+1,10);
    else val=Math.max(val-1,0);
    input.value=val;
  }));
});

function data(){
  return {
    land:Number(document.getElementById('landArea').value),
    apartments:Number(document.querySelector('input[name="apartments"]:checked').value),
    bedrooms:Number(document.getElementById('bedrooms').value),
    bathrooms:Number(document.getElementById('bathrooms').value),
    kitchens:Number(document.getElementById('kitchens').value),
    living:Number(document.getElementById('livingRooms').value),
    maid:document.querySelector('input[name="maidRoom"]:checked').value==='yes',
    notes:document.getElementById('notes').value.trim()
  }
}

function generateResults(){
  const d=data();
  const gross=d.land*0.65;
  const serviceRatio=Math.min(0.08 + (d.apartments-1)*0.025,0.16);
  const netFloor=gross*(1-serviceRatio);
  const apartmentArea=netFloor/d.apartments;
  const totalSpaces=d.bedrooms+d.bathrooms+d.kitchens+d.living+(d.maid?1:0);
  const needIndex=(d.bedrooms*14+d.bathrooms*5+d.kitchens*12+d.living*20+(d.maid?9:0)+18);
  const adequacy=apartmentArea/needIndex;

  document.getElementById('summaryBar').innerHTML=`
    <div>مساحة الأرض: <strong>${round(d.land)} م²</strong></div>
    <div>البناء المبدئي 65%: <strong>${round(gross)} م²</strong></div>
    <div>عدد الشقق بالدور: <strong>${d.apartments}</strong></div>
    <div>المساحة التقريبية لكل شقة: <strong>${round(apartmentArea)} م²</strong></div>`;

  const variants=[
    {name:'اقتراح الراحة',tag:'مساحات أوسع',desc:'يعطي أولوية للصالة وغرف النوم مع ممرات مريحة.',weights:{bed:.38,living:.25,kitchen:.11,bath:.11,service:.15}},
    {name:'اقتراح متوازن',tag:'الأكثر توازناً',desc:'توزيع متقارب بين المعيشة والغرف والخدمات.',weights:{bed:.35,living:.22,kitchen:.13,bath:.12,service:.18}},
    {name:'اقتراح الاستغلال',tag:'استغلال أعلى',desc:'يقلل المساحات المهدرة ويعطي مرونة أكبر للتأثيث والتخزين.',weights:{bed:.34,living:.20,kitchen:.12,bath:.10,service:.24}}
  ];

  document.getElementById('plansGrid').innerHTML=variants.map((v)=>{
    let status, note;
    if(adequacy>=1.2){status='مريح جداً';note='المساحة المتاحة مناسبة للبرنامج المطلوب، ويمكن إضافة عناصر مثل مجلس أو غرفة ضيوف بعد مراجعة أبعاد الأرض.'}
    else if(adequacy>=0.95){status='مناسب';note='المساحة قريبة من الاحتياج المثالي. يفضل ضبط أبعاد الغرف والممرات بعناية في التصميم التفصيلي.'}
    else {status='مضغوط';note='الطلبات كبيرة نسبياً مقارنة بالمساحة المتاحة لكل شقة. قد يلزم تقليل بعض العناصر أو دمج وظائف معينة.'}
    const bedA=apartmentArea*v.weights.bed;
    const livA=apartmentArea*v.weights.living;
    const kitA=apartmentArea*v.weights.kitchen;
    const bathA=apartmentArea*v.weights.bath;
    const servA=apartmentArea*v.weights.service;
    return `<article class="plan-card">
      <div class="plan-head"><span class="plan-tag">${v.tag}</span><h3>${v.name}</h3><p>${v.desc}</p></div>
      <div class="plan-body">
        <div class="metric"><span>مساحة الشقة</span><strong>${round(apartmentArea)} م²</strong></div>
        <div class="metric"><span>عدد الفراغات المطلوبة</span><strong>${totalSpaces}</strong></div>
        <div class="metric"><span>تقييم المساحة</span><strong>${status}</strong></div>
        <div class="distribution"><h4>توزيع مساحات مقترح</h4>
          ${bar('غرف النوم',bedA, v.weights.bed)}
          ${bar('الصالات',livA, v.weights.living)}
          ${bar('المطبخ',kitA, v.weights.kitchen)}
          ${bar('الحمامات',bathA, v.weights.bath)}
          ${bar('خدمات وممرات',servA, v.weights.service)}
        </div>
        <div class="plan-note">${note}</div>
      </div>
    </article>`
  }).join('');

  const msg=`مرحباً، استخدمت أداة تصميم البيت في الموقع.\nمساحة الأرض: ${round(d.land)} م²\nمساحة البناء المبدئية 65%: ${round(gross)} م²\nعدد الشقق في الدور: ${d.apartments}\nالمساحة التقريبية لكل شقة: ${round(apartmentArea)} م²\nالمطلوب لكل شقة: ${d.bedrooms} غرف نوم، ${d.bathrooms} حمامات، ${d.kitchens} مطبخ، ${d.living} صالة، غرفة عاملة: ${d.maid?'نعم':'لا'}${d.notes?`\nملاحظات: ${d.notes}`:''}\nأرغب بالتواصل لتطوير أحد الاقتراحات إلى مخطط هندسي.`;
  document.getElementById('whatsappBtn').href=`https://wa.me/966542277575?text=${encodeURIComponent(msg)}`;

  document.getElementById('designer').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');
  sideSteps.forEach((el,i)=>el.classList.toggle('active',i===4));
  document.getElementById('results').scrollIntoView({behavior:'smooth'});
}

function bar(label,area,ratio){return `<div class="bar-row"><div class="bar-label"><span>${label}</span><span>≈ ${round(area)} م²</span></div><div class="bar"><i style="width:${Math.min(ratio*220,100)}%"></i></div></div>`}
function round(n){return Math.round(n*10)/10}
