import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { UserRepository } from "../repositories/UsersRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import SendMailService from "../services/SendMailService";
import {resolve} from 'path';
import { AppError } from "../errors/AppError";

class SendMailController{
    
    async execute(request: Request,response: Response){
        const { email, survey_id } = request.body;
        
        const userRepository = getCustomRepository(UserRepository);
        const surveyRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository)
        
        const npsPath = resolve(__dirname,"..","views","emails","npsMail.hbs");

        //Buscar user no banco
        const user = await userRepository.findOne({email});
        if(!user){
            throw new AppError("User does not exist");
        }        
        
        //Buscar survey no banco
        const survey = await surveyRepository.findOne({id: survey_id});
        if(!survey){
            throw new AppError("Survey does not exist");
        }

        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id,survey_id: survey.id,value: null},
            relations: ["user","survey"]
        })

        const npsVariables = {
            name:  user.name,
            title: survey.title,
            description: survey.description,
            surveyUser_id: "",
            link: process.env.URL_MAIL
        }

        if(surveyUserAlreadyExists)
        {
            npsVariables.surveyUser_id=surveyUserAlreadyExists.id;
            await SendMailService.execute(email,survey.title,npsPath,npsVariables);
            return response.json(surveyUserAlreadyExists)
        }
        else{
            //Salvar as informações na tabela surveyUser
            const surveyUser = await surveysUsersRepository.create({
                user_id: user.id,
                survey_id
            })
            surveysUsersRepository.save(surveyUser);
            npsVariables.surveyUser_id=surveyUser.id;
            await SendMailService.execute(email,survey.title,npsPath,npsVariables);            
            //Enviar email para o usuário
            return response.json(surveyUser);
        }
    }
}


export { SendMailController };