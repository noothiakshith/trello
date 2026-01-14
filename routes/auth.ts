import { password } from 'bun'
import express from 'express'
const router = express.Router()
import * as z from "zod"
import { prisma } from '../db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const loginschema = z.object({
    email:z.string().email(),
    password:z.string().min(6)
})

const signupschema = z.object({
    name:z.string().min(3),
    email:z.string().email(),
    password:z.string().min(6)
})
router.post('/login',async(req,res,next)=>{
    const{email,password} = loginschema.parse(req.body)
    const check = await prisma.user.findUnique({
        where:{
            email:email
        }
    })
    if(!check){
        return res.status(401).json("the user is not found");
    }
    else{
        try{
            const compare = await bcrypt.compare(password,check.password);
            if(!compare){
                return res.status(401).json("the password is wrong");
            }else{
                const token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60 * 60),id:check.id}, 'secret');
                console.log(token);
                  return res.status(200).json({message: "Login successful",token});
            }
        }
        catch(err){
            console.log(err)
        }
    }
})

router.post('/register',async(req,res,next)=>{
    const{name,email,password} = signupschema.parse(req.body);
    const check = await prisma.user.findUnique({
        where:{
            email:email
        }
    })
    if(check){
        return res.status(401).json("User Already Exists");
    }
    else{
        const hashed = await bcrypt.hash(password,10);
        const newuser = await prisma.user.create({
            data:{
                name:name,
                email:email,
                password:hashed
            }
        })
        console.log(newuser);
        return res.status(200).json("User is Sucessfully Created")
    }
})

export default router