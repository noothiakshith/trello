import express, { Request } from 'express'
import { verifyUser } from '../middleware'
import * as z from 'zod'
import { prisma } from '../db'

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
      }
    }
  }
}

const router = express.Router()

const taskSchema = z.object({
    title: z.string(),
    description: z.string()
})
const paramSchema = z.object({
    boardId: z.string()

})
const taskupdate = z.object({
    status:z.enum(['IN_PROGRESS','DONE'])
})

router.post('/:boardId/create-task', verifyUser, async (req, res, next) => {
  try {
    const { title, description } = taskSchema.parse(req.body)
    const { boardId } = paramSchema.parse(req.params)

    const isMember = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId: req.user.id,
          boardId,
        }
      }
    })

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied to board' })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        boardId,
        createdById: req.user.id,
      }
    })

    return res.status(201).json(task)
  } catch (error) {
    next(error)
  }
})

router.patch('/:boardId/:taskId/:update-task', verifyUser, async(req,res,next)=>{
    const {boardId} = paramSchema.parse(req.params)
    const status = req.body
    const usercheck = await prisma.boardMember.findUnique({
        where:{
            id:req.user.id,
            boardId:boardId
        }
    })
    if(usercheck){
        try{
            const updatetasks = await prisma.task.update({
                where:{
                    boardId:boardId,
                },
                data:{
                    status:status
                }
            })
            return res.status(200).json("updated")
        }
        catch(err){
            console.log(err)
        }
    }
})


router.delete('/:taskId/delete',async(req,res,next)=>{
    const user = req.user.id
    const check = await prisma.task.findFirst({
        where:{
            id:req.params.taskId,
        },
        include:{
            board:true
        }
    })

    const checkmemeber = await prisma.boardMember.findUnique({
        where:{
            userId_boardId:{
                userId:user,
                boardId:check?.boardId ?? ''
            }
        }
    })
    if(checkmemeber){
        try{
            const remove  = await prisma.task.delete({
                where:{
                    id:req.params.taskId
                }
            })
            return res.status(200).json("removed")
        }catch(err){
            console.log(err)
        }
    }
})


router.get('/boards', verifyUser, async (req, res, next) => {
  try {
    const userId = req.user.id

    // 1️⃣ Query membership table
    const memberships = await prisma.boardMember.findMany({
      where: {
        userId
      },
      include: {
        board: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 2️⃣ Shape response
    const boards = memberships.map(m => ({
      id: m.board.id,
      name: m.board.name
    }))

    return res.json(boards)
  } catch (error) {
    next(error)
  }
})

export default router
