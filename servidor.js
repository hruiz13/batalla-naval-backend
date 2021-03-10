const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const e = require('cors');

const app = express();
const servidor = http.createServer(app);

app.use(cors());
const io = socketio(servidor, {
    cors: {
        origin: "http://192.168.3.221:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

app.get('/', (req, res) => {
    res.send("Backend")
})

let salas = []

io.on('connection', socket => {

    //cada que alguien entre esto se ejecuta.
    socket.on('conectado', (datos) => {
        //crear nueva sala
        const { sala, nick } = datos
        let SALA = 0;
        //console.log("Sala antes de: ", salas)
        console.log("Cantidad de salas: " + salas.length)
        if (salas.length === 0) {
            console.log("Crea la primera sala")
            salas.push({ id: sala, playerA: nick })
        } else {
            let encuentra = false
            salas.forEach((salon, index) => {
                if (salon.id === sala) {
                    console.log("Entrando a sala existente")
                    SALA = index
                    encuentra = true
                }
            })
            if (!encuentra) {
                console.log("Crea una sala nueva B")
                salas.push({ id: sala, playerA: nick })
                SALA = salas.length - 1
            } else {
                if (salas[SALA].playerB) {
                    console.log("Solo pueden haber 2 jugadores.")
                } else {
                    salas[SALA].playerB = nick
                }
            }

        }
        console.log("SALAS: ", salas)
        console.log(salas[SALA])
        //console.log("Usuario " + nick + " conectado a la sala: " + sala)
        socket.join(sala)

    })

    socket.on("sala", (datos) => {
        const { sala, fire, listo, destruido, afecta } = datos;
        //console.log("Llego a " + sala)
        //console.log("LOS DATOS SON: ", datos)
        let SALA = 0;
        let turno = 0;
        //buscamos la sala que llega.
        salas.forEach((salon, index) => {
            if (salon.id === sala) {
                SALA = index
                encuentra = true
            }
        })

        if (listo) {
            console.log("listo")
            socket.to(sala).emit("sala", {
                listo: true,
                turno
            })
        } else if (destruido) {
            console.log("destruido")
            socket.to(sala).emit("sala", {
                destruido,
                turno
            })
        } else if (fire) {
            console.log("fire")
            socket.to(sala).emit("sala", {
                fire,
                turno
            })
        } else if (afecta) {
            console.log("afecta")
            socket.to(sala).emit("sala", {
                afecta,
                turno
            })
        }
    })
});

servidor.listen(3001, () => {
    console.log("Servidor inicializado");
})