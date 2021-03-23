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
        origin: process.env.URL_ORIGEN,
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




    //CONEXION INICIAL
    socket.on('conectado', (datos) => {
        //crear nueva sala
        const { sala, nick } = datos
        let SALA = 0;
        //console.log("Sala antes de: ", salas)

        if (salas.length === 0) {
            //console.log("Crea la primera sala")
            salas.push({ id: sala, playerA: nick, dos: false, turno: true, sok1: socket.id, reiniciar: false })
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
                salas.push({ id: sala, playerA: nick, dos: false, turno: true, sok1: socket.id, reiniciar: false, again1: false, again2: false })
                SALA = salas.length - 1
            } else {
                if (salas[SALA].playerB?.length > 0 && salas[SALA].playerA?.length > 0) {
                    //console.log("Solo pueden haber 2 jugadores.")
                    io.to(socket.id).emit("sala", {
                        noEntras: true
                    });
                } else {
                    if (salas[SALA].playerA?.length > 0) {
                        salas[SALA].playerB = nick
                        salas[SALA].sok2 = socket.id
                        salas[SALA].dos = true
                    } else {
                        salas[SALA].playerA = nick
                        salas[SALA].sok1 = socket.id
                        salas[SALA].dos = true
                    }
                    //mensaje para mi mismo?
                    io.to(socket.id).emit("sala", {
                        quien: salas[SALA].playerA,
                        dos: salas[SALA].dos,
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


        console.log("Cantidad de salas: " + salas.length + ' Jugador A: ' + salas[SALA].playerA + ' Jugador B: ' + salas[SALA].playerB + ' Sala: ' + sala)

    })

    //SALAS DE JUEGOS
    socket.on("sala", (datos) => {
        const { sala, fire, listo, destruido, afecta, fin, otraVez } = datos;
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

        //console.log("Turno: ", salas[SALA].turno)


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
        } else if (otraVez) {
            //otro jugador listo para repetir.
            if (salas[SALA].again1 && !salas[SALA].again2) {
                console.log("Entra 2")
                salas[SALA].again2 = true
            }
            //un jugador listo para repetir
            if (!salas[SALA].again1 && !salas[SALA].again2) {
                console.log("Entra 1")
                salas[SALA].again1 = true
            }

            //ambos listos para jugar.
            if (salas[SALA].again1 && salas[SALA].again2) {
                console.log("Entra 3")
                salas[SALA].again1 = false
                salas[SALA].again2 = false
                //reiniciamos a ambos?
                socket.in(sala).emit("sala", {
                    again: true
                })
            }



        }

    })


    // //ABANDONO DE SALA
    // socket.leave(sala, () => {
    //     console.log("Se fue el usuario " + socket.id)
    // });
    // //io.to("sala").emit(`user ${socket.id} has left the room`);

    socket.on("disconnecting", function () {
        //var rooms = socket.rooms;
        console.log("Persona id disconnecting " + socket.id);
        let salaSale;
        let listo1;
        let listo2;
        //let SALA;

        salas.forEach((salon, index) => {
            if (salon.sok1 === socket.id) {
                salon.sok1 = ''
                salon.playerA = ''
                salon.dos = false
                salaSale = salon.id
                listo1 = salon.again1
            }
            if (salon.sok2 === socket.id) {
                salon.sok2 = ''
                salon.playerB = ''
                salon.dos = false
                salaSale = salon.id
                listo2 = salon.again2
            }
        })
        if (salaSale?.length > 0) {
            socket.to(salaSale).emit("sala", {
                reiniciar: true
            })
        }
        //console.log("SALAS>>>>>>>>", salas)
        // You can loop through your rooms and emit an action here of leaving
    });



});

servidor.listen(process.env.PORT, () => {
    console.log("Servidor inicializado en puerto " + process.env.PORT);
})