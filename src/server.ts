import app from "./app.js"

app.listen({ port: Number(process.env.PORT) || 3001 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server listening on ${address}`)
})