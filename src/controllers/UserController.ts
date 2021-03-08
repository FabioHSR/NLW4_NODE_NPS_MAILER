import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { UserRepository } from "../repositories/UsersRepository";
import * as yup from 'yup'
import { AppError } from "../errors/AppError";

class UserController {
    async create(request: Request, response: Response){
        const {name,email} = request.body;

        const schema = yup.object().shape({
            name: yup.string().required("Nome inválido."),
            email: yup.string().email().required("e-mail inválido")
        })


        try{
            await schema.validate(request.body,{abortEarly: false})
 
        }catch(err){

            return response.status(400).json({erro:err})
        }

        const usersRepository = getCustomRepository(UserRepository);
        const userAlreadyExists = await usersRepository.findOne({
            email
        })
        if(userAlreadyExists){
            throw new AppError( "User already exists");
        }

        const user = usersRepository.create({
                name,email
        });

        await usersRepository.save(user);


        return response.status(201).json(user);
    }
}   

// app.get("/",(request, response)=>{
//     return response.json({
//         message: "Hello World"
//     })
// })

// app.post("/", (request, response)=>{
//     return response.json({
//         message:"Dados salvos com sucesso."
//     })
// })

export { UserController };
