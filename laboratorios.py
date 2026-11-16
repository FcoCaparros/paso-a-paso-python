"""Ejemplos NATIVOS originales. Guía y desafíos en PLAN-DE-ESTUDIO.md.
Uso: python laboratorios.py hilos|red|gui|api|cliente-api
No ejecutar en el editor web: requiere Python de escritorio.
"""
import argparse


def hilos():
    from threading import Thread, Lock, Event
    contador = 0
    candado = Lock()
    salida = Event()

    def trabajar():
        nonlocal contador
        salida.wait()
        for _ in range(1000):
            with candado:
                contador += 1

    trabajadores = [Thread(target=trabajar) for _ in range(2)]
    for hilo in trabajadores:
        hilo.start()
    salida.set()
    for hilo in trabajadores:
        hilo.join()
    print('Contador:', contador)
    assert contador == 2000


def recibir_exacto(conexion, cantidad):
    acumulado = bytearray()
    while len(acumulado) < cantidad:
        fragmento = conexion.recv(cantidad - len(acumulado))
        if not fragmento:
            raise ConnectionError('Conexión cerrada antes de completar el mensaje')
        acumulado.extend(fragmento)
    return bytes(acumulado)


def enviar(conexion, texto):
    cuerpo = texto.encode('utf-8')
    if len(cuerpo) > 65536:
        raise ValueError('Mensaje demasiado largo')
    conexion.sendall(len(cuerpo).to_bytes(4, 'big') + cuerpo)


def recibir(conexion):
    largo = int.from_bytes(recibir_exacto(conexion, 4), 'big')
    if largo > 65536:
        raise ValueError('Mensaje demasiado largo')
    return recibir_exacto(conexion, largo).decode('utf-8')


def red():
    import socket
    from threading import Thread
    from queue import Queue
    errores = Queue()
    # El sistema elige un puerto libre. Solo escucha en este computador.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as servidor:
        servidor.bind(('127.0.0.1', 0))
        servidor.listen(1)
        servidor.settimeout(5)
        direccion = servidor.getsockname()

        def atender():
            try:
                conexion, _ = servidor.accept()
                with conexion:
                    conexion.settimeout(5)
                    mensaje = recibir(conexion)
                    enviar(conexion, mensaje.upper())
            except Exception as error:
                errores.put(error)

        hilo = Thread(target=atender)
        hilo.start()
        try:
            with socket.create_connection(direccion, timeout=5) as cliente:
                enviar(cliente, 'hola, programación')
                respuesta = recibir(cliente)
                print('Respuesta:', respuesta)
                assert respuesta == 'HOLA, PROGRAMACIÓN'
        finally:
            hilo.join(timeout=6)
        if not errores.empty():
            raise errores.get()
        if hilo.is_alive():
            raise RuntimeError('El servidor no terminó a tiempo')


def gui():
    from PyQt6.QtCore import QTimer, QThread, pyqtSignal
    from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QPushButton

    class Trabajador(QThread):
        avance = pyqtSignal(int)

        def run(self):
            for numero in range(1, 11):
                if self.isInterruptionRequested():
                    return
                # Simula trabajo lento en el worker, nunca en el hilo de la GUI.
                self.msleep(200)
                if self.isInterruptionRequested():
                    return
                self.avance.emit(numero)

    class Ventana(QWidget):
        def __init__(self):
            super().__init__()
            self.setWindowTitle('Laboratorio: timer y worker')
            self.segundos = 0
            self.cerrando = False
            self.worker = None
            layout = QVBoxLayout(self)
            self.reloj = QLabel('Segundos: 0')
            self.estado = QLabel('Listo')
            self.boton = QPushButton('Iniciar trabajo')
            self.pausa = QPushButton('Pausar / reanudar reloj')
            for widget in [self.reloj, self.estado, self.boton, self.pausa]:
                layout.addWidget(widget)
            self.timer = QTimer(self)
            self.timer.timeout.connect(self.tick)
            self.timer.start(1000)
            self.boton.clicked.connect(self.iniciar)
            self.pausa.clicked.connect(self.alternar)

        def tick(self):
            self.segundos += 1
            self.reloj.setText(f'Segundos: {self.segundos}')

        def alternar(self):
            if self.timer.isActive():
                self.timer.stop()
            else:
                self.timer.start(1000)

        def iniciar(self):
            self.boton.setEnabled(False)
            self.worker = Trabajador(self)
            self.worker.avance.connect(self.mostrar_avance)
            self.worker.finished.connect(self.termino)
            self.worker.start()

        def mostrar_avance(self, numero):
            # Slot del objeto Ventana: actualiza widgets en el hilo principal.
            self.estado.setText(f'Paso {numero}/10')

        def termino(self):
            self.boton.setEnabled(True)
            if self.cerrando:
                self.close()

        def closeEvent(self, event):
            if self.worker is not None and self.worker.isRunning():
                self.cerrando = True
                self.boton.setEnabled(False)
                self.worker.requestInterruption()
                event.ignore()  # finished volverá a solicitar el cierre.
            else:
                self.timer.stop()
                event.accept()

    app = QApplication([])
    ventana = Ventana()
    ventana.show()
    app.exec()


def api():
    from flask import Flask, request
    app = Flask(__name__)

    @app.post('/doble')
    def doble():
        datos = request.get_json(silent=True)
        if not isinstance(datos, dict) or type(datos.get('valor')) is not int:
            return {'error': 'Se requiere un valor entero'}, 400
        return {'resultado': datos['valor'] * 2}, 200

    # Servidor de desarrollo local para el ejercicio, no alojamiento público.
    app.run(host='127.0.0.1', port=5055, debug=False)


def cliente_api():
    import requests
    for cuerpo in [{'valor': 3}, {'valor': 'hola'}, {'valor': 0}]:
        respuesta = requests.post('http://127.0.0.1:5055/doble', json=cuerpo, timeout=5)
        print(respuesta.status_code, respuesta.json())


if __name__ == '__main__':
    opciones = {'hilos': hilos, 'red': red, 'gui': gui, 'api': api, 'cliente-api': cliente_api}
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('laboratorio', choices=opciones)
    argumentos = parser.parse_args()
    opciones[argumentos.laboratorio]()
