import express from 'express'
const app = express()

app.use(express.json())

app.get('/me',async(req,res)=>{
    console.log("Request received at /me")
})


app.listen(3000,()=>{
    console.log("Server is running on port 3000")
})