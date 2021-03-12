const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const servidor = http.createServer(app);

app.use(cors());
const io = socketio(servidor, {
    cors: {
        origin: "URL_ORIGEN",
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
            //console.log("Crea la primera sala")
            salas.push({ id: sala, playerA: nick, dos: false, turno: true })
        } else {
            let encuentra = false
            salas.forEach((salon, index) => {
                if (salon.id === sala) {
                    //console.log("Entrando a sala existente")
                    SALA = index
                    encuentra = true
                }
            })
            if (!encuentra) {
                //console.log("Crea una sala nueva B")
                salas.push({ id: sala, playerA: nick, dos: false, turno: true })
                SALA = salas.length - 1
            } else {
                if (salas[SALA].playerB) {
                    //console.log("Solo pueden haber 2 jugadores.")
                    io.to(socket.id).emit("sala", {
                        noEntras: true
                    });
                } else {
                    salas[SALA].playerB = nick
                    salas[SALA].dos = true
                    //mensaje para mi mismo?
                    io.to(socket.id).emit("sala", {
                        quien: salas[SALA].playerA,
                        mismo: "mismo"
                    });
                }
            }

        }
        //console.log("SALAS: ", salas)
        //console.log(salas[SALA])
        //console.log("Usuario " + nick + " conectado a la sala: " + sala)
        socket.join(sala)

        socket.to(sala).emit("sala", {
            dos: salas[SALA].dos,
            quien: nick,
            turno: true
        })



    })

    socket.on("sala", (datos) => {
        const { sala, fire, listo, destruido, afecta, fin } = datos;
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


        salas[SALA].turno = !salas[SALA].turno

        console.log("Turno: ", salas[SALA].turno)


        if (listo) {
            //console.log("listo")
            salas[SALA].turno = true
            socket.to(sala).emit("sala", {
                listo: true,
                turno: salas[SALA].turno
            })
        } else if (destruido) {
            //console.log("destruido")
            salas[SALA].turno = !salas[SALA].turno
            socket.to(sala).emit("sala", {
                destruido,
                turno: salas[SALA].turno
            })
        } else if (fire) {
            //console.log("fire", fire)
            socket.to(sala).emit("sala", {
                fire,
                turno: salas[SALA].turno
            })
        } else if (afecta) {

            //console.log("afecta")
            socket.to(sala).emit("sala", {
                afecta,
                turno: salas[SALA].turno
            })
        } else if (fin) {
            //console.log("fin")
            socket.to(sala).emit("sala", {
                fin,
                turno: salas[SALA].turno
            })
        }



    })




});

servidor.listen(process.env.PORT, () => {
    console.log("Servidor inicializado en puerto " + process.env.PORT);
})