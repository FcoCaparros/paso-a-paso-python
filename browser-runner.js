'use strict';
function runInBrowser(exercise, code, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./python-worker.mjs', location.href), {type:'module'});
    let timer, finished=false, results=[];
    const finish=(error)=>{
      if(finished)return; finished=true;clearTimeout(timer);worker.terminate();
      if(error)reject(error);else resolve({results});
    };
    const arm=(ms, callback)=>{clearTimeout(timer);timer=setTimeout(callback,ms);};
    onProgress('Preparando Python en tu navegador… la primera vez puede tardar.');
    arm(150000,()=>finish(new Error('No se pudo descargar Python a tiempo. Comprueba tu conexión.')));
    worker.onerror=()=>finish(new Error('No se pudo iniciar Python. Recarga la página y revisa tu conexión.'));
    worker.onmessage=({data})=>{
      if(data.type==='progress')onProgress(data.message);
      if(data.type==='start'){
        onProgress(`Evaluando caso ${data.index+1} de ${exercise.tests.length}…`);
        arm(6000,()=>{
          for(let i=results.length;i<exercise.tests.length;i++)results.push({status:'error',input:exercise.tests[i].input,expected:exercise.tests[i].expected,actual:'',stderr:'',seconds:i===data.index?6:0,message:i===data.index?'Tiempo agotado. Revisa si tu ciclo termina y si marcas los nodos visitados.':'Caso no ejecutado: corrige primero el límite de tiempo del caso anterior.'});
          finish();
        });
      }
      if(data.type==='result'){clearTimeout(timer);results.push(data.result);}
      if(data.type==='done')finish();
      if(data.type==='failure')finish(new Error(data.message));
    };
    worker.postMessage({code,tests:exercise.tests});
  });
}
