//  This is a prototype server which is fully extensible. We'll utilize this in our future Alexa codes


// We import all packages like we did in our old servers: 
import express from "express";
import axios from "axios";
import morgan from "morgan";

// We import Alexa from ask-sdk-core & ExpressAdapter from ask-sdk-express-adapter as the basic required packages
import Alexa, { SkillBuilders } from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';

// Next, We integrate the database
import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://dbUser:dbPass@cluster0.7bnpj.mongodb.net/lib-users?retryWrites=true&w=majority');

// Creating a prototype object which will be passed on to DB on each session created. Here the parameters are skill name, user name & session time
const Usage = mongoose.model('Usage', {
  skillName: String,
  userName: String,
  createdOn: { type: Date, default: Date.now },
});

// we start our express app and different objects such as skillBuilder, skill & adapter as the basics
const app = express();
app.use(morgan("dev"))
const PORT = process.env.PORT || 3000;
const skillBuilder = Alexa.SkillBuilders.custom();
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);


// Code imported from Alexa skill:

// We'll now work solely on handlers and developing them for custom functionality or features:

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speakOutput = 'Fallback intent: Sorry, I had trouble doing what you asked. Please try again.';
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'You will now talk to Kashif';
    const reprompt = 'I am your virtual assistant. you can ask for the menu';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(reprompt)
      .withSimpleCard("Kababjees", speakOutput)
      .getResponse();
  }
};

const introHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'intro';
    },
    handle(handlerInput) {
      const speakOutput = 'Your Name is Kashif!';
      const reprompt = 'I am your virtual assistant. you can ask for the menu';
  
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();
    }
  }

const skillBuilder = SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    introHandler,
  )
  .addErrorHandlers(
    ErrorHandler
  )


app.post('/api/v1/webhook-alexa', adapter.getRequestHandlers());

app.use(express.json())
// app.get('/profile', (req, res, next) => {
//   res.send("this is a profile");
// });

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});