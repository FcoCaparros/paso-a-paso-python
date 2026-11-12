import {loadPyodide} from 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs';

self.onmessage=async({data})=>{
  try {
    const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'});
    self.postMessage({type:'progress',message:'Preparando las bibliotecas del ejercicio…'});
    // La sintaxis incorrecta debe aparecer como error de cada caso, no de descarga.
    const packages=[];
    if(/\b(?:numpy|pandas)\b/.test(data.code))packages.push('numpy');
    if(/\bpandas\b/.test(data.code))packages.push('pandas');
    if(packages.length)await py.loadPackage(packages);
    py.runPython(`
import io, sys, json, time, traceback, tempfile, os
from contextlib import redirect_stdout, redirect_stderr

class SalidaLimitada(io.StringIO):
    def write(self, texto):
        if self.tell() + len(texto) > 64000:
            raise RuntimeError('Demasiada salida. Revisa los print dentro de tus ciclos.')
        return super().write(texto)

def evaluar(codigo, entrada, esperado):
    inicio = time.monotonic()
    salida, errores = SalidaLimitada(), SalidaLimitada()
    stdin_previo, cwd_previo = sys.stdin, os.getcwd()
    fallo = ''
    with tempfile.TemporaryDirectory() as carpeta:
        try:
            os.chdir(carpeta)
            sys.stdin = io.StringIO(entrada)
            with redirect_stdout(salida), redirect_stderr(errores):
                exec(compile(codigo, 'tu_codigo.py', 'exec'), {'__name__': '__main__'})
        except SystemExit as error:
            if error.code not in (None, 0): fallo = str(error)
        except BaseException:
            fallo = traceback.format_exc(limit=8)
        finally:
            sys.stdin = stdin_previo
            os.chdir(cwd_previo)
    actual = salida.getvalue()
    def normalizar(texto):
        texto = texto.replace('\\r\\n', '\\n')
        return texto[:-1] if texto.endswith('\\n') else texto
    estado = 'error' if fallo else ('pass' if normalizar(actual) == normalizar(esperado) else 'fail')
    mensaje = fallo or ('La salida coincide.' if estado == 'pass' else 'El código terminó, pero la salida es distinta. Revisa formato, espacios y mayúsculas.')
    return json.dumps(dict(status=estado,input=entrada,expected=esperado,actual=actual,message=mensaje,stderr=errores.getvalue(),seconds=round(time.monotonic()-inicio,2)))
`);
    const evaluate=py.globals.get('evaluar');
    for(let i=0;i<data.tests.length;i++){
      self.postMessage({type:'start',index:i});
      const test=data.tests[i];
      const result=JSON.parse(evaluate(data.code,test.input,test.expected));
      self.postMessage({type:'result',result});
    }
    evaluate.destroy();
    self.postMessage({type:'done'});
  } catch(error){self.postMessage({type:'failure',message:'No se pudo preparar el evaluador: '+String(error.message||error)});}
};
